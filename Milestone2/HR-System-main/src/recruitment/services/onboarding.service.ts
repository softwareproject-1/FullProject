/**
 * OnboardingService
 * 
 * Handles all onboarding-related business logic including:
 * - ONB-001: Onboarding checklist template management
 * - ONB-002: Contract access and employee profile creation
 * - ONB-004: New hire onboarding tracker
 * - ONB-005: Reminders and notifications
 * - ONB-007: Compliance document management
 * - ONB-009: System access provisioning
 * - ONB-012: Equipment, desk, and access card reservation
 * - ONB-013: Automated account provisioning and revocation
 * - ONB-018: Payroll initiation
 * - ONB-019: Signing bonus processing
 * - Unnamed: Candidate uploads signed contract/forms
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// Models
import { Onboarding, OnboardingDocument } from '../models/onboarding.schema';
import { Contract, ContractDocument } from '../models/contract.schema';
import { Offer, OfferDocument } from '../models/offer.schema';
import { Document as RecruitmentDocument, DocumentDocument } from '../models/document.schema';
import { Application, ApplicationDocument } from '../models/application.schema';
import { employeeSigningBonus, employeeSigningBonusDocument } from '../../payroll-execution/models/EmployeeSigningBonus.schema';
import { signingBonus, signingBonusDocument } from '../../payroll-configuration/models/signingBonus.schema';
import { NotificationLog, NotificationLogDocument } from '../../time-management/models/notification-log.schema';
import { EmployeeSystemRole, EmployeeSystemRoleDocument } from '../../employee-profile/models/employee-system-role.schema';
import { Candidate, CandidateDocument } from '../../employee-profile/models/candidate.schema';
import { EmployeeProfile, EmployeeProfileDocument } from '../../employee-profile/models/employee-profile.schema';
import { BonusStatus } from '../../payroll-execution/enums/payroll-execution-enum';
import { ConfigStatus } from '../../payroll-configuration/enums/payroll-configuration-enums';
import { SystemRole, EmployeeStatus, ContractType, CandidateStatus } from '../../employee-profile/enums/employee-profile.enums';

// Enums
import { OnboardingTaskStatus } from '../enums/onboarding-task-status.enum';
import { DocumentType } from '../enums/document-type.enum';

// Services
import { NotificationService } from './notification.service';
import { EmployeeProfileService } from '../../employee-profile/employee-profile.service';
import { ITProvisioningService, ProvisioningRequest, RevocationRequest } from './it-provisioning.service';

// DTOs
import {
  CreateChecklistTemplateDto,
  ChecklistTemplateDto,
  ChecklistTaskTemplateDto,
  SignedContractDetailsDto,
  CreateEmployeeFromContractDto,
  EmployeeProfileCreatedDto,
  OnboardingTrackerDto,
  OnboardingTaskDto,
  UpdateTaskStatusDto,
  CompleteTaskDto,
  UploadDocumentDto,
  DocumentRecordDto,
  VerifyDocumentDto,
  ComplianceStatusDto,
  UploadSignedContractDto,
  UploadOnboardingFormDto,
  SignedContractUploadResultDto,
  FormUploadResultDto,
  // ONB-009
  ProvisionAccessDto,
  ProvisioningStatusDto,
  ProvisioningResultDto,
  SystemProvisioningStatusDto,
  // ONB-012
  ReserveEquipmentDto,
  ReserveDeskDto,
  ReserveAccessCardDto,
  ResourceReservationDto,
  ReservationResultDto,
  AllReservationsDto,
  // ONB-013
  ScheduleProvisioningDto,
  ScheduleRevocationDto,
  CancelOnboardingDto,
  CancelOnboardingResultDto,
  // ONB-018
  InitiatePayrollDto,
  PayrollInitiationResultDto,
  // ONB-019
  ProcessSigningBonusDto,
  SigningBonusResultDto,
} from '../dto/onboarding.dto';

@Injectable()
export class OnboardingService {
  // Prefixes for storing special data in Document.filePath (workaround for schema constraints)
  private readonly TEMPLATE_PREFIX = 'checklist-template://';
  private readonly VERIFICATION_PREFIX = 'verification://';
  private readonly EQUIPMENT_PREFIX = 'equipment://';
  private readonly DESK_PREFIX = 'desk://';
  private readonly ACCESSCARD_PREFIX = 'accesscard://';
  private readonly PROVISIONING_PREFIX = 'provisioning://';
  private readonly PAYROLL_PREFIX = 'payroll://';
  private readonly BONUS_PREFIX = 'bonus://';

  constructor(
    @InjectModel(Onboarding.name)
    private readonly onboardingModel: Model<OnboardingDocument>,

    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,

    @InjectModel(Offer.name)
    private readonly offerModel: Model<OfferDocument>,

    @InjectModel(RecruitmentDocument.name)
    private readonly documentModel: Model<DocumentDocument>,

    @InjectModel(Application.name)
    private readonly applicationModel: Model<ApplicationDocument>,

    @InjectModel(employeeSigningBonus.name)
    private readonly employeeSigningBonusModel: Model<employeeSigningBonusDocument>,

    @InjectModel(signingBonus.name)
    private readonly signingBonusConfigModel: Model<signingBonusDocument>,

    @InjectModel(NotificationLog.name)
    private readonly notificationLogModel: Model<NotificationLogDocument>,

    @InjectModel(EmployeeSystemRole.name)
    private readonly employeeSystemRoleModel: Model<EmployeeSystemRoleDocument>,

    @InjectModel(Candidate.name)
    private readonly candidateModel: Model<CandidateDocument>,

    @InjectModel(EmployeeProfile.name)
    private readonly employeeProfileModel: Model<EmployeeProfileDocument>,

    private readonly notificationService: NotificationService,
    private readonly employeeProfileService: EmployeeProfileService,
    private readonly itProvisioningService: ITProvisioningService,
  ) { }

  // ============================================================================
  // ONBOARDING CREATION (Called from RecruitmentService when contract is created)
  // ============================================================================

  /**
   * Create an onboarding checklist for a new hire
   * Called when a contract is created from an offer
   * 
   * @param candidateId - The candidate ID (will become employee)
   * @param contractId - The contract ID
   * @returns Created onboarding record
   */
  async createOnboardingChecklist(
    candidateId: string,
    contractId: string,
  ): Promise<OnboardingDocument> {
    // Check if onboarding already exists for this contract
    const existingByContract = await this.onboardingModel.findOne({
      contractId: new Types.ObjectId(contractId),
    }).exec();

    if (existingByContract) {
      return existingByContract;
    }

    // Also check if onboarding already exists for this employee (prevent duplicates)
    const existingByEmployee = await this.onboardingModel.findOne({
      employeeId: new Types.ObjectId(candidateId),
    }).exec();

    if (existingByEmployee) {
      console.log(`[ONBOARDING] Employee ${candidateId} already has an onboarding record. Returning existing.`);
      return existingByEmployee;
    }

    // Get contract details for start date
    const contract = await this.contractModel.findById(contractId).exec();
    if (!contract) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    // Create default onboarding tasks
    const defaultTasks = [
      {
        name: 'Complete tax forms',
        department: 'HR',
        status: OnboardingTaskStatus.PENDING,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      {
        name: 'Set up payroll',
        department: 'HR',
        status: OnboardingTaskStatus.PENDING,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Create email account',
        department: 'IT',
        status: OnboardingTaskStatus.PENDING,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      },
      {
        name: 'Provision system access',
        department: 'IT',
        status: OnboardingTaskStatus.PENDING,
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Assign workstation',
        department: 'Admin',
        status: OnboardingTaskStatus.PENDING,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      },
      {
        name: 'Create ID badge',
        department: 'Admin',
        status: OnboardingTaskStatus.PENDING,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    ];

    const onboarding = new this.onboardingModel({
      employeeId: new Types.ObjectId(candidateId),
      contractId: new Types.ObjectId(contractId),
      tasks: defaultTasks,
      completed: false,
    });

    const savedOnboarding = await onboarding.save();

    console.log(`[ONBOARDING] Created onboarding checklist for candidate ${candidateId}`);
    console.log(`  - Contract: ${contractId}`);
    console.log(`  - Tasks: ${defaultTasks.length}`);

    return savedOnboarding;
  }

  // ============================================================================
  // ONB-001: CHECKLIST TEMPLATE MANAGEMENT
  // As an HR Manager, I want to create onboarding task checklists, so that
  // new hires complete all required steps.
  // ============================================================================

  /**
   * Create a new checklist template
   * Templates are stored as Documents with special prefix
   */
  async createChecklistTemplate(dto: CreateChecklistTemplateDto): Promise<ChecklistTemplateDto> {
    const templateData = {
      name: dto.name,
      departmentId: dto.departmentId,
      positionId: dto.positionId,
      isDefault: dto.isDefault || false,
      tasks: dto.tasks,
      createdAt: new Date().toISOString(),
    };

    // Store template as Document with special prefix
    const doc = await this.documentModel.create({
      ownerId: new Types.ObjectId(), // System owner
      type: DocumentType.CERTIFICATE, // Using existing type as carrier
      filePath: this.TEMPLATE_PREFIX + JSON.stringify(templateData),
      uploadedAt: new Date(),
    });

    return {
      templateId: (doc._id as Types.ObjectId).toString(),
      name: dto.name,
      departmentId: dto.departmentId,
      positionId: dto.positionId,
      isDefault: dto.isDefault || false,
      tasks: dto.tasks,
      createdAt: doc.uploadedAt,
    };
  }

  /**
   * Get all checklist templates
   */
  async getChecklistTemplates(): Promise<ChecklistTemplateDto[]> {
    const docs = await this.documentModel.find({
      filePath: { $regex: `^${this.TEMPLATE_PREFIX}` },
    }).exec();

    return docs.map((doc) => {
      const data = JSON.parse(doc.filePath.replace(this.TEMPLATE_PREFIX, ''));
      return {
        templateId: (doc._id as Types.ObjectId).toString(),
        name: data.name,
        departmentId: data.departmentId,
        positionId: data.positionId,
        isDefault: data.isDefault,
        tasks: data.tasks,
        createdAt: new Date(data.createdAt),
      };
    });
  }

  /**
   * Get a specific template by ID
   */
  async getChecklistTemplateById(templateId: string): Promise<ChecklistTemplateDto | null> {
    const doc = await this.documentModel.findById(templateId).exec();
    if (!doc || !doc.filePath.startsWith(this.TEMPLATE_PREFIX)) {
      return null;
    }

    const data = JSON.parse(doc.filePath.replace(this.TEMPLATE_PREFIX, ''));
    return {
      templateId: (doc._id as Types.ObjectId).toString(),
      name: data.name,
      departmentId: data.departmentId,
      positionId: data.positionId,
      isDefault: data.isDefault,
      tasks: data.tasks,
      createdAt: new Date(data.createdAt),
    };
  }

  /**
   * Delete a checklist template by ID
   */
  async deleteChecklistTemplate(templateId: string): Promise<{ deleted: boolean; templateId: string }> {
    const doc = await this.documentModel.findById(templateId).exec();
    if (!doc || !doc.filePath.startsWith(this.TEMPLATE_PREFIX)) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    await this.documentModel.findByIdAndDelete(templateId).exec();
    return { deleted: true, templateId };
  }

  /**
   * Apply a template to an onboarding
   */
  async applyTemplateToOnboarding(
    onboardingId: string,
    templateId: string,
    startDate: Date,
  ): Promise<OnboardingTrackerDto> {
    const onboarding = await this.onboardingModel.findById(onboardingId).exec();
    if (!onboarding) {
      throw new NotFoundException(`Onboarding with ID ${onboardingId} not found`);
    }

    const template = await this.getChecklistTemplateById(templateId);
    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    // Defensive check: ensure template.tasks exists and is an array
    if (!template.tasks || !Array.isArray(template.tasks) || template.tasks.length === 0) {
      throw new BadRequestException(
        `Template "${template.name || templateId}" has no tasks defined. Please add tasks to the template before applying it.`
      );
    }

    // Convert template tasks to onboarding tasks
    // Support both daysFromStart (DTO) and dueInDays (legacy/Postman collection)
    const newTasks = template.tasks.map((t: any) => {
      const daysFromStart = t.daysFromStart || t.dueInDays || 0;
      return {
        name: t.name,
        department: t.department,
        status: OnboardingTaskStatus.PENDING,
        deadline: new Date(startDate.getTime() + daysFromStart * 24 * 60 * 60 * 1000),
        notes: t.category ? `category:${t.category}` : (t.description || undefined),
      };
    });

    // Add tasks to onboarding
    onboarding.tasks.push(...newTasks);
    await onboarding.save();

    return this.getOnboardingTracker(onboardingId);
  }

  // ============================================================================
  // ONB-002: CONTRACT ACCESS & EMPLOYEE PROFILE CREATION
  // As an HR Manager, I want to access the signed contract to create the
  // employee profile.
  // ============================================================================

  /**
   * Get signed contract details
   */
  async getSignedContractDetails(contractId: string): Promise<SignedContractDetailsDto> {
    const contract = await this.contractModel.findById(contractId).exec();
    if (!contract) {
      throw new NotFoundException(`Contract with ID ${contractId} not found`);
    }

    const offer = await this.offerModel.findById(contract.offerId).exec();

    return {
      contractId: (contract._id as Types.ObjectId).toString(),
      offerId: contract.offerId.toString(),
      candidateId: offer?.candidateId?.toString() || '',
      role: contract.role || '',
      grossSalary: contract.grossSalary,
      signingBonus: contract.signingBonus,
      benefits: contract.benefits,
      acceptanceDate: contract.acceptanceDate,
      employeeSignedAt: contract.employeeSignedAt,
      employerSignedAt: contract.employerSignedAt,
      isFullySigned: !!(contract.employeeSignedAt && contract.employerSignedAt),
      contractDocumentId: contract.documentId?.toString(),
    };
  }

  /**
   * Create employee profile from contract
   * Implements ONB-002: HR creates employee profile from signed contract
   */
  async createEmployeeFromContract(dto: CreateEmployeeFromContractDto): Promise<EmployeeProfileCreatedDto> {
    const contract = await this.contractModel.findById(dto.contractId).exec();
    if (!contract) {
      throw new NotFoundException(`Contract with ID ${dto.contractId} not found`);
    }

    const offer = await this.offerModel.findById(contract.offerId).exec();
    if (!offer) {
      throw new BadRequestException('Associated offer not found');
    }

    const candidate = await this.candidateModel.findById(offer.candidateId).exec();
    if (!candidate) {
      throw new BadRequestException('Associated candidate not found');
    }

    // Generate employee number
    const employeeNumber = `EMP-${Date.now()}`;

    // Generate work email
    const workEmail = `${candidate.firstName.toLowerCase()}.${candidate.lastName.toLowerCase()}@company.com`;

    // Create employee profile from candidate data
    const employeeProfile = await this.employeeProfileModel.create({
      employeeNumber,
      firstName: candidate.firstName,
      middleName: candidate.middleName,
      lastName: candidate.lastName,
      fullName: candidate.fullName || `${candidate.firstName} ${candidate.lastName}`,
      nationalId: candidate.nationalId,
      password: candidate.password,
      gender: candidate.gender,
      maritalStatus: candidate.maritalStatus,
      dateOfBirth: candidate.dateOfBirth,
      personalEmail: candidate.personalEmail,
      mobilePhone: candidate.mobilePhone,
      homePhone: candidate.homePhone,
      address: candidate.address,
      profilePictureUrl: candidate.profilePictureUrl,
      dateOfHire: dto.startDate || new Date(),
      workEmail,
      contractType: ContractType.FULL_TIME_CONTRACT,
      workType: dto.workType || 'FULL_TIME',
      status: EmployeeStatus.ACTIVE,
      statusEffectiveFrom: dto.startDate || new Date(),
      contractStartDate: dto.startDate || new Date(),
      primaryDepartmentId: candidate.departmentId,
      primaryPositionId: candidate.positionId,
    });

    console.log(`[ONBOARDING] Created employee profile ${employeeProfile._id} from contract ${dto.contractId}`);

    // ISSUE-002 FIX: Link the new employee to the onboarding record
    // This updates the onboarding record to use the real employeeId instead of the candidateId placeholder
    await this.linkEmployeeToOnboarding(
      dto.contractId,
      (employeeProfile._id as Types.ObjectId).toString(),
      offer.candidateId.toString()
    );

    return {
      success: true,
      employeeProfileId: (employeeProfile._id as Types.ObjectId).toString(),
      employeeNumber,
      candidateId: offer.candidateId.toString(),
      contractId: dto.contractId,
      message: 'Employee profile created successfully',
    };
  }

  /**
   * Link employee to onboarding record
   * ISSUE-002 FIX: Updates the onboarding record with the real employeeId after HR creates the employee profile
   * 
   * @param contractId - The contract ID associated with the onboarding
   * @param employeeProfileId - The newly created employee profile ID
   * @param candidateId - The original candidate ID (for fallback lookup)
   */
  async linkEmployeeToOnboarding(
    contractId: string,
    employeeProfileId: string,
    candidateId: string
  ): Promise<void> {
    // Try to find onboarding by contractId first
    let onboarding = await this.onboardingModel.findOne({
      contractId: new Types.ObjectId(contractId),
    }).exec();

    // Fallback: find by the candidateId that was used as placeholder employeeId
    if (!onboarding) {
      onboarding = await this.onboardingModel.findOne({
        employeeId: new Types.ObjectId(candidateId),
      }).exec();
    }

    if (onboarding) {
      // Update the onboarding record with the real employee ID
      onboarding.employeeId = new Types.ObjectId(employeeProfileId);
      await onboarding.save();

      console.log(`[ONBOARDING] Linked employee ${employeeProfileId} to onboarding ${onboarding._id}`);
      console.log(`  - Previous employeeId was candidateId: ${candidateId}`);
      console.log(`  - New employeeId is real employee: ${employeeProfileId}`);
    } else {
      console.warn(`[ONBOARDING] No onboarding record found for contract ${contractId} or candidate ${candidateId}`);
    }
  }

  // ============================================================================
  // ONB-004: NEW HIRE TRACKER
  // As a New Hire, I want to view my onboarding steps in a tracker.
  // ============================================================================

  /**
   * Get onboarding tracker by onboarding ID
   */
  async getOnboardingTracker(onboardingId: string): Promise<OnboardingTrackerDto> {
    const onboarding = await this.onboardingModel.findById(onboardingId).exec();
    if (!onboarding) {
      throw new NotFoundException(`Onboarding with ID ${onboardingId} not found`);
    }

    return this.mapToTrackerDto(onboarding);
  }

  /**
   * Get onboarding tracker by employee ID
   */
  async getOnboardingTrackerByEmployee(employeeId: string): Promise<OnboardingTrackerDto> {
    const onboarding = await this.onboardingModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
    }).exec();

    if (!onboarding) {
      throw new NotFoundException(`Onboarding for employee ${employeeId} not found`);
    }

    return this.mapToTrackerDto(onboarding);
  }

  /**
   * ISSUE-006 FIX: Get onboarding tracker by candidate ID or employee ID
   * 
   * This method handles the transition period where:
   * 1. Initially, onboarding.employeeId = candidateId (placeholder)
   * 2. After HR creates employee, onboarding.employeeId = real employeeId
   * 
   * The method searches for both possibilities to ensure candidates can always
   * access their onboarding record regardless of the transition state.
   * 
   * @param userId - Either candidateId or employeeId
   * @returns OnboardingTrackerDto
   */
  async getOnboardingByCandidateOrEmployee(userId: string): Promise<OnboardingTrackerDto> {
    // First try: user is still a candidate (employeeId field contains candidateId)
    let onboarding = await this.onboardingModel.findOne({
      employeeId: new Types.ObjectId(userId),
    }).exec();

    // Second try: search by contractId linked to this user's offer
    if (!onboarding) {
      // Find any contract associated with this candidate
      const offers = await this.offerModel.find({
        candidateId: new Types.ObjectId(userId),
      }).exec();

      for (const offer of offers) {
        const contracts = await this.contractModel.find({
          offerId: offer._id,
        }).exec();

        for (const contract of contracts) {
          onboarding = await this.onboardingModel.findOne({
            contractId: contract._id,
          }).exec();

          if (onboarding) break;
        }
        if (onboarding) break;
      }
    }

    if (!onboarding) {
      throw new NotFoundException(`No onboarding record found for user ${userId}`);
    }

    return this.mapToTrackerDto(onboarding);
  }

  /**
   * Get all onboardings with employee details
   */
  async getAllOnboardings(): Promise<OnboardingTrackerDto[]> {
    const onboardings = await this.onboardingModel.find().exec();

    // Get all unique employee IDs
    const employeeIds = [...new Set(onboardings.map(o => o.employeeId.toString()))];

    // Fetch all employee profiles in one query
    const employeeProfiles = await this.employeeProfileModel.find({
      _id: { $in: employeeIds.map(id => new Types.ObjectId(id)) }
    }).exec();

    // Create a lookup map for quick access
    const employeeMap = new Map<string, { name: string; number: string }>();
    for (const profile of employeeProfiles) {
      const fullName = profile.fullName ||
        `${profile.firstName || ''} ${profile.middleName || ''} ${profile.lastName || ''}`.trim();
      employeeMap.set(profile._id.toString(), {
        name: fullName || 'Unknown',
        number: profile.employeeNumber || profile._id.toString().slice(-8).toUpperCase()
      });
    }

    // Map onboardings with employee details
    return onboardings.map((o) => {
      const dto = this.mapToTrackerDto(o);
      const employeeDetails = employeeMap.get(o.employeeId.toString());
      if (employeeDetails) {
        dto.employeeName = employeeDetails.name;
        dto.employeeNumber = employeeDetails.number;
      }
      return dto;
    });
  }

  /**
   * Update task status
   */
  async updateTaskStatus(
    onboardingId: string,
    taskIndex: number,
    dto: UpdateTaskStatusDto,
  ): Promise<OnboardingTrackerDto> {
    const onboarding = await this.onboardingModel.findById(onboardingId).exec();
    if (!onboarding) {
      throw new NotFoundException(`Onboarding with ID ${onboardingId} not found`);
    }

    if (taskIndex < 0 || taskIndex >= onboarding.tasks.length) {
      throw new BadRequestException(`Invalid task index: ${taskIndex}`);
    }

    onboarding.tasks[taskIndex].status = dto.status;
    if (dto.notes) {
      onboarding.tasks[taskIndex].notes = dto.notes;
    }

    if (dto.status === OnboardingTaskStatus.COMPLETED) {
      onboarding.tasks[taskIndex].completedAt = new Date();
    }

    await onboarding.save();
    return this.getOnboardingTracker(onboardingId);
  }

  /**
   * Complete a task
   */
  async completeTask(
    onboardingId: string,
    taskIndex: number,
    dto: CompleteTaskDto,
  ): Promise<OnboardingTrackerDto> {
    const onboarding = await this.onboardingModel.findById(onboardingId).exec();
    if (!onboarding) {
      throw new NotFoundException(`Onboarding with ID ${onboardingId} not found`);
    }

    if (taskIndex < 0 || taskIndex >= onboarding.tasks.length) {
      throw new BadRequestException(`Invalid task index: ${taskIndex}`);
    }

    onboarding.tasks[taskIndex].status = OnboardingTaskStatus.COMPLETED;
    onboarding.tasks[taskIndex].completedAt = new Date();
    if (dto.notes) {
      onboarding.tasks[taskIndex].notes = dto.notes;
    }
    if (dto.documentId) {
      onboarding.tasks[taskIndex].documentId = new Types.ObjectId(dto.documentId);
    }

    // Check if all tasks are completed
    const allCompleted = onboarding.tasks.every(
      (t) => t.status === OnboardingTaskStatus.COMPLETED,
    );
    if (allCompleted) {
      onboarding.completed = true;
      onboarding.completedAt = new Date();
    }

    await onboarding.save();
    return this.getOnboardingTracker(onboardingId);
  }

  // ============================================================================
  // ONB-005: REMINDERS AND NOTIFICATIONS
  // As a New Hire, I want to receive reminders and notifications.
  // ============================================================================

  /**
   * Send reminder for a specific task
   */
  async sendTaskReminder(
    onboardingId: string,
    taskIndex: number,
    message?: string,
  ): Promise<{ sent: boolean; message: string }> {
    const onboarding = await this.onboardingModel.findById(onboardingId).exec();
    if (!onboarding) {
      throw new NotFoundException(`Onboarding with ID ${onboardingId} not found`);
    }

    if (taskIndex < 0 || taskIndex >= onboarding.tasks.length) {
      throw new BadRequestException(`Invalid task index: ${taskIndex}`);
    }

    const task = onboarding.tasks[taskIndex];
    const isOverdue = task.deadline ? task.deadline < new Date() : false;
    await this.notificationService.sendTaskReminder(
      onboarding.employeeId.toString(),
      task.name,
      task.deadline || new Date(),
      isOverdue,
    );

    return {
      sent: true,
      message: `Reminder sent for task: ${task.name}`,
    };
  }

  /**
   * Get all overdue tasks across all onboardings
   */
  async getOverdueTasks(): Promise<{
    onboardingId: string;
    employeeId: string;
    taskIndex: number;
    taskName: string;
    department: string;
    deadline: Date;
    daysOverdue: number;
  }[]> {
    const onboardings = await this.onboardingModel.find({
      completed: false,
    }).exec();

    const overdueTasks: any[] = [];
    const now = new Date();

    for (const onboarding of onboardings) {
      for (let i = 0; i < onboarding.tasks.length; i++) {
        const task = onboarding.tasks[i];
        if (
          task.status !== OnboardingTaskStatus.COMPLETED &&
          task.deadline &&
          new Date(task.deadline) < now
        ) {
          const daysOverdue = Math.ceil(
            (now.getTime() - new Date(task.deadline).getTime()) / (1000 * 60 * 60 * 24),
          );
          overdueTasks.push({
            onboardingId: (onboarding._id as Types.ObjectId).toString(),
            employeeId: onboarding.employeeId.toString(),
            taskIndex: i,
            taskName: task.name,
            department: task.department,
            deadline: task.deadline,
            daysOverdue,
          });
        }
      }
    }

    return overdueTasks;
  }

  /**
   * Send bulk reminders for overdue tasks
   */
  async sendBulkReminders(): Promise<{
    remindersSent: number;
    tasksReminded: { onboardingId: string; taskIndex: number; taskName: string }[];
  }> {
    const overdueTasks = await this.getOverdueTasks();
    const tasksReminded: any[] = [];

    for (const task of overdueTasks) {
      await this.sendTaskReminder(task.onboardingId, task.taskIndex);
      tasksReminded.push({
        onboardingId: task.onboardingId,
        taskIndex: task.taskIndex,
        taskName: task.taskName,
      });
    }

    return {
      remindersSent: tasksReminded.length,
      tasksReminded,
    };
  }

  /**
   * Get all notifications for a specific recipient
   */
  async getNotificationsForRecipient(recipientId: string): Promise<any[]> {
    return this.notificationService.getNotificationsForRecipient(recipientId);
  }

  // ============================================================================
  // ONB-007: COMPLIANCE DOCUMENTS
  // As a New Hire, I want to upload compliance documents.
  // ============================================================================

  /**
   * Upload a compliance document
   */
  async uploadComplianceDocument(dto: UploadDocumentDto): Promise<DocumentRecordDto> {
    const onboarding = await this.onboardingModel.findById(dto.onboardingId).exec();
    if (!onboarding) {
      throw new NotFoundException(`Onboarding with ID ${dto.onboardingId} not found`);
    }

    const doc = await this.documentModel.create({
      ownerId: onboarding.employeeId,
      type: DocumentType.CERTIFICATE, // Using as carrier type
      filePath: dto.filePath,
      uploadedAt: new Date(),
    });

    // Update task if taskIndex provided
    if (dto.taskIndex !== undefined && dto.taskIndex >= 0) {
      if (dto.taskIndex < onboarding.tasks.length) {
        onboarding.tasks[dto.taskIndex].documentId = doc._id as Types.ObjectId;
        await onboarding.save();
      }
    }

    return {
      documentId: (doc._id as Types.ObjectId).toString(),
      documentType: dto.documentType,
      documentName: dto.documentName,
      filePath: dto.filePath,
      uploadedAt: doc.uploadedAt,
      verificationStatus: 'PENDING',
    };
  }

  /**
   * Get all documents for an onboarding
   * Used by HR to view documents uploaded by new hires
   */
  async getDocumentsByOnboarding(onboardingId: string): Promise<DocumentRecordDto[]> {
    const onboarding = await this.onboardingModel.findById(onboardingId).exec();
    if (!onboarding) {
      throw new NotFoundException(`Onboarding with ID ${onboardingId} not found`);
    }

    // Get all documents where ownerId matches the employee in this onboarding
    const documents = await this.documentModel.find({
      ownerId: onboarding.employeeId,
    }).exec();

    // Also get documents linked to tasks
    const taskDocIds = onboarding.tasks
      .filter(t => t.documentId)
      .map(t => t.documentId);

    const taskDocuments = await this.documentModel.find({
      _id: { $in: taskDocIds }
    }).exec();

    // Combine and deduplicate
    const allDocs = [...documents, ...taskDocuments];
    const uniqueDocs = allDocs.reduce((acc, doc) => {
      const id = doc._id.toString();
      if (!acc.has(id)) {
        acc.set(id, doc);
      }
      return acc;
    }, new Map());

    return Array.from(uniqueDocs.values()).map(doc => {
      // Parse verification status if present
      let verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' = 'PENDING';
      let verifiedBy: string | undefined;
      let verifiedAt: Date | undefined;
      let rejectionReason: string | undefined;

      if (doc.filePath.startsWith(this.VERIFICATION_PREFIX)) {
        try {
          const prefixEnd = doc.filePath.indexOf('::');
          const jsonStr = doc.filePath.substring(this.VERIFICATION_PREFIX.length, prefixEnd);
          const verification = JSON.parse(jsonStr);
          verificationStatus = (verification.verificationStatus || 'PENDING') as 'PENDING' | 'VERIFIED' | 'REJECTED';
          verifiedBy = verification.verifiedBy;
          verifiedAt = verification.verifiedAt ? new Date(verification.verifiedAt) : undefined;
          rejectionReason = verification.rejectionReason;
        } catch (e) {
          // Ignore parse errors
        }
      }

      return {
        documentId: doc._id.toString(),
        documentType: doc.type,
        documentName: doc.filePath.split('/').pop() || 'Document',
        filePath: doc.filePath,
        uploadedAt: doc.uploadedAt,
        verificationStatus,
        verifiedBy,
        verifiedAt,
        rejectionReason,
      };
    });
  }

  /**
   * Verify a document
   */
  async verifyDocument(
    documentId: string,
    dto: VerifyDocumentDto,
  ): Promise<DocumentRecordDto> {
    const doc = await this.documentModel.findById(documentId).exec();
    if (!doc) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    // Store verification in filePath with prefix
    const verificationData = {
      verificationStatus: dto.decision,
      verifiedBy: dto.verifiedBy,
      verifiedAt: new Date().toISOString(),
      rejectionReason: dto.rejectionReason,
    };

    doc.filePath = `${this.VERIFICATION_PREFIX}${JSON.stringify(verificationData)}::${doc.filePath}`;
    await doc.save();

    return {
      documentId: (doc._id as Types.ObjectId).toString(),
      documentType: doc.type,
      documentName: doc.filePath.split('/').pop() || 'Unknown',
      filePath: doc.filePath,
      uploadedAt: doc.uploadedAt,
      verificationStatus: dto.decision,
      verifiedBy: dto.verifiedBy,
      verifiedAt: new Date(),
      rejectionReason: dto.rejectionReason,
    };
  }

  /**
   * Get compliance status for an onboarding
   */
  async getComplianceStatus(onboardingId: string): Promise<ComplianceStatusDto> {
    const onboarding = await this.onboardingModel.findById(onboardingId).exec();
    if (!onboarding) {
      throw new NotFoundException(`Onboarding with ID ${onboardingId} not found`);
    }

    const docs = await this.documentModel.find({
      ownerId: onboarding.employeeId,
    }).exec();

    const documents = docs.map((d) => this.mapToDocumentRecord(d));
    const requiredDocuments = ['ID', 'CONTRACT', 'TAX_FORM'];
    const uploadedTypes = documents.map((d) => d.documentType);
    const missingDocuments = requiredDocuments.filter((r) => !uploadedTypes.includes(r));

    return {
      onboardingId,
      documents,
      requiredDocuments,
      missingDocuments,
      pendingVerification: documents.filter((d) => d.verificationStatus === 'PENDING').length,
      verified: documents.filter((d) => d.verificationStatus === 'VERIFIED').length,
      rejected: documents.filter((d) => d.verificationStatus === 'REJECTED').length,
      isCompliant: missingDocuments.length === 0 &&
        documents.every((d) => d.verificationStatus === 'VERIFIED'),
    };
  }

  // ============================================================================
  // UNNAMED STORY: CANDIDATE UPLOADS
  // Candidate uploads signed contract and required forms
  // ============================================================================

  /**
   * Upload signed contract
   */
  async uploadSignedContract(dto: UploadSignedContractDto): Promise<SignedContractUploadResultDto> {
    const contract = await this.contractModel.findById(dto.contractId).exec();
    if (!contract) {
      throw new NotFoundException(`Contract with ID ${dto.contractId} not found`);
    }

    // Fetch the offer to get candidateId
    const offer = await this.offerModel.findById(contract.offerId).exec();
    if (!offer) {
      throw new NotFoundException(`Offer associated with contract not found`);
    }

    // Use filePath or signatureUrl (frontend sends signatureUrl)
    const filePath = dto.filePath || dto.signatureUrl || 'signed-contract-uploaded';

    // Create document record
    const doc = await this.documentModel.create({
      ownerId: offer.candidateId,
      type: DocumentType.CONTRACT,
      filePath: filePath,
      uploadedAt: new Date(),
    });

    // Update contract with signature
    contract.documentId = doc._id as Types.ObjectId;

    // Use signatureUrl or employeeSignatureUrl as the signature
    const signatureUrl = dto.signatureUrl || dto.employeeSignatureUrl;
    if (signatureUrl) {
      contract.employeeSignatureUrl = signatureUrl;
      contract.employeeSignedAt = dto.signedAt ? new Date(dto.signedAt) : new Date();
    }

    await contract.save();

    const isFullySigned = !!(contract.employeeSignedAt && contract.employerSignedAt);

    return {
      success: true,
      contractId: dto.contractId,
      documentId: (doc._id as Types.ObjectId).toString(),
      message: isFullySigned
        ? 'Contract fully signed'
        : 'Contract uploaded, awaiting employer signature',
      isFullySigned,
    };
  }

  /**
   * Upload onboarding form
   */
  async uploadOnboardingForm(dto: UploadOnboardingFormDto): Promise<FormUploadResultDto> {
    const onboarding = await this.onboardingModel.findById(dto.onboardingId).exec();
    if (!onboarding) {
      throw new NotFoundException(`Onboarding with ID ${dto.onboardingId} not found`);
    }

    // Use filePath or formUrl (frontend sends formUrl)
    const filePath = dto.filePath || dto.formUrl || 'onboarding-form-uploaded';

    const doc = await this.documentModel.create({
      ownerId: onboarding.employeeId,
      type: DocumentType.CERTIFICATE,
      filePath: filePath,
      uploadedAt: new Date(),
    });

    let taskUpdated = false;
    if (dto.taskIndex !== undefined && dto.taskIndex >= 0 && dto.taskIndex < onboarding.tasks.length) {
      onboarding.tasks[dto.taskIndex].documentId = doc._id as Types.ObjectId;
      onboarding.tasks[dto.taskIndex].status = OnboardingTaskStatus.COMPLETED;
      onboarding.tasks[dto.taskIndex].completedAt = new Date();
      await onboarding.save();
      taskUpdated = true;
    }

    return {
      success: true,
      documentId: (doc._id as Types.ObjectId).toString(),
      onboardingId: dto.onboardingId,
      taskUpdated,
      message: `Form ${dto.formType} uploaded successfully`,
    };
  }

  // ============================================================================
  // ONB-009: SYSTEM ACCESS PROVISIONING
  // As a System Admin, I want to provision system access (payroll, email,
  // internal systems), so that the employee can work.
  // BR 9(b): Auto onboarding tasks for IT (email, laptop, system access)
  // ============================================================================

  /**
   * Provision system access for a new hire
   */
  async provisionSystemAccess(dto: ProvisionAccessDto): Promise<ProvisioningResultDto> {
    const onboarding = await this.onboardingModel.findById(dto.onboardingId).exec();
    if (!onboarding) {
      throw new NotFoundException(`Onboarding with ID ${dto.onboardingId} not found`);
    }

    const contract = await this.contractModel.findById(onboarding.contractId).exec();
    const offer = contract ? await this.offerModel.findById(contract.offerId).exec() : null;

    // Look up candidate to get employee name
    const candidate = await this.candidateModel.findById(onboarding.employeeId).exec();
    const employeeName = candidate?.firstName
      ? `${candidate.firstName} ${candidate.lastName || ''}`.trim()
      : 'New Hire';

    // Create provisioning request
    const provRequest: ProvisioningRequest = {
      employeeId: onboarding.employeeId.toString(),
      employeeName,
      email: `employee.${onboarding.employeeId}@company.com`,
      department: offer?.role || 'Unknown',
      position: offer?.role || 'Unknown',
      startDate: dto.startDate,
    };

    // Store provisioning record
    const provisioningData = {
      onboardingId: dto.onboardingId,
      systems: dto.systems,
      requestedBy: dto.requestedBy,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };

    const doc = await this.documentModel.create({
      ownerId: onboarding.employeeId,
      type: DocumentType.CERTIFICATE,
      filePath: `${this.PROVISIONING_PREFIX}${JSON.stringify(provisioningData)}`,
      uploadedAt: new Date(),
    });

    // Provision each system
    const results = await this.itProvisioningService.provisionSystemAccess(provRequest, dto.systems);

    // Add IT tasks to onboarding
    const itTasks = dto.systems.map((system) => ({
      name: `Provision ${system} access`,
      department: 'IT',
      status: OnboardingTaskStatus.IN_PROGRESS,
      deadline: dto.startDate,
    }));
    onboarding.tasks.push(...itTasks);
    await onboarding.save();

    return {
      success: results.every((r) => r.success),
      onboardingId: dto.onboardingId,
      taskIds: [(doc._id as Types.ObjectId).toString()],
      systems: dto.systems,
      message: `Provisioning initiated for ${dto.systems.length} systems`,
    };
  }

  /**
   * Get provisioning status for an onboarding
   * ONB-013: Returns both persisted provisioning records and IT service status
   */
  async getProvisioningStatus(onboardingId: string): Promise<ProvisioningStatusDto> {
    const onboarding = await this.onboardingModel.findById(onboardingId).exec();
    if (!onboarding) {
      throw new NotFoundException(`Onboarding with ID ${onboardingId} not found`);
    }

    // Get provisioning records from database
    const docs = await this.documentModel.find({
      ownerId: onboarding.employeeId,
      filePath: { $regex: `^${this.PROVISIONING_PREFIX}` },
    }).exec();

    const systemsMap = new Map<string, SystemProvisioningStatusDto>();
    let requestedAt: Date | undefined;
    let hasScheduledProvisioning = false;

    // Process all provisioning records from database
    for (const doc of docs) {
      try {
        const data = JSON.parse(doc.filePath.replace(this.PROVISIONING_PREFIX, ''));
        requestedAt = new Date(data.requestedAt);

        // Track if we have any scheduled provisioning
        if (data.status === 'scheduled') {
          hasScheduledProvisioning = true;
        }

        // Add each system from the record
        for (const system of data.systems || []) {
          // Map the status from the record
          let status = data.status || 'pending';
          if (status === 'scheduled') {
            status = 'scheduled';
          }

          systemsMap.set(system, {
            system,
            status,
            provisionedAt: data.status === 'provisioned' ? new Date() : undefined,
            scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
          });
        }
      } catch (err) {
        console.error('Failed to parse provisioning record:', err);
      }
    }

    // Convert map to array
    const systems = Array.from(systemsMap.values());

    // Determine overall status
    let overallStatus: 'not_started' | 'scheduled' | 'in_progress' | 'completed' | 'failed' = 'not_started';
    if (systems.length > 0) {
      if (systems.every(s => s.status === 'provisioned')) {
        overallStatus = 'completed';
      } else if (systems.some(s => s.status === 'scheduled')) {
        overallStatus = 'scheduled';
      } else if (systems.some(s => s.status === 'pending')) {
        overallStatus = 'in_progress';
      }
    }

    return {
      onboardingId,
      employeeId: onboarding.employeeId.toString(),
      overallStatus,
      systems,
      requestedAt,
    };

  }


  // ============================================================================
  // ONB-012: EQUIPMENT, DESK, AND ACCESS CARD RESERVATION
  // As a HR Employee, I want to reserve equipment, desk and access cards.
  // BR 9(c): Auto onboarding tasks for Admin (workspace, ID badge)
  // ============================================================================

  /**
   * Reserve equipment for a new hire
   */
  async reserveEquipment(dto: ReserveEquipmentDto): Promise<ReservationResultDto> {
    const onboarding = await this.onboardingModel.findById(dto.onboardingId).exec();
    if (!onboarding) {
      throw new NotFoundException(`Onboarding with ID ${dto.onboardingId} not found`);
    }

    const reservationData = {
      onboardingId: dto.onboardingId,
      resourceType: 'equipment',
      equipmentType: dto.equipmentType,
      specification: dto.specification,
      quantity: dto.quantity,
      neededByDate: dto.neededByDate,
      notes: dto.notes,
      status: 'pending',
      reservedAt: new Date().toISOString(),
    };

    const doc = await this.documentModel.create({
      ownerId: onboarding.employeeId,
      type: DocumentType.CERTIFICATE,
      filePath: `${this.EQUIPMENT_PREFIX}${JSON.stringify(reservationData)}`,
      uploadedAt: new Date(),
    });

    // Add task to onboarding
    onboarding.tasks.push({
      name: `Reserve ${dto.equipmentType}`,
      department: 'Admin',
      status: OnboardingTaskStatus.IN_PROGRESS,
      deadline: dto.neededByDate,
    });
    await onboarding.save();

    return {
      success: true,
      reservationId: (doc._id as Types.ObjectId).toString(),
      resourceType: 'equipment',
      message: `${dto.equipmentType} reservation created`,
      estimatedReadyDate: dto.neededByDate,
    };
  }

  /**
   * Reserve a desk/workspace for a new hire
   */
  async reserveDesk(dto: ReserveDeskDto): Promise<ReservationResultDto> {
    const onboarding = await this.onboardingModel.findById(dto.onboardingId).exec();
    if (!onboarding) {
      throw new NotFoundException(`Onboarding with ID ${dto.onboardingId} not found`);
    }

    const reservationData = {
      onboardingId: dto.onboardingId,
      resourceType: 'desk',
      building: dto.building,
      floor: dto.floor,
      preferredArea: dto.preferredArea,
      specialRequirements: dto.specialRequirements,
      startDate: dto.startDate,
      status: 'pending',
      reservedAt: new Date().toISOString(),
    };

    const doc = await this.documentModel.create({
      ownerId: onboarding.employeeId,
      type: DocumentType.CERTIFICATE,
      filePath: `${this.DESK_PREFIX}${JSON.stringify(reservationData)}`,
      uploadedAt: new Date(),
    });

    // Add task to onboarding
    onboarding.tasks.push({
      name: 'Reserve workspace/desk',
      department: 'Admin',
      status: OnboardingTaskStatus.IN_PROGRESS,
      deadline: dto.startDate,
    });
    await onboarding.save();

    return {
      success: true,
      reservationId: (doc._id as Types.ObjectId).toString(),
      resourceType: 'desk',
      message: 'Desk reservation created',
      estimatedReadyDate: dto.startDate,
    };
  }

  /**
   * Reserve an access card for a new hire
   */
  async reserveAccessCard(dto: ReserveAccessCardDto): Promise<ReservationResultDto> {
    const onboarding = await this.onboardingModel.findById(dto.onboardingId).exec();
    if (!onboarding) {
      throw new NotFoundException(`Onboarding with ID ${dto.onboardingId} not found`);
    }

    const reservationData = {
      onboardingId: dto.onboardingId,
      resourceType: 'access_card',
      cardType: dto.cardType,
      accessZones: dto.accessZones,
      photoProvided: dto.photoProvided,
      neededByDate: dto.neededByDate,
      status: 'pending',
      reservedAt: new Date().toISOString(),
    };

    const doc = await this.documentModel.create({
      ownerId: onboarding.employeeId,
      type: DocumentType.CERTIFICATE,
      filePath: `${this.ACCESSCARD_PREFIX}${JSON.stringify(reservationData)}`,
      uploadedAt: new Date(),
    });

    // Add task to onboarding
    onboarding.tasks.push({
      name: 'Issue ID badge/access card',
      department: 'Admin',
      status: OnboardingTaskStatus.IN_PROGRESS,
      deadline: dto.neededByDate,
    });
    await onboarding.save();

    return {
      success: true,
      reservationId: (doc._id as Types.ObjectId).toString(),
      resourceType: 'access_card',
      message: 'Access card reservation created',
      estimatedReadyDate: dto.neededByDate,
    };
  }

  /**
   * Get all reservations for an onboarding
   */
  async getResourceReservations(onboardingId: string): Promise<AllReservationsDto> {
    const onboarding = await this.onboardingModel.findById(onboardingId).exec();
    if (!onboarding) {
      throw new NotFoundException(`Onboarding with ID ${onboardingId} not found`);
    }

    const equipmentDocs = await this.documentModel.find({
      ownerId: onboarding.employeeId,
      filePath: { $regex: `^${this.EQUIPMENT_PREFIX}` },
    }).exec();

    const deskDocs = await this.documentModel.find({
      ownerId: onboarding.employeeId,
      filePath: { $regex: `^${this.DESK_PREFIX}` },
    }).exec();

    const accessCardDocs = await this.documentModel.find({
      ownerId: onboarding.employeeId,
      filePath: { $regex: `^${this.ACCESSCARD_PREFIX}` },
    }).exec();

    const equipment = equipmentDocs.map((d) => this.mapToReservationDto(d, this.EQUIPMENT_PREFIX));
    const desk = deskDocs.length > 0 ? this.mapToReservationDto(deskDocs[0], this.DESK_PREFIX) : undefined;
    const accessCard = accessCardDocs.length > 0
      ? this.mapToReservationDto(accessCardDocs[0], this.ACCESSCARD_PREFIX)
      : undefined;

    const allReady = equipment.every((e) => e.status === 'ready' || e.status === 'assigned') &&
      (!desk || desk.status === 'ready' || desk.status === 'assigned') &&
      (!accessCard || accessCard.status === 'ready' || accessCard.status === 'assigned');

    return {
      onboardingId,
      equipment,
      desk,
      accessCard,
      allReady,
    };
  }

  // ============================================================================
  // ONB-013: AUTOMATED ACCOUNT PROVISIONING & REVOCATION
  // BR 9(b): IT provisioning is automated
  // BR 20: Support onboarding cancellation for "no show"
  // 
  // When scheduling provisioning, send a notification to System Admin so they
  // can provide the employee email and other access credentials.
  // ============================================================================

  /**
   * Schedule account provisioning for start date
   * Sends notification to System Admin to set up email for new hire
   * ONB-013: Persists the scheduled provisioning to the database
   */
  async scheduleProvisioning(dto: ScheduleProvisioningDto): Promise<{
    scheduled: boolean;
    scheduledFor: Date;
    systems: string[];
    taskId: string;
    notificationSent: boolean;
  }> {
    const onboarding = await this.onboardingModel.findById(dto.onboardingId).exec();
    if (!onboarding) {
      throw new NotFoundException(`Onboarding with ID ${dto.onboardingId} not found`);
    }

    // Transform startDate to Date object if it's a string
    const startDate = dto.startDate instanceof Date ? dto.startDate : new Date(dto.startDate);

    // Look up candidate to get employee name
    const candidate = await this.candidateModel.findById(onboarding.employeeId).exec();
    const employeeName = candidate?.firstName
      ? `${candidate.firstName} ${candidate.lastName || ''}`.trim()
      : 'New Hire';

    const contract = await this.contractModel.findById(onboarding.contractId).exec();
    const offer = contract ? await this.offerModel.findById(contract.offerId).exec() : null;

    const provRequest: ProvisioningRequest = {
      employeeId: onboarding.employeeId.toString(),
      employeeName,
      email: `employee.${onboarding.employeeId}@company.com`,
      department: offer?.role || 'Unknown',
      position: offer?.role || 'Unknown',
      startDate: startDate,
    };

    const result = await this.itProvisioningService.scheduleProvisioning(provRequest, dto.systems);

    // ONB-013: Persist the scheduled provisioning to the database
    const provisioningData = {
      onboardingId: dto.onboardingId,
      systems: dto.systems,
      requestedBy: 'HR Manager',
      requestedAt: new Date().toISOString(),
      scheduledFor: startDate.toISOString(),
      status: 'scheduled', // New status for scheduled provisioning
      taskId: result.taskId,
    };

    // Save to documents collection for status tracking
    await this.documentModel.create({
      ownerId: onboarding.employeeId,
      type: DocumentType.CERTIFICATE,
      filePath: `${this.PROVISIONING_PREFIX}${JSON.stringify(provisioningData)}`,
      uploadedAt: new Date(),
    });

    // ONB-013: Send notification to System Admin for email setup
    let notificationSent = false;
    try {
      // Find all System Admins to notify
      const systemAdmins = await this.employeeSystemRoleModel.find({
        roles: SystemRole.SYSTEM_ADMIN,
      }).exec();

      // Send notification to each System Admin
      for (const adminRole of systemAdmins) {
        await this.notificationService.sendNotification({
          recipientId: adminRole.employeeProfileId.toString(),
          type: 'IT_PROVISIONING_REQUESTED',
          subject: '🔧 IT Provisioning Request - New Hire Email Setup Required',
          message: `A new hire (Employee ID: ${onboarding.employeeId}) requires IT provisioning. Please set up email and system access. Systems requested: ${dto.systems.join(', ')}. Start date: ${startDate.toDateString()}.`,
          metadata: {
            onboardingId: dto.onboardingId,
            employeeId: onboarding.employeeId.toString(),
            systems: dto.systems,
            startDate: startDate.toISOString(),
          },
        });
        notificationSent = true;
      }

      // If no System Admins found, log a warning
      if (systemAdmins.length === 0) {
        console.warn('No System Admins found to notify for IT provisioning request');
      }
    } catch (error) {
      console.error('Failed to send notification to System Admin:', error);
    }

    return {
      scheduled: true,
      scheduledFor: result.scheduledFor,
      systems: result.systems,
      taskId: result.taskId,
      notificationSent,
    };
  }


  /**
   * Schedule account revocation for exit date
   */
  async scheduleRevocation(dto: ScheduleRevocationDto): Promise<{
    scheduled: boolean;
    scheduledFor: Date;
    taskId: string;
  }> {
    // Transform exitDate to Date object if it's a string
    const exitDate = dto.exitDate instanceof Date ? dto.exitDate : new Date(dto.exitDate);

    const revRequest: RevocationRequest = {
      employeeId: dto.employeeId,
      reason: dto.reason,
      effectiveDate: exitDate,
      revokeImmediately: dto.revokeImmediately,
    };

    const systems = ['email', 'laptop', 'payroll', 'internal_systems', 'vpn'];
    const result = await this.itProvisioningService.scheduleRevocation(revRequest, systems);

    return {
      scheduled: true,
      scheduledFor: result.scheduledFor,
      taskId: result.taskId,
    };
  }

  /**
   * Cancel onboarding (no-show or other reasons)
   * BR 20: Allow onboarding cancellation/termination
   */
  async cancelOnboarding(dto: CancelOnboardingDto): Promise<CancelOnboardingResultDto> {
    const onboarding = await this.onboardingModel.findById(dto.onboardingId).exec();
    if (!onboarding) {
      throw new NotFoundException(`Onboarding with ID ${dto.onboardingId} not found`);
    }

    // Cancel pending provisioning
    const cancelResult = await this.itProvisioningService.cancelPendingProvisioning(
      onboarding.employeeId.toString(),
      dto.reason,
    );

    // Mark onboarding as cancelled (set all tasks to cancelled state)
    for (const task of onboarding.tasks) {
      if (task.status !== OnboardingTaskStatus.COMPLETED) {
        task.status = OnboardingTaskStatus.CANCELLED;
        task.notes = `Cancelled: ${dto.reason}`;
      }
    }
    onboarding.completed = true;
    onboarding.completedAt = new Date();
    await onboarding.save();

    // Count cancelled reservations
    const reservations = await this.getResourceReservations(dto.onboardingId);
    const reservationsCancelled = reservations.equipment.length +
      (reservations.desk ? 1 : 0) +
      (reservations.accessCard ? 1 : 0);

    return {
      success: true,
      onboardingId: dto.onboardingId,
      provisioningTasksCancelled: cancelResult.tasksCancelled,
      reservationsCancelled,
      message: `Onboarding cancelled due to: ${dto.reason}`,
    };
  }

  // ============================================================================
  // ONB-018: PAYROLL INITIATION
  // As a HR Manager, I want the system to automatically handle payroll
  // initiation based on the contract signing day.
  // BR 9(a): Auto onboarding tasks for HR (payroll & benefits creation)
  // 
  // Simplified: Just verify start date exists on contract. If already set
  // in a previous phase, this step can be skipped.
  // ============================================================================

  /**
   * Initiate payroll for a new hire
   * ONB-018: Automatically handle payroll initiation based on contract signing day
   * 
   * This method:
   * 1. Derives effective date from contract if not provided
   * 2. Creates a payroll enrollment record in the documents collection
   * 3. Updates the employee profile with payroll-effective date
   * 4. Adds a completed task to the onboarding tracker
   * 
   * The payroll enrollment record can be queried by Payroll Module (REQ-PY-23)
   */
  async initiatePayroll(dto: InitiatePayrollDto): Promise<PayrollInitiationResultDto> {
    const onboarding = await this.onboardingModel.findById(dto.onboardingId).exec();
    if (!onboarding) {
      throw new NotFoundException(`Onboarding with ID ${dto.onboardingId} not found`);
    }

    const contract = await this.contractModel.findById(dto.contractId).exec();
    if (!contract) {
      throw new NotFoundException(`Contract with ID ${dto.contractId} not found`);
    }

    // Derive effective date from contract if not provided
    // Per ONB-018: "automatically handle payroll initiation based on the contract signing day"
    let effectiveDate: Date = dto.effectiveDate || new Date();
    if (!dto.effectiveDate) {
      // Try to get from contract: employee signed date, start date, or created date
      if (contract.employeeSignedAt) {
        effectiveDate = contract.employeeSignedAt;
      } else if ((contract as any).startDate) {
        effectiveDate = (contract as any).startDate;
      } else {
        effectiveDate = (contract as any).createdAt || new Date();
      }
    }

    // Check if payroll enrollment document already exists (more reliable than task check)
    const existingPayrollDoc = await this.documentModel.findOne({
      ownerId: onboarding.employeeId,
      filePath: { $regex: `^${this.PAYROLL_PREFIX}` },
    }).exec();

    if (existingPayrollDoc) {
      return {
        success: true,
        onboardingId: dto.onboardingId,
        payrollRecordId: (existingPayrollDoc._id as Types.ObjectId).toString(),
        effectiveDate: effectiveDate,
        firstPayrollCycle: 'current',
        grossSalary: contract.grossSalary,
        message: 'Payroll already initiated - enrollment document exists',
      };
    }

    // Create payroll enrollment record in documents collection
    // This record links the employee to the payroll system with their salary details
    const payrollEnrollmentData = {
      onboardingId: dto.onboardingId,
      contractId: dto.contractId,
      employeeId: onboarding.employeeId.toString(),
      effectiveDate: effectiveDate.toISOString(),
      grossSalary: contract.grossSalary,
      signingBonus: contract.signingBonus || 0,
      benefits: contract.benefits || [],
      payrollCycle: dto.payrollCycle || 'current',
      proRateFirstSalary: dto.proRateFirstSalary ?? true,
      status: 'enrolled',
      enrolledAt: new Date().toISOString(),
    };

    // Store in documents collection with PAYROLL_PREFIX for Payroll Module to query
    const payrollDoc = await this.documentModel.create({
      ownerId: onboarding.employeeId,
      type: DocumentType.CONTRACT, // Using CONTRACT type as carrier
      filePath: `${this.PAYROLL_PREFIX}${JSON.stringify(payrollEnrollmentData)}`,
      uploadedAt: new Date(),
    });

    // Update employee profile with payroll-effective date
    await this.employeeProfileModel.findByIdAndUpdate(
      onboarding.employeeId,
      {
        $set: {
          dateOfHire: effectiveDate,
          contractStartDate: effectiveDate,
        },
      },
      { new: true },
    );

    // Add payroll initiation task to onboarding
    onboarding.tasks.push({
      name: 'Payroll account setup',
      department: 'HR',
      status: OnboardingTaskStatus.COMPLETED,
      completedAt: new Date(),
    });
    await onboarding.save();

    console.log(`[ONB-018] Payroll initiated for employee ${onboarding.employeeId}, enrollment doc: ${payrollDoc._id}`);

    return {
      success: true,
      onboardingId: dto.onboardingId,
      payrollRecordId: (payrollDoc._id as Types.ObjectId).toString(),
      effectiveDate: effectiveDate,
      firstPayrollCycle: dto.payrollCycle || 'current',
      grossSalary: contract.grossSalary,
      message: 'Payroll initiated - employee enrolled in payroll system',
    };
  }

  // ============================================================================
  // ONB-019: SIGNING BONUS PROCESSING
  // As a HR Manager, I want the system to automatically process signing bonuses.
  // BR 9(a): Related to payroll processing
  // 
  // Creates an employeeSigningBonus document in the payroll-execution module
  // to track the signing bonus for this employee.
  // ============================================================================

  /**
   * Process signing bonus for a new hire
   * Creates an employeeSigningBonus document in payroll-execution
   */
  async processSigningBonus(dto: ProcessSigningBonusDto): Promise<SigningBonusResultDto> {
    const onboarding = await this.onboardingModel.findById(dto.onboardingId).exec();
    if (!onboarding) {
      throw new NotFoundException(`Onboarding with ID ${dto.onboardingId} not found`);
    }

    const contract = await this.contractModel.findById(dto.contractId).exec();
    if (!contract) {
      throw new NotFoundException(`Contract with ID ${dto.contractId} not found`);
    }

    // If signingBonusConfigId is provided, validate it exists and is approved
    let signingBonusConfig: signingBonusDocument | null = null;
    let configBonusAmount = 0;

    if (dto.signingBonusConfigId) {
      signingBonusConfig = await this.signingBonusConfigModel.findById(dto.signingBonusConfigId).exec();
      if (!signingBonusConfig) {
        throw new NotFoundException(`Signing bonus config with ID ${dto.signingBonusConfigId} not found`);
      }
      if (signingBonusConfig.status !== ConfigStatus.APPROVED) {
        throw new BadRequestException(
          `Signing bonus config "${signingBonusConfig.positionName}" is not approved (current status: ${signingBonusConfig.status})`,
        );
      }
      configBonusAmount = signingBonusConfig.amount;
    }

    // Priority: 1) override amount, 2) config amount, 3) contract signing bonus
    const bonusAmount = dto.overrideAmount || configBonusAmount || contract.signingBonus || 0;

    if (bonusAmount <= 0) {
      return {
        success: false,
        onboardingId: dto.onboardingId,
        amount: 0,
        status: 'rejected',
        message: 'No signing bonus specified in contract',
      };
    }

    // Calculate scheduled payment date based on schedule
    let scheduledPaymentDate: Date = new Date();
    switch (dto.paymentSchedule) {
      case 'immediate':
        scheduledPaymentDate = new Date();
        break;
      case 'first_payroll':
        // Assume next month 1st
        scheduledPaymentDate = new Date();
        scheduledPaymentDate.setMonth(scheduledPaymentDate.getMonth() + 1);
        scheduledPaymentDate.setDate(1);
        break;
      case 'after_probation':
        // Assume 3 months from now
        scheduledPaymentDate = new Date();
        scheduledPaymentDate.setMonth(scheduledPaymentDate.getMonth() + 3);
        break;
      default:
        // Default to immediate
        scheduledPaymentDate = new Date();
        break;
    }

    // Create employeeSigningBonus document in payroll-execution
    // Use validated config ID if provided, otherwise create a placeholder reference
    const signingBonusRecord = await this.employeeSigningBonusModel.create({
      employeeId: onboarding.employeeId,
      signingBonusId: signingBonusConfig
        ? signingBonusConfig._id
        : new Types.ObjectId(), // Placeholder if no config reference
      givenAmount: bonusAmount,
      paymentDate: scheduledPaymentDate,
      status: BonusStatus.PENDING,
    });

    // Add bonus task to onboarding
    onboarding.tasks.push({
      name: 'Process signing bonus',
      department: 'HR',
      status: OnboardingTaskStatus.COMPLETED,
      completedAt: new Date(),
    });
    await onboarding.save();

    return {
      success: true,
      onboardingId: dto.onboardingId,
      signingBonusRecordId: signingBonusRecord._id.toString(),
      amount: bonusAmount,
      status: 'pending',
      scheduledPaymentDate,
      message: `Signing bonus of ${bonusAmount} scheduled for ${dto.paymentSchedule}`,
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Map onboarding to tracker DTO
   */
  private mapToTrackerDto(onboarding: OnboardingDocument): OnboardingTrackerDto {
    const tasks = onboarding.tasks.map((t, i) => this.mapToTaskDto(t, i));
    const completedTasks = tasks.filter((t) => t.status === OnboardingTaskStatus.COMPLETED).length;
    const overdueTasks = tasks.filter((t) => t.isOverdue).length;
    const progressPercentage = tasks.length > 0
      ? Math.round((completedTasks / tasks.length) * 100)
      : 0;

    return {
      onboardingId: (onboarding._id as Types.ObjectId).toString(),
      employeeId: onboarding.employeeId.toString(),
      contractId: onboarding.contractId.toString(),
      tasks,
      progressPercentage,
      completedTasks,
      totalTasks: tasks.length,
      overdueTasks,
      completed: onboarding.completed,
      completedAt: onboarding.completedAt,
    };
  }

  /**
   * Map task to DTO
   */
  private mapToTaskDto(task: any, index: number): OnboardingTaskDto {
    const now = new Date();
    const deadline = task.deadline ? new Date(task.deadline) : null;
    const isOverdue = deadline
      ? deadline < now && task.status !== OnboardingTaskStatus.COMPLETED
      : false;
    const daysUntilDeadline = deadline
      ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    let category: string | undefined;
    if (task.notes && task.notes.startsWith('category:')) {
      category = task.notes.replace('category:', '');
    }

    return {
      taskIndex: index,
      name: task.name,
      department: task.department,
      category,
      status: task.status,
      deadline: task.deadline,
      completedAt: task.completedAt,
      documentId: task.documentId?.toString(),
      notes: task.notes,
      isOverdue,
      daysUntilDeadline,
    };
  }

  /**
   * Map document to record DTO
   */
  private mapToDocumentRecord(doc: DocumentDocument): DocumentRecordDto {
    let filePath = doc.filePath;
    let verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' = 'PENDING';
    let verifiedBy: string | undefined;
    let verifiedAt: Date | undefined;
    let rejectionReason: string | undefined;

    if (filePath.startsWith(this.VERIFICATION_PREFIX)) {
      try {
        const parts = filePath.replace(this.VERIFICATION_PREFIX, '').split('::');
        const meta = JSON.parse(parts[0]);
        filePath = parts[1];
        verificationStatus = meta.verificationStatus;
        verifiedBy = meta.verifiedBy;
        verifiedAt = meta.verifiedAt ? new Date(meta.verifiedAt) : undefined;
        rejectionReason = meta.rejectionReason;
      } catch {
        // Ignore parse errors
      }
    }

    return {
      documentId: (doc._id as Types.ObjectId).toString(),
      documentType: doc.type,
      documentName: filePath.split('/').pop() || 'Unknown',
      filePath,
      uploadedAt: doc.uploadedAt,
      verificationStatus,
      verifiedBy,
      verifiedAt,
      rejectionReason,
    };
  }

  /**
   * Map document to reservation DTO
   */
  private mapToReservationDto(doc: DocumentDocument, prefix: string): ResourceReservationDto {
    const data = JSON.parse(doc.filePath.replace(prefix, ''));
    return {
      reservationId: (doc._id as Types.ObjectId).toString(),
      resourceType: data.resourceType,
      details: data,
      status: data.status,
      reservedAt: new Date(data.reservedAt),
      readyAt: data.readyAt ? new Date(data.readyAt) : undefined,
      assignedAt: data.assignedAt ? new Date(data.assignedAt) : undefined,
      notes: data.notes,
    };
  }

  // ============================================================================
  // ONBOARDING COMPLETION - Role Transition
  // When all tasks are completed, transition from Job Candidate to Employee
  // ============================================================================

  /**
   * Finalize onboarding completion and transition the new hire to an active employee
   * 
   * This method:
   * 1. Verifies all onboarding tasks are completed
   * 2. Updates EmployeeProfile status from Onboarding → Active
   * 3. Updates EmployeeSystemRole from Job Candidate → hired role (from contract)
   * 4. Updates Candidate status to Hired
   * 5. Sends completion notification
   */
  async finalizeOnboardingCompletion(onboardingId: string): Promise<{
    success: boolean;
    employeeId: string;
    previousRole: string;
    newRole: string;
    message: string;
  }> {
    const onboarding = await this.onboardingModel.findById(onboardingId).exec();
    if (!onboarding) {
      throw new NotFoundException(`Onboarding with ID ${onboardingId} not found`);
    }

    // Verify all tasks are completed
    const allCompleted = onboarding.tasks.every(
      (t) => t.status === OnboardingTaskStatus.COMPLETED,
    );
    if (!allCompleted) {
      throw new BadRequestException('Not all onboarding tasks are completed. Cannot finalize.');
    }

    // Get the contract to find the hired role (optional - may not exist for test data)
    let newRole: SystemRole = SystemRole.DEPARTMENT_EMPLOYEE;
    let candidateId: string | undefined;

    if (onboarding.contractId) {
      const contract = await this.contractModel.findById(onboarding.contractId).exec();
      if (contract && contract.offerId) {
        // Get the offer to find candidate info and role
        const offer = await this.offerModel.findById(contract.offerId).exec();
        if (offer) {
          candidateId = offer.candidateId?.toString();
          // Determine the new role from the contract/offer
          if (offer.role) {
            // Try to match the role string to a SystemRole enum value
            const roleMatch = Object.values(SystemRole).find(
              (r) => r.toLowerCase() === offer.role?.toLowerCase()
            );
            if (roleMatch) {
              newRole = roleMatch;
            }
          }
        }
      }
    }
    console.log(`[ONBOARDING] Using role: ${newRole} for employee transition`);

    const employeeId = onboarding.employeeId.toString();

    // 1. Update Employee Profile status to Active
    const employeeProfile = await this.employeeProfileModel.findById(employeeId).exec();
    if (employeeProfile) {
      employeeProfile.status = EmployeeStatus.ACTIVE;
      employeeProfile.statusEffectiveFrom = new Date();
      await employeeProfile.save();
      console.log(`[ONBOARDING] Updated employee ${employeeId} status to ACTIVE`);
    }

    // 2. Update Employee System Role - remove Job Candidate, add new role
    const systemRole = await this.employeeSystemRoleModel.findOne({
      employeeProfileId: new Types.ObjectId(employeeId),
    }).exec();

    const previousRole = systemRole?.roles?.join(', ') || 'Job Candidate';

    if (systemRole) {
      // Replace Job Candidate with the new role
      systemRole.roles = [newRole];
      systemRole.isActive = true;
      await systemRole.save();
      console.log(`[ONBOARDING] Updated system role from [${previousRole}] to [${newRole}]`);
    } else {
      // Create new system role if doesn't exist
      await this.employeeSystemRoleModel.create({
        employeeProfileId: new Types.ObjectId(employeeId),
        roles: [newRole],
        permissions: [],
        isActive: true,
      });
      console.log(`[ONBOARDING] Created new system role [${newRole}] for employee ${employeeId}`);
    }

    // 3. Update Candidate status to Hired (if we have the candidateId)
    if (candidateId) {
      const candidate = await this.candidateModel.findById(candidateId).exec();
      if (candidate) {
        candidate.status = CandidateStatus.HIRED;
        await candidate.save();
        console.log(`[ONBOARDING] Updated candidate ${candidate._id} status to HIRED`);
      }
    }

    // 4. Mark onboarding as finalized
    onboarding.completed = true;
    onboarding.completedAt = new Date();
    await onboarding.save();

    // 5. Send completion notification
    await this.notificationService.sendOnboardingComplete(
      employeeId,
      `Congratulations! Your onboarding is complete. You have been assigned the role: ${newRole}`,
    );

    console.log(`[ONBOARDING] Finalized onboarding ${onboardingId} - Employee ${employeeId} transitioned to ${newRole}`);

    return {
      success: true,
      employeeId,
      previousRole,
      newRole,
      message: `Onboarding completed successfully. Role changed from "${previousRole}" to "${newRole}".`,
    };
  }

  /**
   * Check if onboarding can be finalized (all tasks complete)
   */
  async canFinalizeOnboarding(onboardingId: string): Promise<{
    canFinalize: boolean;
    completedTasks: number;
    totalTasks: number;
    pendingTasks: string[];
  }> {
    const onboarding = await this.onboardingModel.findById(onboardingId).exec();
    if (!onboarding) {
      throw new NotFoundException(`Onboarding with ID ${onboardingId} not found`);
    }

    const completedTasks = onboarding.tasks.filter(
      (t) => t.status === OnboardingTaskStatus.COMPLETED
    ).length;
    const totalTasks = onboarding.tasks.length;
    const pendingTasks = onboarding.tasks
      .filter((t) => t.status !== OnboardingTaskStatus.COMPLETED)
      .map((t) => t.name);

    return {
      canFinalize: completedTasks === totalTasks,
      completedTasks,
      totalTasks,
      pendingTasks,
    };
  }
}


// yarab this is working