/**
 * OnboardingController
 * 
 * HTTP endpoints for onboarding operations including:
 * - ONB-001: Checklist template management
 * - ONB-002: Contract access and employee profile creation
 * - ONB-004: New hire onboarding tracker
 * - ONB-005: Reminders and notifications
 * - ONB-007: Compliance document management
 * - ONB-009: System access provisioning
 * - ONB-012: Equipment, desk, and access card reservation
 * - ONB-013: Automated account provisioning and revocation
 * - ONB-018: Payroll initiation
 * - ONB-019: Signing bonus processing
 * - Unnamed: Candidate document uploads
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { AuthenticationGuard } from '../auth/guards/authentication.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SystemRole } from '../employee-profile/enums/employee-profile.enums';
import {
  // ONB-001
  CreateChecklistTemplateDto,
  ChecklistTemplateDto,
  // ONB-002
  SignedContractDetailsDto,
  CreateEmployeeFromContractDto,
  EmployeeProfileCreatedDto,
  // ONB-004
  OnboardingTrackerDto,
  OnboardingTaskDto,
  UpdateTaskStatusDto,
  CompleteTaskDto,
  // ONB-007
  UploadDocumentDto,
  DocumentRecordDto,
  VerifyDocumentDto,
  ComplianceStatusDto,
  // Unnamed story
  UploadSignedContractDto,
  UploadOnboardingFormDto,
  SignedContractUploadResultDto,
  FormUploadResultDto,
  // ONB-009
  ProvisionAccessDto,
  ProvisioningStatusDto,
  ProvisioningResultDto,
  // ONB-012
  ReserveEquipmentDto,
  ReserveDeskDto,
  ReserveAccessCardDto,
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
} from './dto/onboarding.dto';

@Controller('onboarding')
@UseGuards(AuthenticationGuard, RolesGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  // ============================================================================
  // ONB-001: CHECKLIST TEMPLATE ENDPOINTS
  // As an HR Manager, I want to create onboarding task checklists
  // ============================================================================

  /**
   * POST /onboarding/templates
   * 
   * Create a new checklist template.
   * Templates define reusable sets of onboarding tasks.
   * 
   * @param dto - Template creation data
   * @returns ChecklistTemplateDto - Created template
   */
  @Post('templates')
  @Roles(SystemRole.HR_MANAGER)
  async createChecklistTemplate(
    @Body() dto: CreateChecklistTemplateDto,
  ): Promise<ChecklistTemplateDto> {
    return this.onboardingService.createChecklistTemplate(dto);
  }

  /**
   * GET /onboarding/templates
   * 
   * Get all checklist templates.
   * 
   * @returns ChecklistTemplateDto[] - All templates
   */
  @Get('templates')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  async getChecklistTemplates(): Promise<ChecklistTemplateDto[]> {
    return this.onboardingService.getChecklistTemplates();
  }

  /**
   * GET /onboarding/templates/:templateId
   * 
   * Get a specific template.
   * 
   * @param templateId - The template ID
   * @returns ChecklistTemplateDto | null - The template or null
   */
  @Get('templates/:templateId')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  async getChecklistTemplateById(
    @Param('templateId') templateId: string,
  ): Promise<ChecklistTemplateDto | null> {
    return this.onboardingService.getChecklistTemplateById(templateId);
  }

  /**
   * POST /onboarding/:onboardingId/apply-template
   * 
   * Apply a template to an existing onboarding.
   * Adds template tasks to the onboarding.
   * 
   * @param onboardingId - The onboarding ID
   * @param body - Template ID and start date
   * @returns OnboardingTrackerDto - Updated onboarding
   */
  @Post(':onboardingId/apply-template')
  @Roles(SystemRole.HR_MANAGER)
  async applyTemplateToOnboarding(
    @Param('onboardingId') onboardingId: string,
    @Body() body: { templateId: string; startDate: Date },
  ): Promise<OnboardingTrackerDto> {
    return this.onboardingService.applyTemplateToOnboarding(
      onboardingId,
      body.templateId,
      new Date(body.startDate),
    );
  }

  // ============================================================================
  // ONB-002: CONTRACT ACCESS & EMPLOYEE PROFILE CREATION ENDPOINTS
  // As an HR Manager, I want to access signed contract to create employee profile
  // ============================================================================

  /**
   * GET /onboarding/contracts/:contractId
   * 
   * Get signed contract details.
   * Used to access contract information for employee profile creation.
   * 
   * @param contractId - The contract ID
   * @returns SignedContractDetailsDto - Contract details
   */
  @Get('contracts/:contractId')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  async getSignedContractDetails(
    @Param('contractId') contractId: string,
  ): Promise<SignedContractDetailsDto> {
    return this.onboardingService.getSignedContractDetails(contractId);
  }

  /**
   * POST /onboarding/contracts/:contractId/create-employee
   * 
   * Create employee profile from signed contract.
   * Converts a candidate to an employee using contract details.
   * 
   * @param contractId - The contract ID
   * @param dto - Employee creation data
   * @returns EmployeeProfileCreatedDto - Result of creation
   */
  @Post('contracts/:contractId/create-employee')
  @Roles(SystemRole.HR_MANAGER)
  async createEmployeeFromContract(
    @Param('contractId') contractId: string,
    @Body() dto: Omit<CreateEmployeeFromContractDto, 'contractId'>,
  ): Promise<EmployeeProfileCreatedDto> {
    return this.onboardingService.createEmployeeFromContract({
      ...dto,
      contractId,
    });
  }

  // ============================================================================
  // ONB-004: NEW HIRE TRACKER ENDPOINTS
  // As a New Hire, I want to view my onboarding steps in a tracker
  // ============================================================================

  /**
   * GET /onboarding/tracker/employee/:employeeId
   * 
   * Get onboarding tracker for an employee/candidate.
   * Shows all tasks and their completion status.
   * 
   * BR 11(a, b): Onboarding workflow with department-specific tasks
   * 
   * @param employeeId - The employee/candidate ID
   * @returns OnboardingTrackerDto | null - Tracker or null if not found
   */
  @Get('tracker/employee/:employeeId')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.JOB_CANDIDATE)
  async getOnboardingTrackerByEmployee(
    @Param('employeeId') employeeId: string,
  ): Promise<OnboardingTrackerDto> {
    return this.onboardingService.getOnboardingTrackerByEmployee(employeeId);
  }

  /**
   * GET /onboarding/tracker/:onboardingId
   * 
   * Get onboarding tracker by onboarding ID.
   * 
   * @param onboardingId - The onboarding ID
   * @returns OnboardingTrackerDto - The tracker
   */
  @Get('tracker/:onboardingId')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.JOB_CANDIDATE)
  async getOnboardingTracker(
    @Param('onboardingId') onboardingId: string,
  ): Promise<OnboardingTrackerDto> {
    return this.onboardingService.getOnboardingTracker(onboardingId);
  }

  /**
   * GET /onboarding/all
   * 
   * Get all onboardings (for HR dashboard).
   * 
   * @returns OnboardingTrackerDto[] - All onboardings
   */
  @Get('all')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  async getAllOnboardings(): Promise<OnboardingTrackerDto[]> {
    return this.onboardingService.getAllOnboardings();
  }

  /**
   * PUT /onboarding/:onboardingId/tasks/:taskIndex/status
   * 
   * Update a task's status.
   * 
   * @param onboardingId - The onboarding ID
   * @param taskIndex - The task index
   * @param dto - Status update data
   * @returns OnboardingTrackerDto - Updated tracker
   */
  @Put(':onboardingId/tasks/:taskIndex/status')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.JOB_CANDIDATE)
  async updateTaskStatus(
    @Param('onboardingId') onboardingId: string,
    @Param('taskIndex') taskIndex: string,
    @Body() dto: UpdateTaskStatusDto,
  ): Promise<OnboardingTrackerDto> {
    return this.onboardingService.updateTaskStatus(
      onboardingId,
      parseInt(taskIndex, 10),
      dto,
    );
  }

  /**
   * POST /onboarding/:onboardingId/tasks/:taskIndex/complete
   * 
   * Mark a task as complete.
   * 
   * @param onboardingId - The onboarding ID
   * @param taskIndex - The task index
   * @param dto - Completion data
   * @returns OnboardingTrackerDto - Updated tracker
   */
  @Post(':onboardingId/tasks/:taskIndex/complete')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.JOB_CANDIDATE)
  async completeTask(
    @Param('onboardingId') onboardingId: string,
    @Param('taskIndex') taskIndex: string,
    @Body() dto: CompleteTaskDto,
  ): Promise<OnboardingTrackerDto> {
    return this.onboardingService.completeTask(
      onboardingId,
      parseInt(taskIndex, 10),
      dto,
    );
  }

  // ============================================================================
  // ONB-005: REMINDERS AND NOTIFICATIONS ENDPOINTS
  // As a New Hire, I want to receive reminders and notifications
  // BR 12: Send reminders and track delivery status
  // ============================================================================

  /**
   * POST /onboarding/:onboardingId/tasks/:taskIndex/remind
   * 
   * Send a reminder for a specific task.
   * 
   * @param onboardingId - The onboarding ID
   * @param taskIndex - The task index
   * @returns Result of reminder send
   */
  @Post(':onboardingId/tasks/:taskIndex/remind')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  async sendTaskReminder(
    @Param('onboardingId') onboardingId: string,
    @Param('taskIndex') taskIndex: string,
  ): Promise<{ sent: boolean; message: string }> {
    return this.onboardingService.sendTaskReminder(
      onboardingId,
      parseInt(taskIndex, 10),
    );
  }

  /**
   * GET /onboarding/overdue-tasks
   * 
   * Get all overdue tasks across all onboardings.
   * 
   * @returns Overdue task information
   */
  @Get('overdue-tasks')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  async getOverdueTasks(): Promise<{
    onboardingId: string;
    employeeId: string;
    taskIndex: number;
    taskName: string;
    department: string;
    deadline: Date;
    daysOverdue: number;
  }[]> {
    return this.onboardingService.getOverdueTasks();
  }

  /**
   * POST /onboarding/reminders/send-bulk
   * 
   * Send reminders for all overdue tasks across all onboardings.
   * Typically called by a scheduled job.
   * 
   * @returns Bulk reminder results
   */
  @Post('reminders/send-bulk')
  @Roles(SystemRole.HR_MANAGER)
  async sendBulkReminders(): Promise<{
    remindersSent: number;
    tasksReminded: { onboardingId: string; taskIndex: number; taskName: string }[];
  }> {
    return this.onboardingService.sendBulkReminders();
  }

  // ============================================================================
  // ONB-007: COMPLIANCE DOCUMENT ENDPOINTS
  // As a New Hire, I want to upload documents for compliance
  // BR 7: Documents must be collected and verified before first working day
  // ============================================================================

  /**
   * POST /onboarding/documents/upload
   * 
   * Upload a compliance document.
   * 
   * @param dto - Upload data
   * @returns DocumentRecordDto - Uploaded document record
   */
  @Post('documents/upload')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.JOB_CANDIDATE)
  async uploadComplianceDocument(
    @Body() dto: UploadDocumentDto,
  ): Promise<DocumentRecordDto> {
    return this.onboardingService.uploadComplianceDocument(dto);
  }

  /**
   * POST /onboarding/documents/:documentId/verify
   * 
   * Verify a document (HR action).
   * 
   * @param documentId - The document ID
   * @param dto - Verification data
   * @returns DocumentRecordDto - Updated document
   */
  @Post('documents/:documentId/verify')
  @Roles(SystemRole.HR_MANAGER)
  async verifyDocument(
    @Param('documentId') documentId: string,
    @Body() dto: VerifyDocumentDto,
  ): Promise<DocumentRecordDto> {
    return this.onboardingService.verifyDocument(documentId, dto);
  }

  /**
   * GET /onboarding/compliance/:onboardingId
   * 
   * Get compliance status for an onboarding.
   * Shows which required documents are uploaded and verified.
   * 
   * @param onboardingId - The onboarding ID
   * @returns ComplianceStatusDto - Compliance status
   */
  @Get('compliance/:onboardingId')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  async getComplianceStatus(
    @Param('onboardingId') onboardingId: string,
  ): Promise<ComplianceStatusDto> {
    return this.onboardingService.getComplianceStatus(onboardingId);
  }

  // ============================================================================
  // UNNAMED STORY: CANDIDATE UPLOADS SIGNED CONTRACT/FORMS
  // As a Candidate, I want to upload signed contract and forms
  // ============================================================================

  /**
   * POST /onboarding/contracts/:contractId/upload-signed
   * 
   * Upload a signed contract.
   * Updates the contract with employee signature.
   * 
   * @param contractId - The contract ID
   * @param dto - Upload data
   * @returns SignedContractUploadResultDto - Upload result
   */
  @Post('contracts/:contractId/upload-signed')
  @Roles(SystemRole.JOB_CANDIDATE, SystemRole.HR_MANAGER)
  async uploadSignedContract(
    @Param('contractId') contractId: string,
    @Body() dto: Omit<UploadSignedContractDto, 'contractId'>,
  ): Promise<SignedContractUploadResultDto> {
    return this.onboardingService.uploadSignedContract({
      ...dto,
      contractId,
    });
  }

  /**
   * POST /onboarding/:onboardingId/forms/upload
   * 
   * Upload an onboarding form.
   * Can optionally link to a specific task.
   * 
   * @param onboardingId - The onboarding ID
   * @param dto - Form upload data
   * @returns FormUploadResultDto - Upload result
   */
  @Post(':onboardingId/forms/upload')
  @Roles(SystemRole.JOB_CANDIDATE, SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  async uploadOnboardingForm(
    @Param('onboardingId') onboardingId: string,
    @Body() dto: Omit<UploadOnboardingFormDto, 'onboardingId'>,
  ): Promise<FormUploadResultDto> {
    return this.onboardingService.uploadOnboardingForm({
      ...dto,
      onboardingId,
    });
  }

  // ============================================================================
  // ONB-009: SYSTEM ACCESS PROVISIONING ENDPOINTS
  // As a System Admin, I want to provision system access (payroll, email,
  // internal systems), so that the employee can work.
  // BR 9(b): Auto onboarding tasks for IT (email, laptop, system access)
  // ============================================================================

  /**
   * POST /onboarding/:onboardingId/provision-access
   * 
   * Request system access provisioning for a new hire.
   * Creates IT provisioning tasks.
   * 
   * @param onboardingId - The onboarding ID
   * @param dto - Provisioning request data
   * @returns ProvisioningResultDto - Result of provisioning request
   */
  @Post(':onboardingId/provision-access')
  @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER)
  async provisionSystemAccess(
    @Param('onboardingId') onboardingId: string,
    @Body() dto: Omit<ProvisionAccessDto, 'onboardingId'>,
  ): Promise<ProvisioningResultDto> {
    return this.onboardingService.provisionSystemAccess({
      ...dto,
      onboardingId,
    });
  }

  /**
   * GET /onboarding/:onboardingId/provisioning-status
   * 
   * Get provisioning status for an onboarding.
   * 
   * @param onboardingId - The onboarding ID
   * @returns ProvisioningStatusDto - Current provisioning status
   */
  @Get(':onboardingId/provisioning-status')
  @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE)
  async getProvisioningStatus(
    @Param('onboardingId') onboardingId: string,
  ): Promise<ProvisioningStatusDto> {
    return this.onboardingService.getProvisioningStatus(onboardingId);
  }

  // ============================================================================
  // ONB-012: EQUIPMENT, DESK, ACCESS CARD RESERVATION ENDPOINTS
  // As a HR Employee, I want to reserve and track equipment, desk and access
  // cards for new hires, so resources are ready on Day 1.
  // BR 9(c): Auto onboarding tasks for Admin (workspace, ID badge)
  // ============================================================================

  /**
   * POST /onboarding/:onboardingId/reserve-equipment
   * 
   * Reserve equipment for a new hire.
   * 
   * @param onboardingId - The onboarding ID
   * @param dto - Equipment reservation data
   * @returns ReservationResultDto - Reservation result
   */
  @Post(':onboardingId/reserve-equipment')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.HR_ADMIN)
  async reserveEquipment(
    @Param('onboardingId') onboardingId: string,
    @Body() dto: Omit<ReserveEquipmentDto, 'onboardingId'>,
  ): Promise<ReservationResultDto> {
    return this.onboardingService.reserveEquipment({
      ...dto,
      onboardingId,
    });
  }

  /**
   * POST /onboarding/:onboardingId/reserve-desk
   * 
   * Reserve a desk/workspace for a new hire.
   * 
   * @param onboardingId - The onboarding ID
   * @param dto - Desk reservation data
   * @returns ReservationResultDto - Reservation result
   */
  @Post(':onboardingId/reserve-desk')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.HR_ADMIN)
  async reserveDesk(
    @Param('onboardingId') onboardingId: string,
    @Body() dto: Omit<ReserveDeskDto, 'onboardingId'>,
  ): Promise<ReservationResultDto> {
    return this.onboardingService.reserveDesk({
      ...dto,
      onboardingId,
    });
  }

  /**
   * POST /onboarding/:onboardingId/reserve-access-card
   * 
   * Reserve an access card for a new hire.
   * 
   * @param onboardingId - The onboarding ID
   * @param dto - Access card reservation data
   * @returns ReservationResultDto - Reservation result
   */
  @Post(':onboardingId/reserve-access-card')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.HR_ADMIN)
  async reserveAccessCard(
    @Param('onboardingId') onboardingId: string,
    @Body() dto: Omit<ReserveAccessCardDto, 'onboardingId'>,
  ): Promise<ReservationResultDto> {
    return this.onboardingService.reserveAccessCard({
      ...dto,
      onboardingId,
    });
  }

  /**
   * GET /onboarding/:onboardingId/reservations
   * 
   * Get all resource reservations for an onboarding.
   * 
   * @param onboardingId - The onboarding ID
   * @returns AllReservationsDto - All reservations
   */
  @Get(':onboardingId/reservations')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.HR_ADMIN)
  async getResourceReservations(
    @Param('onboardingId') onboardingId: string,
  ): Promise<AllReservationsDto> {
    return this.onboardingService.getResourceReservations(onboardingId);
  }

  // ============================================================================
  // ONB-013: AUTOMATED ACCOUNT PROVISIONING ENDPOINTS
  // As a HR Manager, I want automated account provisioning (SSO/email/tools)
  // on start date and scheduled revocation on exit.
  // BR 9(b): IT provisioning is automated
  // BR 20: Support onboarding cancellation/termination for "no show"
  // ============================================================================

  /**
   * POST /onboarding/:onboardingId/schedule-provisioning
   * 
   * Schedule automated account provisioning for start date.
   * 
   * @param onboardingId - The onboarding ID
   * @param dto - Scheduling data
   * @returns Scheduling result
   */
  @Post(':onboardingId/schedule-provisioning')
  @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  async scheduleProvisioning(
    @Param('onboardingId') onboardingId: string,
    @Body() dto: Omit<ScheduleProvisioningDto, 'onboardingId'>,
  ): Promise<{ scheduled: boolean; scheduledFor: Date; systems: string[]; taskId: string }> {
    return this.onboardingService.scheduleProvisioning({
      ...dto,
      onboardingId,
    });
  }

  /**
   * POST /onboarding/schedule-revocation
   * 
   * Schedule account revocation for exit date.
   * 
   * @param dto - Revocation scheduling data
   * @returns Scheduling result
   */
  @Post('schedule-revocation')
  @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
  async scheduleRevocation(
    @Body() dto: ScheduleRevocationDto,
  ): Promise<{ scheduled: boolean; scheduledFor: Date; taskId: string }> {
    return this.onboardingService.scheduleRevocation(dto);
  }

  /**
   * DELETE /onboarding/:onboardingId
   * 
   * Cancel an onboarding (no-show or other reasons).
   * Revokes all pending provisioning and reservations.
   * 
   * BR 20: Allow onboarding cancellation/termination for "no show"
   * 
   * @param onboardingId - The onboarding ID
   * @param dto - Cancellation data
   * @returns CancelOnboardingResultDto - Cancellation result
   */
  @Delete(':onboardingId')
  @Roles(SystemRole.HR_MANAGER)
  async cancelOnboarding(
    @Param('onboardingId') onboardingId: string,
    @Body() dto: Omit<CancelOnboardingDto, 'onboardingId'>,
  ): Promise<CancelOnboardingResultDto> {
    return this.onboardingService.cancelOnboarding({
      ...dto,
      onboardingId,
    });
  }

  // ============================================================================
  // ONB-018: PAYROLL INITIATION ENDPOINTS
  // As a HR Manager, I want the system to automatically handle payroll
  // initiation based on the contract signing day for the current payroll cycle.
  // BR 9(a): Auto onboarding tasks for HR (payroll & benefits creation)
  // ============================================================================

  /**
   * POST /onboarding/:onboardingId/initiate-payroll
   * 
   * Initiate payroll for a new hire based on contract.
   * 
   * @param onboardingId - The onboarding ID
   * @param dto - Payroll initiation data
   * @returns PayrollInitiationResultDto - Initiation result
   */
  @Post(':onboardingId/initiate-payroll')
  @Roles(SystemRole.HR_MANAGER, SystemRole.PAYROLL_SPECIALIST)
  async initiatePayroll(
    @Param('onboardingId') onboardingId: string,
    @Body() dto: Omit<InitiatePayrollDto, 'onboardingId'>,
  ): Promise<PayrollInitiationResultDto> {
    return this.onboardingService.initiatePayroll({
      ...dto,
      onboardingId,
    });
  }

  // ============================================================================
  // ONB-019: SIGNING BONUS PROCESSING ENDPOINTS
  // As a HR Manager, I want the system to automatically process signing
  // bonuses based on contract after a new hire is signed.
  // BR 9(a): Related to payroll processing
  // ============================================================================

  /**
   * POST /onboarding/:onboardingId/process-signing-bonus
   * 
   * Process signing bonus for a new hire.
   * 
   * @param onboardingId - The onboarding ID
   * @param dto - Signing bonus processing data
   * @returns SigningBonusResultDto - Processing result
   */
  @Post(':onboardingId/process-signing-bonus')
  @Roles(SystemRole.HR_MANAGER, SystemRole.PAYROLL_SPECIALIST)
  async processSigningBonus(
    @Param('onboardingId') onboardingId: string,
    @Body() dto: Omit<ProcessSigningBonusDto, 'onboardingId'>,
  ): Promise<SigningBonusResultDto> {
    return this.onboardingService.processSigningBonus({
      ...dto,
      onboardingId,
    });
  }
}
