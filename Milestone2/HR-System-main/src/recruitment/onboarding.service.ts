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
import { BonusStatus } from '../../payroll-execution/enums/payroll-execution-enum';
import { ConfigStatus } from '../../payroll-configuration/enums/payroll-configuration-enums';
import { SystemRole } from '../../employee-profile/enums/employee-profile.enums';

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
    
    private readonly notificationService: NotificationService,
    private readonly employeeProfileService: EmployeeProfileService,
    private readonly itProvisioningService: ITProvisioningService,
  ) {}

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
    const existing = await this.onboardingModel.findOne({
      contractId: new Types.ObjectId(contractId),
    }).exec();

    if (existing) {
      return existing;
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

    // Convert template tasks to onboarding tasks
    const newTasks = template.tasks.map((t) => ({
      name: t.name,
      department: t.department,
      status: OnboardingTaskStatus.PENDING,
      deadline: new Date(startDate.getTime() + t.daysFromStart * 24 * 60 * 60 * 1000),
      notes: t.category ? `category:${t.category}` : undefined,
    }));

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
   * Stub implementation - would integrate with EmployeeProfileService
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

    // Generate employee number
    const employeeNumber = `EMP-${Date.now()}`;

    // Stub: In real implementation, would call employeeProfileService.create()
    console.log(`[ONBOARDING] Creating employee profile from contract ${dto.contractId}`);
    console.log(`  - Candidate: ${offer.candidateId}`);
    console.log(`  - Start Date: ${dto.startDate}`);
    console.log(`  - Employee Number: ${employeeNumber}`);

    return {
      success: true,
      employeeProfileId: `profile-${Date.now()}`,
      employeeNumber,
      candidateId: offer.candidateId.toString(),
      contractId: dto.contractId,
      message: 'Employee profile created successfully',
    };
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
   * Get all onboardings
   */
  async getAllOnboardings(): Promise<OnboardingTrackerDto[]> {
    const onboardings = await this.onboardingModel.find().exec();
    return Promise.all(onboardings.map((o) => this.mapToTrackerDto(o)));
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

    // Create document record
    const doc = await this.documentModel.create({
      ownerId: contract.offerId,
      type: DocumentType.CONTRACT,
      filePath: dto.filePath,
      uploadedAt: new Date(),
    });

    // Update contract
    contract.documentId = doc._id as Types.ObjectId;
    if (dto.employeeSignatureUrl) {
      contract.employeeSignatureUrl = dto.employeeSignatureUrl;
      contract.employeeSignedAt = new Date();
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

    const doc = await this.documentModel.create({
      ownerId: onboarding.employeeId,
      type: DocumentType.CERTIFICATE,
      filePath: dto.filePath,
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
   */
  async getProvisioningStatus(onboardingId: string): Promise<ProvisioningStatusDto> {
    const onboarding = await this.onboardingModel.findById(onboardingId).exec();
    if (!onboarding) {
      throw new NotFoundException(`Onboarding with ID ${onboardingId} not found`);
    }

    // Get provisioning records
    const docs = await this.documentModel.find({
      ownerId: onboarding.employeeId,
      filePath: { $regex: `^${this.PROVISIONING_PREFIX}` },
    }).exec();

    const systems: SystemProvisioningStatusDto[] = [];
    let requestedAt: Date | undefined;

    for (const doc of docs) {
      const data = JSON.parse(doc.filePath.replace(this.PROVISIONING_PREFIX, ''));
      requestedAt = new Date(data.requestedAt);
      for (const system of data.systems) {
        systems.push({
          system,
          status: data.status || 'pending',
          provisionedAt: data.status === 'provisioned' ? new Date() : undefined,
        });
      }
    }

    // Get status from IT service
    const itStatus = await this.itProvisioningService.getProvisioningStatus(
      onboarding.employeeId.toString(),
    );

    return {
      onboardingId,
      employeeId: onboarding.employeeId.toString(),
      overallStatus: systems.length > 0 ? 'in_progress' : 'not_started',
      systems: [
        { system: 'email', status: itStatus.email },
        { system: 'laptop', status: itStatus.laptop },
        { system: 'systemAccess', status: itStatus.systemAccess },
        { system: 'payroll', status: itStatus.payroll },
      ],
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
      startDate: dto.startDate,
    };

    const result = await this.itProvisioningService.scheduleProvisioning(provRequest, dto.systems);

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
          message: `A new hire (Employee ID: ${onboarding.employeeId}) requires IT provisioning. Please set up email and system access. Systems requested: ${dto.systems.join(', ')}. Start date: ${dto.startDate.toDateString()}.`,
          metadata: {
            onboardingId: dto.onboardingId,
            employeeId: onboarding.employeeId.toString(),
            systems: dto.systems,
            startDate: dto.startDate.toISOString(),
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
    const revRequest: RevocationRequest = {
      employeeId: dto.employeeId,
      reason: dto.reason,
      effectiveDate: dto.exitDate,
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
   * Simplified: Verifies effective date is provided
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

    // Check if payroll task already exists (may have been done in previous phase)
    const existingPayrollTask = onboarding.tasks.find(
      (t) => t.name === 'Payroll account setup' && t.status === OnboardingTaskStatus.COMPLETED,
    );
    
    if (existingPayrollTask) {
      return {
        success: true,
        onboardingId: dto.onboardingId,
        effectiveDate: dto.effectiveDate,
        firstPayrollCycle: 'current',
        grossSalary: contract.grossSalary,
        message: 'Payroll already initiated - completed in previous phase',
      };
    }

    // Verify effective date is provided in the DTO
    if (!dto.effectiveDate) {
      throw new BadRequestException('Effective date must be provided for payroll initiation');
    }

    // Add payroll initiation task to onboarding
    onboarding.tasks.push({
      name: 'Payroll account setup',
      department: 'HR',
      status: OnboardingTaskStatus.COMPLETED,
      completedAt: new Date(),
    });
    await onboarding.save();

    return {
      success: true,
      onboardingId: dto.onboardingId,
      effectiveDate: dto.effectiveDate,
      firstPayrollCycle: dto.payrollCycle || 'current',
      grossSalary: contract.grossSalary,
      message: 'Payroll initiation verified - start date confirmed',
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
}
