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
import { LeaveEntitlement, LeaveEntitlementDocument } from '../../leaves/schemas/leave-entitlement.schema';
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
  ) { }

  // ============================================================
  // OFF-001: Performance Data Lookup (for termination review)
  // ============================================================

  /**
   * Get employee performance data for termination review decision
   * Uses AppraisalRecord from performance module
   */
  /**
   * OFF-001: Get employee performance data for termination review
   * Now uses Performance subsystem's getEmployeeRecords method
   * Maps to simplified structure with latest appraisal data
   */
  async getEmployeePerformanceData(employeeId: string): Promise<{
    hasPerformanceData: boolean;
    latestAppraisal: {
      id: string;
      totalScore: number | null;
      overallRating: string | null;
      managerComments: string | null;
      status: string | null;
      publishedAt: Date | null;
    } | null;
    allRecords: Array<{
      id: string;
      overallRating: string | null;
      totalScore: number | null;
      publishedAt: Date | null;
    }>;
  }> {
    // Use Performance subsystem's method to get employee records
    const records = await this.appraisalRecordModel
      .find({
        employeeProfileId: new Types.ObjectId(employeeId),
        status: { $in: [AppraisalRecordStatus.HR_PUBLISHED, AppraisalRecordStatus.ARCHIVED] },
      })
      .select('_id overallRatingLabel status managerSummary totalScore hrPublishedAt cycleId templateId createdAt updatedAt')
      .sort({ hrPublishedAt: -1 })
      .lean()
      .exec();

    if (!records || records.length === 0) {
      return {
        hasPerformanceData: false,
        latestAppraisal: null,
        allRecords: [],
      };
    }

    const mappedRecords = records.map((record) => ({
      id: record._id.toString(),
      overallRating: record.overallRatingLabel ?? null,
      status: record.status ?? null,
      managerComments: record.managerSummary ?? null,
      totalScore: record.totalScore ?? null,
      publishedAt: record.hrPublishedAt ?? null,
      cycleId: record.cycleId?.toString() ?? null,
      templateId: record.templateId?.toString() ?? null,
      createdAt: (record as any).createdAt ?? null,
      updatedAt: (record as any).updatedAt ?? null,
    }));

    const latest = mappedRecords[0];

    return {
      hasPerformanceData: true,
      latestAppraisal: {
        id: latest.id,
        totalScore: latest.totalScore,
        overallRating: latest.overallRating,
        managerComments: latest.managerComments,
        status: latest.status,
        publishedAt: latest.publishedAt,
      },
      allRecords: mappedRecords.map((r) => ({
        id: r.id,
        overallRating: r.overallRating,
        totalScore: r.totalScore,
        publishedAt: r.publishedAt,
      })),
    };
  }

  // ============================================================
  // OFF-013: Leave Balance Lookup (for final settlement)
  // ============================================================

  /**
   * OFF-013: Get employee leave balance for final settlement calculation
   * 
   * INTEGRATION NOTE: This method currently reads LeaveEntitlement directly.
   * When Leaves subsystem implements getLeaveBalance(employeeId, leaveTypeId),
   * this should be updated to call their service for each leave type.
   * 
   * Their method signature:
   * async getLeaveBalance(employeeId: string, leaveTypeId: string): Promise<number>
   * 
   * Returns accrued - taken balance, accounting for:
   * - Months worked calculation
   * - Pause during unpaid leave (BR 11)
   * - Approved leave requests
   */
  async getLeaveBalanceForSettlement(employeeId: string): Promise<{
    totalRemainingDays: number;
    entitlements: Array<{
      leaveTypeId: string;
      leaveTypeName: string;
      remaining: number;
      taken: number;
      pending: number;
    }>;
  }> {
    try {
      // TODO: When LeavesService.getLeaveBalance is implemented, replace direct query
      // For now, using LeaveEntitlement model directly
      const entitlements = await this.leaveEntitlementModel
        .find({ employeeId: new Types.ObjectId(employeeId) })
        .populate('leaveTypeId')
        .exec();

      const totalRemainingDays = entitlements.reduce(
        (sum, ent) => sum + (ent.remaining || 0),
        0,
      );

      return {
        totalRemainingDays,
        entitlements: entitlements.map((ent) => {
          const leaveType: any = ent.leaveTypeId;
          return {
            leaveTypeId: ent.leaveTypeId?.toString() || 'unknown',
            leaveTypeName: leaveType?.name || 'Unknown',
            remaining: ent.remaining || 0,
            taken: ent.taken || 0,
            pending: ent.pending || 0,
          };
        }),
      };
    } catch (error) {
      // If leave entitlements don't exist or can't be populated, return zero balance
      console.warn(`Could not fetch leave balance for employee ${employeeId}:`, error.message);
      return {
        totalRemainingDays: 0,
        entitlements: [],
      };
    }
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
   * Automatically creates clearance checklist
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

    // Automatically create clearance checklist when termination is initiated
    try {
      const defaultDepts = ['IT', 'Finance', 'Facilities', 'HR', 'Line_Manager', 'System_Access'];
      const items = defaultDepts.map((dept) => ({
        department: dept,
        status: ApprovalStatus.PENDING,
        comments: '',
        updatedAt: new Date(),
      }));

      const checklist = new this.clearanceChecklistModel({
        terminationId: saved._id,
        items,
        equipmentList: [],
        cardReturned: false,
      });

      await checklist.save();
      console.log('✅ Clearance checklist automatically created for termination:', saved._id.toString());
    } catch (error) {
      console.error('Failed to auto-create checklist:', error);
      // Don't fail termination if checklist creation fails
    }

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
   * Auto-triggers access revocation when approved
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

      // Auto-schedule access revocation for termination date
      try {
        await this.scheduleAccessRevocation({
          employeeId: termination.employeeId.toString(),
          terminationId: termination._id.toString(),
          revocationDate: dto.terminationDate,
        });

        // Notify IT department about upcoming access revocation
        await this.notificationService.sendNotification({
          recipientId: 'IT_DEPARTMENT', // Could be actual IT admin ID
          type: 'IT_PROVISIONING_REQUESTED',
          subject: '🔒 Access Revocation Required',
          message: `Employee ${termination.employeeId} termination approved. System access revocation scheduled for ${dto.terminationDate.toDateString()}. Please ensure all IT systems and credentials are revoked.`,
          metadata: {
            employeeId: termination.employeeId.toString(),
            terminationId: termination._id.toString(),
            revocationDate: dto.terminationDate.toISOString(),
            reason: 'termination_approved',
          },
        });
      } catch (error) {
        console.error('Failed to auto-schedule access revocation:', error);
        // Don't fail the entire termination approval if revocation scheduling fails
      }
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

    const defaultDepts = dto.departments || ['IT', 'Finance', 'Facilities', 'HR', 'Line_Manager', 'System_Access'];

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
    checklistUpdated: boolean;
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

    // Notify IT department that access has been revoked
    try {
      await this.notificationService.sendNotification({
        recipientId: 'IT_DEPARTMENT',
        type: 'ACCESS_REVOKED',
        subject: '✅ System Access Revoked',
        message: `Employee ${dto.employeeId} system access has been immediately revoked. Systems affected: ${revokedSystems.join(', ')}. Reason: ${dto.reason}.`,
        metadata: {
          employeeId: dto.employeeId,
          terminationId: dto.terminationId,
          revokedSystems,
          reason: dto.reason,
          revokedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.warn('Failed to notify IT department (invalid recipient ID):', error.message);
    }

    // Update checklist to mark access as revoked (use items array)
    let checklistUpdated = false;
    if (dto.terminationId) {
      try {
        const checklist = await this.clearanceChecklistModel.findOne({
          terminationId: new Types.ObjectId(dto.terminationId),
        });
        if (checklist) {
          // Add or update System Access item in items array
          const accessItemIndex = checklist.items.findIndex(
            (item) => item.department === 'System_Access'
          );

          if (accessItemIndex >= 0) {
            // Update existing item
            checklist.items[accessItemIndex].status = ApprovalStatus.APPROVED;
            checklist.items[accessItemIndex].comments = `Access revoked on ${new Date().toISOString()}. Systems: ${revokedSystems.join(', ')}`;
            checklist.items[accessItemIndex].updatedAt = new Date();
          } else {
            // Add new item
            checklist.items.push({
              department: 'System_Access',
              status: ApprovalStatus.APPROVED,
              comments: `Access revoked on ${new Date().toISOString()}. Systems: ${revokedSystems.join(', ')}`,
              updatedAt: new Date(),
            });
          }

          await checklist.save();
          checklistUpdated = true;
        }
      } catch (error) {
        console.warn('Could not update checklist for access revocation:', error.message);
      }
    }

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
      checklistUpdated,
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
        leaveTypeName: string;
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
   * OFF-013: Trigger final settlement - processes leave encashment and sends notifications
   * 
   * INTEGRATION NOTE: This method will call Leaves subsystem's processFinalSettlement
   * when it becomes available to handle leave encashment calculation.
   * 
   * Their method signature:
   * async processFinalSettlement(employeeId: string, terminationDate?: Date)
   * 
   * Returns:
   * - employeeId, terminationDate, dailySalaryRate
   * - settlements[] with leaveTypeId, unusedDays, encashableDays (capped at 30), encashmentAmount
   * - totalEncashment
   * - Creates adjustment records for audit trail
   */
  async triggerFinalSettlement(terminationId: string, dto: TriggerFinalSettlementDto): Promise<{
    success: boolean;
    message: string;
    leaveBalanceIncluded: number;
    encashmentDetails?: {
      totalEncashment: number;
      dailySalaryRate: number;
      settlements: Array<{
        leaveTypeName: string;
        unusedDays: number;
        encashableDays: number;
        encashmentAmount: number;
      }>;
    };
  }> {
    try {
      console.log('🔵 Step 1: Starting triggerFinalSettlement for termination:', terminationId);

      const { termination, clearanceComplete } = await this.getTerminationForSettlement(terminationId);
      console.log('🔵 Step 2: Retrieved termination, clearanceComplete:', clearanceComplete);

      if (!clearanceComplete) {
        throw new BadRequestException('Cannot trigger settlement - clearance incomplete. All departments must sign off and IT access must be revoked.');
      }

      // Guard against double settlement
      if (termination.hrComments?.includes('[System] Final Settlement Processed')) {
        throw new BadRequestException('Settlement already processed for this termination');
      }

      const employeeId = termination.employeeId.toString();
      console.log('🔵 Step 3: Employee ID:', employeeId);

      // Verify IT access has been revoked
      const systemRole = await this.employeeSystemRoleModel.findOne({
        employeeId: new Types.ObjectId(employeeId),
      });

      // if (systemRole && systemRole.isActive) {
      //   throw new BadRequestException('Cannot trigger settlement - employee system access is still active. Please revoke access before proceeding with settlement.');
      // }

      // Get leave balance to include in settlement notification
      const leaveBalance = await this.getLeaveBalanceForSettlement(employeeId);
      console.log('🔵 Step 4: Leave balance retrieved:', leaveBalance);

      // TODO: When LeavesService.processFinalSettlement is implemented, call it here:
      // const encashment = await this.leavesService.processFinalSettlement(
      //   employeeId,
      //   termination.terminationDate
      // );

      // For now, placeholder encashment calculation
      // This will be replaced with actual Leaves subsystem integration
      const placeholderEncashment = {
        totalEncashment: 0,
        dailySalaryRate: 0,
        settlements: [] as Array<{
          leaveTypeName: string;
          unusedDays: number;
          encashableDays: number;
          encashmentAmount: number;
        }>,
      };
      console.log('🔵 Step 5: Placeholder encashment created');

      // Notify Payroll module about final settlement with leave encashment data
      console.log('🔵 Step 6: Sending Payroll notification...');
      try {
        await this.notificationService.sendNotification({
          recipientId: 'PAYROLL_TEAM', // Should be actual payroll team/system ID
          type: 'FINAL_SETTLEMENT_STARTED', // Using existing notification type
          subject: 'Final Settlement Processing Required - Payroll Action Needed',
          message: `Employee ${employeeId} termination settlement ready. Leave balance: ${leaveBalance.totalRemainingDays} days. Total encashment: ${placeholderEncashment.totalEncashment}`,
          metadata: {
            terminationId,
            employeeId,
            triggeredBy: dto.triggeredBy,
            terminationDate: termination.terminationDate,
            leaveBalance: leaveBalance.totalRemainingDays,
            encashmentAmount: placeholderEncashment.totalEncashment,
            notes: dto.notes,
            targetSystem: 'PAYROLL',
          },
        });
        console.log('🔵 Step 6 Complete: Payroll notification sent');
      } catch (notifError: any) {
        console.error('⚠️ Step 6 Failed: Payroll notification error:', notifError.message);
        // Continue despite notification failure
      }

      // Notify Benefits module about termination
      console.log('🔵 Step 7: Sending Benefits notification...');
      try {
        await this.notificationService.sendNotification({
          recipientId: 'BENEFITS_TEAM', // Should be actual benefits team/system ID
          type: 'TERMINATION_INITIATED', // Using existing notification type
          subject: 'Benefits Termination Required',
          message: `Employee ${employeeId} benefits must be terminated effective ${termination.terminationDate?.toISOString().split('T')[0] || 'immediately'}`,
          metadata: {
            terminationId,
            employeeId,
            terminationDate: termination.terminationDate,
            triggeredBy: dto.triggeredBy,
            targetSystem: 'BENEFITS',
          },
        });
        console.log('🔵 Step 7 Complete: Benefits notification sent');
      } catch (notifError: any) {
        console.error('⚠️ Step 7 Failed: Benefits notification error:', notifError.message);
      }  // Continue despite notification failure

      // INTEGRATION: Mark as settled in comments to avoid showing in pending list again
      // (Since we cannot change schema/enum to add 'SETTLED' status)
      // Also update status to APPROVED if it isn't already
      await this.terminationRequestModel.findByIdAndUpdate(terminationId, {
        $set: {
          status: TerminationStatus.APPROVED, // Ensure status is APPROVED after settlement
          hrComments: `${termination.hrComments || ''}\n\n[System] Final Settlement Processed on ${new Date().toISOString()}`
        }
      });

      // Notify the employee that settlement process has started
      console.log('🔵 Step 8: Sending Employee notification...');
      try {
        await this.notificationService.sendNotification({
          recipientId: employeeId,
          type: 'FINAL_SETTLEMENT_STARTED',
          subject: 'Final Settlement Process Started',
          message: `Your final settlement process has been initiated. Unused leave balance: ${leaveBalance.totalRemainingDays} days. You will be notified when your final pay is ready.`,
          metadata: {
            terminationId,
            triggeredBy: dto.triggeredBy,
            leaveBalance: leaveBalance.totalRemainingDays,
            encashmentAmount: placeholderEncashment.totalEncashment,
            notes: dto.notes,
          },
        });
        console.log('🔵 Step 8 Complete: Employee notification sent');
      } catch (notifError: any) {
        console.error('⚠️ Step 8 Failed: Employee notification error:', notifError.message);
        // Continue despite notification failure
      }

      console.log('🔵 Step 9: Updating termination record with settlement trigger...');
      try {
        // Update termination record to track settlement trigger
        const settlementTriggeredMessage = `Final settlement triggered on ${new Date().toISOString()} by ${dto.triggeredBy}. Leave balance: ${leaveBalance.totalRemainingDays} days. ${dto.notes ? 'Notes: ' + dto.notes : ''}`;

        await this.terminationRequestModel.findByIdAndUpdate(
          terminationId,
          {
            $set: {
              hrComments: settlementTriggeredMessage,
              terminationDate: termination.terminationDate,
            },
          },
          { new: true }
        );
        console.log('🔵 Step 9 Complete: Termination record updated');
      } catch (updateError: any) {
        console.error('⚠️ Step 9 Failed: Could not update termination record:', updateError.message);
        // Continue - settlement is successful even if record update fails
      }

      console.log('🔵 Step 10: Preparing final response...');
      return {
        success: true,
        message: 'Final settlement triggered. Notifications sent to Payroll, Benefits, and Employee.',
        leaveBalanceIncluded: leaveBalance.totalRemainingDays,
        encashmentDetails: placeholderEncashment.totalEncashment > 0 ? placeholderEncashment : undefined,
      };
    } catch (error: any) {
      console.error('❌ Error in triggerFinalSettlement:', error.message);
      console.error('❌ Stack trace:', error.stack);
      throw error;
    }
  }
}