import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TerminationRequest, TerminationRequestDocument } from '../models/termination-request.schema';
import { ClearanceChecklist, ClearanceChecklistDocument } from '../models/clearance-checklist.schema';
import { Onboarding, OnboardingDocument } from '../models/onboarding.schema';
import { EmployeeProfile, EmployeeProfileDocument } from '../../employee-profile/models/employee-profile.schema';
import { EmployeeSystemRole, EmployeeSystemRoleDocument } from '../../employee-profile/models/employee-system-role.schema';
import { AppraisalRecord, AppraisalRecordDocument } from '../../performance/models/appraisal-record.schema';
import { LeaveEntitlement, LeaveEntitlementDocument } from '../../leaves/models/leave-entitlement.schema';
import { NotificationService } from './notification.service';
import { ITProvisioningService, RevocationRequest } from './it-provisioning.service';
import { TerminationStatus } from '../enums/termination-status.enum';
import { TerminationInitiation } from '../enums/termination-initiation.enum';
import { ApprovalStatus } from '../enums/approval-status.enum';
import { OnboardingTaskStatus } from '../enums/onboarding-task-status.enum';
import { AppraisalRecordStatus } from '../../performance/enums/performance.enums';
import {
  InitiateTerminationReviewDto,
  UpdateTerminationStatusDto,
  CreateResignationRequestDto,
  ReviewResignationDto,
  CreateOffboardingChecklistDto,
  AddEquipmentToChecklistDto,
  DepartmentSignOffDto,
  UpdateEquipmentReturnDto,
  UpdateAccessCardReturnDto,
  ScheduleAccessRevocationDto,
  TriggerFinalSettlementDto,
  RevokeAccessImmediatelyDto,
} from '../dto/offboarding.dto';

/**
 * OffboardingService handles:
 * - OFF-001: Termination reviews based on performance data
 * - OFF-006: Offboarding checklist (IT assets, ID cards, equipment)
 * - OFF-007: System/account access revocation (via ITProvisioningService and EmployeeSystemRole)
 * - OFF-010: Multi-department exit clearance sign-offs
 * - OFF-013: Benefits termination & final pay calculation (with leave balance integration)
 * - OFF-018/019: Employee resignation requests (via TerminationRequest with EMPLOYEE initiator)
 */
@Injectable()
export class OffboardingService {
  constructor(
    @InjectModel(TerminationRequest.name)
    private readonly terminationRequestModel: Model<TerminationRequestDocument>,
    @InjectModel(ClearanceChecklist.name)
    private readonly clearanceChecklistModel: Model<ClearanceChecklistDocument>,
    @InjectModel(Onboarding.name)
    private readonly onboardingModel: Model<OnboardingDocument>,
    @InjectModel(EmployeeProfile.name)
    private readonly employeeProfileModel: Model<EmployeeProfileDocument>,
    @InjectModel(EmployeeSystemRole.name)
    private readonly employeeSystemRoleModel: Model<EmployeeSystemRoleDocument>,
    @InjectModel(AppraisalRecord.name)
    private readonly appraisalRecordModel: Model<AppraisalRecordDocument>,
    @InjectModel(LeaveEntitlement.name)
    private readonly leaveEntitlementModel: Model<LeaveEntitlementDocument>,
    private readonly notificationService: NotificationService,
    private readonly itProvisioningService: ITProvisioningService,
  ) {}

  // ============================================================
  // OFF-001: Performance Data Lookup (for termination review)
  // ============================================================

  /**
   * Get employee performance data for termination review decision
   * Uses AppraisalRecord from performance module
   */
  async getEmployeePerformanceData(employeeId: string): Promise<{
    hasPerformanceData: boolean;
    latestAppraisal: {
      totalScore: number | null;
      overallRatingLabel: string | null;
      improvementAreas: string | null;
      strengths: string | null;
      status: AppraisalRecordStatus | null;
      managerSubmittedAt: Date | null;
    } | null;
    cachedPerformance: {
      lastAppraisalScore: number | null;
      lastAppraisalRatingLabel: string | null;
      lastAppraisalDate: Date | null;
    } | null;
  }> {
    // Try to get the latest appraisal record
    const latestAppraisal = await this.appraisalRecordModel
      .findOne({
        employeeProfileId: new Types.ObjectId(employeeId),
        status: { $in: [AppraisalRecordStatus.HR_PUBLISHED, AppraisalRecordStatus.MANAGER_SUBMITTED] },
      })
      .sort({ managerSubmittedAt: -1 })
      .exec();

    // Also get cached performance from employee profile
    const employeeProfile = await this.employeeProfileModel.findById(employeeId).exec();

    if (!latestAppraisal && !employeeProfile?.lastAppraisalScore) {
      return {
        hasPerformanceData: false,
        latestAppraisal: null,
        cachedPerformance: null,
      };
    }

    return {
      hasPerformanceData: true,
      latestAppraisal: latestAppraisal
        ? {
            totalScore: latestAppraisal.totalScore ?? null,
            overallRatingLabel: latestAppraisal.overallRatingLabel ?? null,
            improvementAreas: latestAppraisal.improvementAreas ?? null,
            strengths: latestAppraisal.strengths ?? null,
            status: latestAppraisal.status,
            managerSubmittedAt: latestAppraisal.managerSubmittedAt ?? null,
          }
        : null,
      cachedPerformance: employeeProfile
        ? {
            lastAppraisalScore: employeeProfile.lastAppraisalScore ?? null,
            lastAppraisalRatingLabel: employeeProfile.lastAppraisalRatingLabel ?? null,
            lastAppraisalDate: employeeProfile.lastAppraisalDate ?? null,
          }
        : null,
    };
  }

  // ============================================================
  // OFF-013: Leave Balance Lookup (for final settlement)
  // ============================================================

  /**
   * Get employee leave balance for final settlement calculation
   * Uses LeaveEntitlement from leaves module
   */
  async getLeaveBalanceForSettlement(employeeId: string): Promise<{
    totalRemainingDays: number;
    entitlements: Array<{
      leaveTypeId: string;
      remaining: number;
      taken: number;
      pending: number;
    }>;
  }> {
    const entitlements = await this.leaveEntitlementModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .exec();

    const totalRemainingDays = entitlements.reduce(
      (sum, ent) => sum + (ent.remaining || 0),
      0,
    );

    return {
      totalRemainingDays,
      entitlements: entitlements.map((ent) => ({
        leaveTypeId: ent.leaveTypeId.toString(),
        remaining: ent.remaining || 0,
        taken: ent.taken || 0,
        pending: ent.pending || 0,
      })),
    };
  }

  // ============================================================
  // Employee Context (for settlement)
  // ============================================================

  /**
   * Get employee offboarding context (banking, tenure info)
   */
  async getEmployeeOffboardingContext(employeeId: string): Promise<{
    employeeNumber: string | null;
    dateOfHire: Date | null;
    bankName: string | null;
    bankAccountNumber: string | null;
    primaryDepartmentId: string | null;
    status: string;
  } | null> {
    const employee = await this.employeeProfileModel.findById(employeeId).exec();
    if (!employee) {
      return null;
    }

    return {
      employeeNumber: employee.employeeNumber,
      dateOfHire: employee.dateOfHire,
      bankName: employee.bankName ?? null,
      bankAccountNumber: employee.bankAccountNumber ?? null,
      primaryDepartmentId: employee.primaryDepartmentId?.toString() ?? null,
      status: employee.status,
    };
  }

  // ============================================================
  // OFF-007: System Role Deactivation
  // ============================================================

  /**
   * Deactivate employee system role (blocks auth access)
   */
  async deactivateSystemRole(employeeId: string): Promise<boolean> {
    const result = await this.employeeSystemRoleModel.updateOne(
      { employeeProfileId: new Types.ObjectId(employeeId) },
      { $set: { isActive: false } },
    );

    return result.modifiedCount > 0;
  }

  // ============================================================
  // OFF-001: Termination Reviews
  // ============================================================

  /**
   * Initiate HR/Manager termination review
   */
  async initiateTerminationReview(dto: InitiateTerminationReviewDto): Promise<TerminationRequest> {
    const terminationRequest = new this.terminationRequestModel({
      employeeId: new Types.ObjectId(dto.employeeId),
      contractId: new Types.ObjectId(dto.contractId),
      initiator: dto.initiator,
      reason: dto.reason,
      hrComments: dto.comments,
      status: TerminationStatus.PENDING,
    });

    const saved = await terminationRequest.save();

    // Notify employee about termination review initiation
    await this.notificationService.sendNotification({
      recipientId: dto.employeeId,
      type: 'TERMINATION_INITIATED',
      subject: 'Termination Review Initiated',
      message: 'A termination review has been initiated for your employment.',
      metadata: { terminationId: saved._id.toString(), reason: dto.reason },
    });

    // Notify specified user if provided
    if (dto.notifyUserId) {
      await this.notificationService.sendNotification({
        recipientId: dto.notifyUserId,
        type: 'TERMINATION_INITIATED',
        subject: 'Termination Review Initiated',
        message: 'A termination review has been initiated for an employee.',
        metadata: { terminationId: saved._id.toString(), employeeId: dto.employeeId },
      });
    }

    return saved;
  }

  /**
   * Update termination status
   */
  async updateTerminationStatus(terminationId: string, dto: UpdateTerminationStatusDto): Promise<TerminationRequest> {
    const termination = await this.terminationRequestModel.findById(terminationId);
    if (!termination) {
      throw new NotFoundException('Termination request not found');
    }

    termination.status = dto.status;
    if (dto.comments) {
      termination.hrComments = dto.comments;
    }
    if (dto.terminationDate && dto.status === TerminationStatus.APPROVED) {
      termination.terminationDate = dto.terminationDate;
    }

    return termination.save();
  }

  /**
   * Get termination by ID
   */
  async getTerminationRequest(terminationId: string): Promise<TerminationRequest> {
    const termination = await this.terminationRequestModel.findById(terminationId);
    if (!termination) {
      throw new NotFoundException('Termination request not found');
    }
    return termination;
  }

  /**
   * Get terminations by employee
   */
  async getTerminationsByEmployee(employeeId: string): Promise<TerminationRequest[]> {
    return this.terminationRequestModel.find({
      employeeId: new Types.ObjectId(employeeId),
    });
  }

  /**
   * Get pending terminations for review
   */
  async getPendingTerminations(): Promise<TerminationRequest[]> {
    return this.terminationRequestModel.find({
      status: TerminationStatus.PENDING,
    });
  }

  // ============================================================
  // OFF-018/019: Employee Resignation (via TerminationRequest)
  // ============================================================

  /**
   * Create resignation request (employee-initiated termination)
   */
  async createResignationRequest(dto: CreateResignationRequestDto): Promise<TerminationRequest> {
    // Check for existing pending resignation
    const existing = await this.terminationRequestModel.findOne({
      employeeId: new Types.ObjectId(dto.employeeId),
      initiator: TerminationInitiation.EMPLOYEE,
      status: { $in: [TerminationStatus.PENDING, TerminationStatus.UNDER_REVIEW] },
    });

    if (existing) {
      throw new BadRequestException('You already have a pending resignation request');
    }

    const resignation = new this.terminationRequestModel({
      employeeId: new Types.ObjectId(dto.employeeId),
      contractId: new Types.ObjectId(dto.contractId),
      initiator: TerminationInitiation.EMPLOYEE,
      reason: dto.reason,
      employeeComments: dto.comments,
      terminationDate: dto.requestedLastDay,
      status: TerminationStatus.PENDING,
    });

    const saved = await resignation.save();

    // Notify HR Manager about new resignation
    if (dto.hrManagerId) {
      await this.notificationService.sendNotification({
        recipientId: dto.hrManagerId,
        type: 'RESIGNATION_SUBMITTED',
        subject: 'New Resignation Request',
        message: 'An employee has submitted a resignation request.',
        metadata: { resignationId: saved._id.toString(), employeeId: dto.employeeId },
      });
    }

    return saved;
  }

  /**
   * Get resignation status (employee)
   */
  async getResignationStatus(resignationId: string, employeeId: string): Promise<TerminationRequest> {
    const resignation = await this.terminationRequestModel.findById(resignationId);
    if (!resignation) {
      throw new NotFoundException('Resignation request not found');
    }

    if (resignation.employeeId.toString() !== employeeId) {
      throw new ForbiddenException('You can only view your own resignation');
    }

    return resignation;
  }

  /**
   * Get all resignations for employee
   */
  async getMyResignations(employeeId: string): Promise<TerminationRequest[]> {
    return this.terminationRequestModel.find({
      employeeId: new Types.ObjectId(employeeId),
      initiator: TerminationInitiation.EMPLOYEE,
    });
  }

  /**
   * Review resignation (HR)
   */
  async reviewResignation(resignationId: string, dto: ReviewResignationDto): Promise<TerminationRequest> {
    const resignation = await this.terminationRequestModel.findById(resignationId);
    if (!resignation) {
      throw new NotFoundException('Resignation request not found');
    }

    resignation.status = dto.status;
    if (dto.hrComments) {
      resignation.hrComments = dto.hrComments;
    }
    if (dto.approvedLastDay) {
      resignation.terminationDate = dto.approvedLastDay;
    }

    const saved = await resignation.save();

    // Notify employee about resignation status change
    await this.notificationService.sendNotification({
      recipientId: resignation.employeeId.toString(),
      type: 'RESIGNATION_STATUS_CHANGED',
      subject: 'Resignation Request Update',
      message: `Your resignation request has been ${dto.status.toLowerCase()}.`,
      metadata: { resignationId, status: dto.status },
    });

    return saved;
  }

  // ============================================================
  // OFF-006: Offboarding Checklist
  // ============================================================

  /**
   * Create offboarding checklist for termination
   */
  async createOffboardingChecklist(dto: CreateOffboardingChecklistDto): Promise<ClearanceChecklist> {
    const termination = await this.terminationRequestModel.findById(dto.terminationId);
    if (!termination) {
      throw new NotFoundException('Termination request not found');
    }

    const defaultDepts = dto.departments || ['IT', 'Finance', 'Facilities', 'HR', 'Line Manager'];

    const items = defaultDepts.map((dept) => ({
      department: dept,
      status: ApprovalStatus.PENDING,
      comments: '',
      updatedAt: new Date(),
    }));

    const checklist = new this.clearanceChecklistModel({
      terminationId: new Types.ObjectId(dto.terminationId),
      hrManagerId: dto.hrManagerId ? new Types.ObjectId(dto.hrManagerId) : undefined,
      items,
      equipmentList: [],
      cardReturned: false,
    });

    return checklist.save();
  }

  /**
   * Add equipment to checklist
   */
  async addEquipmentToChecklist(checklistId: string, dto: AddEquipmentToChecklistDto): Promise<ClearanceChecklist> {
    const checklist = await this.clearanceChecklistModel.findById(checklistId);
    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    const newEquipment = dto.equipment.map((item) => ({
      equipmentId: item.equipmentId ? new Types.ObjectId(item.equipmentId) : new Types.ObjectId(),
      name: item.name,
      returned: false,
      condition: '',
    }));

    checklist.equipmentList.push(...newEquipment);
    return checklist.save();
  }

  /**
   * Get checklist by termination
   */
  async getChecklistByTermination(terminationId: string): Promise<ClearanceChecklist> {
    const checklist = await this.clearanceChecklistModel.findOne({
      terminationId: new Types.ObjectId(terminationId),
    });
    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }
    return checklist;
  }

  // ============================================================
  // OFF-010: Multi-Department Clearance Sign-offs
  // ============================================================

  /**
   * Department sign-off
   */
  async departmentSignOff(checklistId: string, userId: string, dto: DepartmentSignOffDto): Promise<ClearanceChecklist> {
    const checklist = await this.clearanceChecklistModel.findById(checklistId);
    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    const itemIndex = checklist.items.findIndex((item) => item.department === dto.department);
    if (itemIndex === -1) {
      throw new BadRequestException(`Department ${dto.department} not in checklist`);
    }

    checklist.items[itemIndex].status = dto.status;
    checklist.items[itemIndex].comments = dto.comments || '';
    checklist.items[itemIndex].updatedBy = new Types.ObjectId(userId);
    checklist.items[itemIndex].updatedAt = new Date();

    const saved = await checklist.save();

    // Check if all departments signed off and notify HR
    const allApproved = saved.items.every((item) => item.status === ApprovalStatus.APPROVED);
    const allReturned = saved.equipmentList.every((item) => item.returned === true);
    const clearanceComplete = allApproved && allReturned && saved.cardReturned;

    if (clearanceComplete && (checklist as any).hrManagerId) {
      await this.notificationService.sendNotification({
        recipientId: (checklist as any).hrManagerId.toString(),
        type: 'CLEARANCE_COMPLETE',
        subject: 'Clearance Complete',
        message: 'All departments have signed off. Clearance is complete and ready for final settlement.',
        metadata: { checklistId, terminationId: checklist.terminationId.toString() },
      });
    }

    return saved;
  }

  /**
   * Update equipment return
   */
  async updateEquipmentReturn(checklistId: string, dto: UpdateEquipmentReturnDto): Promise<ClearanceChecklist> {
    const checklist = await this.clearanceChecklistModel.findById(checklistId);
    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    const idx = checklist.equipmentList.findIndex(
      (item) => item.equipmentId?.toString() === dto.equipmentId,
    );
    if (idx === -1) {
      throw new BadRequestException('Equipment not found');
    }

    checklist.equipmentList[idx].returned = dto.returned;
    if (dto.condition) {
      checklist.equipmentList[idx].condition = dto.condition;
    }

    return checklist.save();
  }

  /**
   * Update access card return
   */
  async updateAccessCardReturn(checklistId: string, dto: UpdateAccessCardReturnDto): Promise<ClearanceChecklist> {
    const checklist = await this.clearanceChecklistModel.findById(checklistId);
    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }
    checklist.cardReturned = dto.returned;
    return checklist.save();
  }

  /**
   * Check if clearance complete
   */
  async isClearanceComplete(checklistId: string): Promise<boolean> {
    const checklist = await this.clearanceChecklistModel.findById(checklistId);
    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    const allApproved = checklist.items.every((item) => item.status === ApprovalStatus.APPROVED);
    const allReturned = checklist.equipmentList.every((item) => item.returned === true);

    return allApproved && allReturned && checklist.cardReturned;
  }

  // ============================================================
  // OFF-007: System Access Revocation (via ITProvisioningService)
  // ============================================================

  /**
   * Schedule access revocation using ITProvisioningService
   * Also schedules EmployeeSystemRole deactivation
   */
  async scheduleAccessRevocation(dto: ScheduleAccessRevocationDto): Promise<{
    scheduled: boolean;
    taskId: string | null;
    systems: string[];
    effectiveDate: Date;
  }> {
    const systems = ['email', 'laptop', 'payroll', 'internal_systems', 'vpn', 'badge_access'];

    const revocationRequest: RevocationRequest = {
      employeeId: dto.employeeId,
      reason: dto.terminationId ? 'termination' : 'resignation',
      effectiveDate: dto.revocationDate,
      revokeImmediately: false,
    };

    const result = await this.itProvisioningService.scheduleRevocation(
      revocationRequest,
      systems,
    );

    // Also create legacy onboarding tasks for tracking (backwards compatibility)
    const onboarding = await this.onboardingModel.findOne({
      employeeId: new Types.ObjectId(dto.employeeId),
    });

    if (onboarding) {
      const itTasks = onboarding.tasks.filter(
        (task) => task.department === 'IT' && task.status === OnboardingTaskStatus.COMPLETED,
      );

      for (const task of itTasks) {
        onboarding.tasks.push({
          name: `Revoke: ${task.name}`,
          department: 'IT',
          status: OnboardingTaskStatus.PENDING,
          deadline: dto.revocationDate,
          notes: `Scheduled for access revocation. Task ID: ${result.taskId}`,
        });
      }

      await onboarding.save();
    }

    return {
      scheduled: true,
      taskId: result.taskId,
      systems: result.systems,
      effectiveDate: result.scheduledFor,
    };
  }

  /**
   * Immediately revoke all access (for urgent terminations)
   * Deactivates EmployeeSystemRole and revokes IT systems access
   */
  async revokeAccessImmediately(dto: RevokeAccessImmediatelyDto): Promise<{
    success: boolean;
    systemRoleDeactivated: boolean;
    revokedSystems: string[];
  }> {
    const revocationRequest: RevocationRequest = {
      employeeId: dto.employeeId,
      reason: dto.reason as RevocationRequest['reason'],
      effectiveDate: new Date(),
      revokeImmediately: true,
    };

    // Revoke IT systems access
    const results = await this.itProvisioningService.revokeAccessImmediately(revocationRequest);
    const revokedSystems = results.filter((r) => r.success).map((r) => r.service);

    // Deactivate system role (blocks auth immediately)
    const systemRoleDeactivated = await this.deactivateSystemRole(dto.employeeId);

    // Notify the employee
    await this.notificationService.sendNotification({
      recipientId: dto.employeeId,
      type: 'ACCESS_REVOKED',
      subject: 'System Access Revoked',
      message: 'Your system access has been revoked effective immediately.',
      metadata: { reason: dto.reason, revokedSystems },
    });

    return {
      success: true,
      systemRoleDeactivated,
      revokedSystems,
    };
  }

  /**
   * Get accounts to revoke (IT tasks pending revocation)
   */
  async getScheduledRevocations(): Promise<Onboarding[]> {
    const now = new Date();
    return this.onboardingModel.find({
      'tasks.name': { $regex: /^Revoke:/ },
      'tasks.status': OnboardingTaskStatus.PENDING,
      'tasks.deadline': { $lte: now },
    });
  }

  // ============================================================
  // OFF-013: Final Settlement Calculation
  // Using termination request and external payroll module
  // ============================================================

  /**
   * Get termination details for final settlement
   */
  async getTerminationForSettlement(terminationId: string): Promise<{
    termination: TerminationRequest;
    clearanceComplete: boolean;
  }> {
    const termination = await this.terminationRequestModel.findById(terminationId);
    if (!termination) {
      throw new NotFoundException('Termination not found');
    }

    let clearanceComplete = false;
    try {
      const checklist = await this.clearanceChecklistModel.findOne({
        terminationId: new Types.ObjectId(terminationId),
      });
      if (checklist) {
        const allApproved = checklist.items.every((item) => item.status === ApprovalStatus.APPROVED);
        const allReturned = checklist.equipmentList.every((item) => item.returned === true);
        clearanceComplete = allApproved && allReturned && checklist.cardReturned;
      }
    } catch {
      // No checklist exists yet
    }

    return { termination, clearanceComplete };
  }

  /**
   * Get approved terminations pending final settlement
   */
  async getTerminationsPendingSettlement(): Promise<TerminationRequest[]> {
    return this.terminationRequestModel.find({
      status: TerminationStatus.APPROVED,
      terminationDate: { $exists: true },
    });
  }

  // ============================================================
  // OFF-013 Enhanced: Final Settlement with Leave Balance & Context
  // ============================================================

  /**
   * Get complete settlement data including clearance status, leave balance, and employee context
   */
  async getCompleteSettlementData(terminationId: string): Promise<{
    termination: TerminationRequest;
    clearanceComplete: boolean;
    settlementData: {
      employeeId: string;
      terminationDate: Date | undefined;
      reason: string;
      initiator: TerminationInitiation;
    };
    leaveBalance: {
      totalRemainingDays: number;
      entitlements: Array<{
        leaveTypeId: string;
        remaining: number;
        taken: number;
        pending: number;
      }>;
    };
    employeeContext: {
      employeeNumber: string | null;
      dateOfHire: Date | null;
      bankName: string | null;
      bankAccountNumber: string | null;
      primaryDepartmentId: string | null;
      status: string;
    } | null;
  }> {
    const { termination, clearanceComplete } = await this.getTerminationForSettlement(terminationId);

    if (!clearanceComplete) {
      throw new BadRequestException('Clearance must be complete before final settlement');
    }

    const employeeId = termination.employeeId.toString();

    // Get leave balance for settlement calculation
    const leaveBalance = await this.getLeaveBalanceForSettlement(employeeId);

    // Get employee context (banking, tenure)
    const employeeContext = await this.getEmployeeOffboardingContext(employeeId);

    return {
      termination,
      clearanceComplete,
      settlementData: {
        employeeId,
        terminationDate: termination.terminationDate,
        reason: termination.reason,
        initiator: termination.initiator,
      },
      leaveBalance,
      employeeContext,
    };
  }

  /**
   * Trigger final settlement - sends notifications to Payroll and Benefits teams
   */
  async triggerFinalSettlement(terminationId: string, dto: TriggerFinalSettlementDto): Promise<{
    success: boolean;
    message: string;
    leaveBalanceIncluded: number;
  }> {
    const { termination, clearanceComplete } = await this.getTerminationForSettlement(terminationId);

    if (!clearanceComplete) {
      throw new BadRequestException('Cannot trigger settlement - clearance incomplete');
    }

    // Get leave balance to include in settlement notification
    const leaveBalance = await this.getLeaveBalanceForSettlement(termination.employeeId.toString());

    // Notify the employee that settlement process has started
    await this.notificationService.sendNotification({
      recipientId: termination.employeeId.toString(),
      type: 'FINAL_SETTLEMENT_STARTED',
      subject: 'Final Settlement Process Started',
      message: `Your final settlement process has been initiated. Unused leave balance: ${leaveBalance.totalRemainingDays} days. You will be notified when your final pay is ready.`,
      metadata: {
        terminationId,
        triggeredBy: dto.triggeredBy,
        leaveBalance: leaveBalance.totalRemainingDays,
        notes: dto.notes,
      },
    });

    return {
      success: true,
      message: 'Final settlement triggered. Notifications sent.',
      leaveBalanceIncluded: leaveBalance.totalRemainingDays,
    };
  }
}
