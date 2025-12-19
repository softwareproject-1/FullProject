/**
 * DTOs for Onboarding User Stories
 * 
 * ONB-001: Create onboarding task checklists
 * ONB-002: Access signed contract to create employee profile
 * ONB-004: New hire onboarding tracker view
 * ONB-005: Reminders and notifications
 * ONB-007: Upload compliance documents
 * ONB-009: System access provisioning
 * ONB-012: Equipment, desk, and access card reservation
 * ONB-013: Automated account provisioning and revocation
 * ONB-018: Payroll initiation based on contract signing
 * ONB-019: Signing bonus processing
 * Unnamed: Candidate uploads signed contract/forms
 */

import { OnboardingTaskStatus } from '../enums/onboarding-task-status.enum';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNumber,
  ValidateNested,
  ArrayMinSize,
  IsDate,
  IsMongoId
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================================
// ONB-001: CHECKLIST TEMPLATE DTOs
// ============================================================================

/**
 * Task definition for a checklist template
 */
export class ChecklistTaskTemplateDto {
  /**
   * Task name
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * Department responsible
   */
  @IsString()
  @IsNotEmpty()
  department: string;

  /**
   * Task category (for grouping)
   */
  @IsString()
  @IsOptional()
  category?: string;

  /**
   * Days from start date for deadline
   */
  @IsNumber()
  daysFromStart: number;

  /**
   * Priority (1 = highest)
   */
  @IsNumber()
  @IsOptional()
  priority?: number;

  /**
   * Whether this task requires document upload
   */
  @IsBoolean()
  @IsOptional()
  requiresDocument?: boolean;

  /**
   * Description/instructions
   */
  @IsString()
  @IsOptional()
  description?: string;
}

/**
 * DTO for creating a checklist template
 * Note: Templates are stored as Documents with special prefix
 */
export class CreateChecklistTemplateDto {
  /**
   * Template name
   */
  @IsString()
  @IsNotEmpty()
  name: string;

  /**
   * Department this template is for (optional, for department-specific)
   */
  @IsString()
  @IsOptional()
  departmentId?: string;

  /**
   * Position this template is for (optional, for position-specific)
   */
  @IsString()
  @IsOptional()
  positionId?: string;

  /**
   * Whether this is the default template
   */
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  /**
   * Tasks in this template
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistTaskTemplateDto)
  @ArrayMinSize(1)
  tasks: ChecklistTaskTemplateDto[];
}

/**
 * DTO representing a checklist template
 */
export class ChecklistTemplateDto {
  /**
   * Template ID (stored in Document)
   */
  templateId: string;

  /**
   * Template name
   */
  name: string;

  /**
   * Department ID if department-specific
   */
  departmentId?: string;

  /**
   * Position ID if position-specific
   */
  positionId?: string;

  /**
   * Whether default
   */
  isDefault: boolean;

  /**
   * Tasks in template
   */
  tasks: ChecklistTaskTemplateDto[];

  /**
   * When created
   */
  createdAt: Date;
}

// ============================================================================
// ONB-002: CONTRACT ACCESS & EMPLOYEE PROFILE CREATION DTOs
// ============================================================================

/**
 * DTO representing signed contract details
 */
export class SignedContractDetailsDto {
  /**
   * Contract ID
   */
  contractId: string;

  /**
   * Offer ID
   */
  offerId: string;

  /**
   * Candidate ID
   */
  candidateId: string;

  /**
   * Role/position
   */
  role: string;

  /**
   * Gross salary
   */
  grossSalary: number;

  /**
   * Signing bonus if any
   */
  signingBonus?: number;

  /**
   * Benefits
   */
  benefits?: string[];

  /**
   * Acceptance date
   */
  acceptanceDate?: Date;

  /**
   * Employee signature date
   */
  employeeSignedAt?: Date;

  /**
   * Employer signature date
   */
  employerSignedAt?: Date;

  /**
   * Whether fully signed
   */
  isFullySigned: boolean;

  /**
   * Contract document ID if uploaded
   */
  contractDocumentId?: string;
}

/**
 * DTO for creating employee from contract
 */
export class CreateEmployeeFromContractDto {
  /**
   * Contract ID
   */
  contractId: string;

  /**
   * Start date
   */
  startDate: Date;

  /**
   * Department ID
   */
  departmentId?: string;

  /**
   * Position ID
   */
  positionId?: string;

  /**
   * Supervisor position ID
   */
  supervisorPositionId?: string;

  /**
   * Contract type
   */
  contractType?: 'FULL_TIME_CONTRACT' | 'PART_TIME_CONTRACT';

  /**
   * Work type
   */
  workType?: 'FULL_TIME' | 'PART_TIME';
}

/**
 * DTO for created employee profile result
 */
export class EmployeeProfileCreatedDto {
  /**
   * Whether successful
   */
  success: boolean;

  /**
   * New employee profile ID
   */
  employeeProfileId?: string;

  /**
   * Employee number
   */
  employeeNumber?: string;

  /**
   * Candidate ID that was converted
   */
  candidateId: string;

  /**
   * Contract ID used
   */
  contractId: string;

  /**
   * Message
   */
  message: string;
}

// ============================================================================
// ONB-004: NEW HIRE TRACKER DTOs
// ============================================================================

/**
 * DTO for a single onboarding task
 */
export class OnboardingTaskDto {
  /**
   * Task index in the array
   */
  taskIndex: number;

  /**
   * Task name
   */
  name: string;

  /**
   * Department responsible
   */
  department: string;

  /**
   * Category (parsed from notes if available)
   */
  category?: string;

  /**
   * Current status
   */
  status: OnboardingTaskStatus;

  /**
   * Deadline
   */
  deadline?: Date;

  /**
   * Completed at
   */
  completedAt?: Date;

  /**
   * Document ID if a document is attached
   */
  documentId?: string;

  /**
   * Notes
   */
  notes?: string;

  /**
   * Is overdue
   */
  isOverdue: boolean;

  /**
   * Days until deadline (negative if overdue)
   */
  daysUntilDeadline?: number;
}

/**
 * DTO for the onboarding tracker view
 */
export class OnboardingTrackerDto {
  /**
   * Onboarding ID
   */
  onboardingId: string;

  /**
   * Employee/Candidate ID
   */
  employeeId: string;

  /**
   * Contract ID
   */
  contractId: string;

  /**
   * Employee/Candidate name
   */
  employeeName?: string;

  /**
   * Employee Number (for display)
   */
  employeeNumber?: string;

  /**
   * All tasks
   */
  tasks: OnboardingTaskDto[];

  /**
   * Overall progress percentage
   */
  progressPercentage: number;

  /**
   * Count of completed tasks
   */
  completedTasks: number;

  /**
   * Total tasks
   */
  totalTasks: number;

  /**
   * Count of overdue tasks
   */
  overdueTasks: number;

  /**
   * Whether fully completed
   */
  completed: boolean;

  /**
   * Completion date if completed
   */
  completedAt?: Date;
}

/**
 * DTO for updating task status
 */
export class UpdateTaskStatusDto {
  /**
   * New status
   */
  status: OnboardingTaskStatus;

  /**
   * Notes
   */
  notes?: string;
}

/**
 * DTO for completing a task
 */
export class CompleteTaskDto {
  /**
   * Notes on completion
   */
  @IsOptional()
  @IsString()
  notes?: string;

  /**
   * Document ID if a document was uploaded
   */
  @IsOptional()
  @IsMongoId()
  documentId?: string;
}

// ============================================================================
// ONB-005: REMINDERS AND NOTIFICATIONS DTOs
// ============================================================================

/**
 * DTO for sending a task reminder
 */
export class SendReminderDto {
  /**
   * Custom message
   */
  message?: string;
}

/**
 * DTO for overdue task information
 */
export class OverdueTaskDto {
  /**
   * Onboarding ID
   */
  onboardingId: string;

  /**
   * Employee ID
   */
  employeeId: string;

  /**
   * Task index
   */
  taskIndex: number;

  /**
   * Task name
   */
  taskName: string;

  /**
   * Department
   */
  department: string;

  /**
   * Deadline
   */
  deadline: Date;

  /**
   * Days overdue
   */
  daysOverdue: number;
}

/**
 * DTO for bulk reminder result
 */
export class BulkReminderResultDto {
  /**
   * Number of reminders sent
   */
  remindersSent: number;

  /**
   * Tasks that were reminded
   */
  tasksReminded: { onboardingId: string; taskIndex: number; taskName: string }[];
}

// ============================================================================
// ONB-007: COMPLIANCE DOCUMENTS DTOs
// ============================================================================

/**
 * DTO for uploading a compliance document
 */
export class UploadDocumentDto {
  /**
   * Onboarding ID
   */
  @IsString()
  @IsNotEmpty()
  onboardingId: string;

  /**
   * Document type
   */
  @IsString()
  @IsNotEmpty()
  documentType: 'ID' | 'CONTRACT' | 'CERTIFICATION' | 'TAX_FORM' | 'OTHER';

  /**
   * File path
   */
  @IsString()
  @IsNotEmpty()
  filePath: string;

  /**
   * Document name
   */
  @IsString()
  @IsNotEmpty()
  documentName: string;

  /**
   * Expiry date if applicable
   */
  @IsOptional()
  @Type(() => Date)
  expiryDate?: Date;

  /**
   * Task index if this is for a specific task
   */
  @IsOptional()
  @IsNumber()
  taskIndex?: number;
}

/**
 * DTO for a document record
 */
export class DocumentRecordDto {
  /**
   * Document ID
   */
  documentId: string;

  /**
   * Document type
   */
  documentType: string;

  /**
   * Document name
   */
  documentName: string;

  /**
   * File path
   */
  filePath: string;

  /**
   * Upload date
   */
  uploadedAt: Date;

  /**
   * Verification status
   */
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';

  /**
   * Verified by
   */
  verifiedBy?: string;

  /**
   * Verified at
   */
  verifiedAt?: Date;

  /**
   * Rejection reason
   */
  rejectionReason?: string;

  /**
   * Expiry date
   */
  expiryDate?: Date;
}

/**
 * DTO for verifying a document
 */
export class VerifyDocumentDto {
  /**
   * Verification decision
   */
  @IsString()
  @IsNotEmpty()
  decision: 'VERIFIED' | 'REJECTED';

  /**
   * Verifier ID
   */
  @IsString()
  @IsNotEmpty()
  verifiedBy: string;

  /**
   * Rejection reason if rejected
   */
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

/**
 * DTO for compliance status
 */
export class ComplianceStatusDto {
  /**
   * Onboarding ID
   */
  onboardingId: string;

  /**
   * All documents
   */
  documents: DocumentRecordDto[];

  /**
   * Required document types
   */
  requiredDocuments: string[];

  /**
   * Missing documents
   */
  missingDocuments: string[];

  /**
   * Pending verification count
   */
  pendingVerification: number;

  /**
   * Verified count
   */
  verified: number;

  /**
   * Rejected count
   */
  rejected: number;

  /**
   * Is compliant
   */
  isCompliant: boolean;
}

// ============================================================================
// UNNAMED STORY: CANDIDATE UPLOADS DTOs
// ============================================================================

/**
 * DTO for uploading signed contract (Unnamed Story)
 */
export class UploadSignedContractDto {
  /**
   * Contract ID
   */
  @IsString()
  @IsNotEmpty()
  contractId: string;

  /**
   * File path to the signed contract (optional, use signatureUrl if not provided)
   */
  @IsOptional()
  @IsString()
  filePath?: string;

  /**
   * Signature URL (from frontend - can be used as filePath)
   */
  @IsOptional()
  @IsString()
  signatureUrl?: string;

  /**
   * Employee signature URL/path
   */
  @IsOptional()
  @IsString()
  employeeSignatureUrl?: string;

  /**
   * When the contract was signed
   */
  @IsOptional()
  @IsString()
  signedAt?: string;
}

/**
 * DTO for uploading onboarding form (Unnamed Story)
 */
export class UploadOnboardingFormDto {
  /**
   * Onboarding ID
   */
  @IsString()
  @IsNotEmpty()
  onboardingId: string;

  /**
   * Form type/name
   */
  @IsString()
  @IsNotEmpty()
  formType: string;

  /**
   * File path (optional - use formUrl if not provided)
   */
  @IsOptional()
  @IsString()
  filePath?: string;

  /**
   * Form URL (from frontend - can be used as filePath)
   */
  @IsOptional()
  @IsString()
  formUrl?: string;

  /**
   * File name (from frontend)
   */
  @IsOptional()
  @IsString()
  fileName?: string;

  /**
   * Task index this form is for (if applicable)
   */
  @IsOptional()
  @IsNumber()
  taskIndex?: number;
}

/**
 * Result DTO for signed contract upload
 */
export class SignedContractUploadResultDto {
  /**
   * Whether successful
   */
  success: boolean;

  /**
   * Contract ID
   */
  contractId: string;

  /**
   * Document ID created
   */
  documentId?: string;

  /**
   * Message
   */
  message: string;

  /**
   * Whether contract is now fully signed
   */
  isFullySigned: boolean;
}

/**
 * Result DTO for form upload
 */
export class FormUploadResultDto {
  /**
   * Whether successful
   */
  success: boolean;

  /**
   * Document ID created
   */
  documentId: string;

  /**
   * Onboarding ID
   */
  onboardingId: string;

  /**
   * Task updated if applicable
   */
  taskUpdated: boolean;

  /**
   * Message
   */
  message: string;
}

// ============================================================================
// ONB-009: SYSTEM ACCESS PROVISIONING DTOs
// As a System Admin, I want to provision system access (payroll, email, 
// internal systems), so that the employee can work.
// BR 9(b): Auto onboarding tasks for IT (email, laptop, system access)
// ============================================================================

/**
 * DTO for requesting system access provisioning
 */
export class ProvisionAccessDto {
  /**
   * Onboarding ID
   */
  @IsString()
  @IsNotEmpty()
  onboardingId: string;

  /**
   * Systems to provision
   */
  @IsArray()
  @ArrayMinSize(1)
  systems: ('email' | 'payroll' | 'internal_systems' | 'vpn' | 'erp')[];

  /**
   * Scheduled start date (when access should be active)
   */
  @Type(() => Date)
  startDate: Date;

  /**
   * Requested by (admin ID)
   */
  @IsString()
  @IsNotEmpty()
  requestedBy: string;

  /**
   * Priority
   */
  @IsOptional()
  @IsString()
  priority?: 'normal' | 'high' | 'urgent';
}

/**
 * DTO for single system provisioning status
 */
export class SystemProvisioningStatusDto {
  /**
   * System name
   */
  system: string;

  /**
   * Status
   */
  status: 'not_started' | 'pending' | 'scheduled' | 'provisioned' | 'failed' | 'revoked';

  /**
   * Provisioned at
   */
  provisionedAt?: Date;

  /**
   * Scheduled for (when provisioning is scheduled to occur)
   */
  scheduledFor?: Date;

  /**
   * Error message if failed
   */
  errorMessage?: string;

  /**
   * Additional details
   */
  details?: Record<string, any>;
}


/**
 * DTO for overall provisioning status
 */
export class ProvisioningStatusDto {
  /**
   * Onboarding ID
   */
  onboardingId: string;

  /**
   * Employee ID
   */
  employeeId: string;

  /**
   * Overall status
   */
  overallStatus: 'not_started' | 'scheduled' | 'in_progress' | 'completed' | 'failed';


  /**
   * Individual system statuses
   */
  systems: SystemProvisioningStatusDto[];

  /**
   * Requested at
   */
  requestedAt?: Date;

  /**
   * Completed at
   */
  completedAt?: Date;
}

/**
 * Result DTO for provisioning request
 */
export class ProvisioningResultDto {
  /**
   * Success
   */
  success: boolean;

  /**
   * Onboarding ID
   */
  onboardingId: string;

  /**
   * Task IDs created
   */
  taskIds: string[];

  /**
   * Systems being provisioned
   */
  systems: string[];

  /**
   * Message
   */
  message: string;
}

// ============================================================================
// ONB-012: EQUIPMENT, DESK, AND ACCESS CARD RESERVATION DTOs
// As a HR Employee, I want to reserve and track equipment, desk and access
// cards for new hires, so resources are ready on Day 1.
// BR 9(c): Auto onboarding tasks for Admin (workspace, ID badge)
// ============================================================================

/**
 * DTO for reserving equipment
 */
export class ReserveEquipmentDto {
  /**
   * Onboarding ID
   */
  @IsString()
  @IsNotEmpty()
  onboardingId: string;

  /**
   * Equipment type
   */
  @IsString()
  @IsNotEmpty()
  equipmentType: 'laptop' | 'desktop' | 'phone' | 'headset' | 'monitor' | 'other';

  /**
   * Equipment specification/model
   */
  @IsOptional()
  @IsString()
  specification?: string;

  /**
   * Quantity
   */
  @IsNumber()
  quantity: number;

  /**
   * Needed by date
   */
  @Type(() => Date)
  neededByDate: Date;

  /**
   * Notes
   */
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for reserving a desk/workspace
 */
export class ReserveDeskDto {
  /**
   * Onboarding ID
   */
  @IsString()
  @IsNotEmpty()
  onboardingId: string;

  /**
   * Building/location
   */
  @IsOptional()
  @IsString()
  building?: string;

  /**
   * Floor
   */
  @IsOptional()
  @IsString()
  floor?: string;

  /**
   * Preferred area/zone
   */
  @IsOptional()
  @IsString()
  preferredArea?: string;

  /**
   * Special requirements
   */
  @IsOptional()
  @IsString()
  specialRequirements?: string;

  /**
   * Start date
   */
  @Type(() => Date)
  startDate: Date;
}

/**
 * DTO for reserving an access card
 */
export class ReserveAccessCardDto {
  /**
   * Onboarding ID
   */
  @IsString()
  @IsNotEmpty()
  onboardingId: string;

  /**
   * Card type
   */
  @IsString()
  @IsNotEmpty()
  cardType: 'standard' | 'restricted' | 'executive';

  /**
   * Access zones
   */
  @IsArray()
  @ArrayMinSize(1)
  accessZones: string[];

  /**
   * Photo provided
   */
  @IsBoolean()
  photoProvided: boolean;

  /**
   * Needed by date
   */
  @Type(() => Date)
  neededByDate: Date;
}

/**
 * DTO for a resource reservation record
 */
export class ResourceReservationDto {
  /**
   * Reservation ID
   */
  reservationId: string;

  /**
   * Resource type
   */
  resourceType: 'equipment' | 'desk' | 'access_card';

  /**
   * Resource details
   */
  details: Record<string, any>;

  /**
   * Status
   */
  status: 'pending' | 'reserved' | 'ready' | 'assigned' | 'cancelled';

  /**
   * Reserved at
   */
  reservedAt: Date;

  /**
   * Ready at
   */
  readyAt?: Date;

  /**
   * Assigned at
   */
  assignedAt?: Date;

  /**
   * Notes
   */
  notes?: string;
}

/**
 * Result DTO for resource reservation
 */
export class ReservationResultDto {
  /**
   * Success
   */
  success: boolean;

  /**
   * Reservation ID
   */
  reservationId: string;

  /**
   * Resource type
   */
  resourceType: string;

  /**
   * Message
   */
  message: string;

  /**
   * Estimated ready date
   */
  estimatedReadyDate?: Date;
}

/**
 * DTO for all reservations for an onboarding
 */
export class AllReservationsDto {
  /**
   * Onboarding ID
   */
  onboardingId: string;

  /**
   * Equipment reservations
   */
  equipment: ResourceReservationDto[];

  /**
   * Desk reservation
   */
  desk?: ResourceReservationDto;

  /**
   * Access card reservation
   */
  accessCard?: ResourceReservationDto;

  /**
   * Overall readiness
   */
  allReady: boolean;
}

// ============================================================================
// ONB-013: AUTOMATED ACCOUNT PROVISIONING DTOs
// As a HR Manager, I want automated account provisioning (SSO/email/tools)
// on start date and scheduled revocation on exit.
// BR 9(b): IT provisioning is automated
// BR 20: Support onboarding cancellation/termination for "no show"
// ============================================================================

/**
 * DTO for scheduling account provisioning
 */
export class ScheduleProvisioningDto {
  /**
   * Onboarding ID
   */
  @IsString()
  @IsNotEmpty()
  onboardingId: string;

  /**
   * Start date (when accounts should be active)
   */
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  /**
   * Systems to provision
   */
  @IsArray()
  @ArrayMinSize(1)
  systems: string[];

  /**
   * Auto-provision on start date
   */
  @IsBoolean()
  autoProvisionOnStartDate: boolean;
}

/**
 * DTO for scheduling account revocation
 */
export class ScheduleRevocationDto {
  /**
   * Employee ID
   */
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  /**
   * Exit date
   */
  @Type(() => Date)
  @IsDate()
  exitDate: Date;

  /**
   * Reason
   */
  @IsString()
  @IsNotEmpty()
  reason: 'termination' | 'resignation' | 'no_show' | 'contract_cancelled';

  /**
   * Revoke immediately
   */
  @IsBoolean()
  revokeImmediately: boolean;
}

/**
 * DTO for cancelling onboarding (no-show scenario)
 */
export class CancelOnboardingDto {
  /**
   * Onboarding ID
   */
  @IsString()
  @IsNotEmpty()
  onboardingId: string;

  /**
   * Reason for cancellation
   */
  @IsString()
  @IsNotEmpty()
  reason: 'no_show' | 'candidate_withdrawal' | 'offer_rescinded' | 'other';

  /**
   * Additional notes
   */
  @IsOptional()
  @IsString()
  notes?: string;

  /**
   * Cancelled by (HR employee ID)
   */
  @IsString()
  @IsNotEmpty()
  cancelledBy: string;
}

/**
 * Result DTO for onboarding cancellation
 */
export class CancelOnboardingResultDto {
  /**
   * Success
   */
  success: boolean;

  /**
   * Onboarding ID
   */
  onboardingId: string;

  /**
   * Provisioning tasks cancelled
   */
  provisioningTasksCancelled: number;

  /**
   * Reservations cancelled
   */
  reservationsCancelled: number;

  /**
   * Message
   */
  message: string;
}

// ============================================================================
// ONB-018: PAYROLL INITIATION DTOs
// As a HR Manager, I want the system to automatically handle payroll
// initiation based on the contract signing day for the current payroll cycle.
// BR 9(a): Auto onboarding tasks for HR (payroll & benefits creation)
// ============================================================================

/**
 * DTO for initiating payroll
 */
export class InitiatePayrollDto {
  /**
   * Onboarding ID
   */
  @IsString()
  @IsNotEmpty()
  onboardingId: string;

  /**
   * Contract ID
   */
  @IsString()
  @IsNotEmpty()
  contractId: string;

  /**
   * Employee ID (optional - can be derived from onboarding)
   */
  @IsOptional()
  @IsString()
  employeeId?: string;

  /**
   * Effective date (optional - defaults to contract signing date or start date)
   */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  effectiveDate?: Date;

  /**
   * Payroll cycle to start in
   */
  @IsOptional()
  @IsString()
  payrollCycle?: 'current' | 'next';

  /**
   * Pro-rate first salary (defaults to true)
   */
  @IsOptional()
  @IsBoolean()
  proRateFirstSalary?: boolean;
}

/**
 * Result DTO for payroll initiation
 */
export class PayrollInitiationResultDto {
  /**
   * Success
   */
  success: boolean;

  /**
   * Onboarding ID
   */
  onboardingId: string;

  /**
   * Payroll record ID created
   */
  payrollRecordId?: string;

  /**
   * Effective date
   */
  effectiveDate: Date;

  /**
   * First payroll cycle
   */
  firstPayrollCycle?: string;

  /**
   * Gross salary
   */
  grossSalary: number;

  /**
   * Pro-rated amount if applicable
   */
  proRatedAmount?: number;

  /**
   * Message
   */
  message: string;
}

// ============================================================================
// ONB-019: SIGNING BONUS PROCESSING DTOs
// As a HR Manager, I want the system to automatically process signing
// bonuses based on contract after a new hire is signed.
// BR 9(a): Related to payroll processing
// ============================================================================

/**
 * DTO for processing signing bonus
 */
export class ProcessSigningBonusDto {
  /**
   * Onboarding ID
   */
  @IsString()
  @IsNotEmpty()
  onboardingId: string;

  /**
   * Contract ID
   */
  @IsString()
  @IsNotEmpty()
  contractId: string;

  /**
   * Optional: Reference to signingBonus configuration in payroll-configuration
   * If not provided, a placeholder ObjectId will be used
   */
  @IsOptional()
  @IsString()
  signingBonusConfigId?: string;

  /**
   * Override amount (if different from contract)
   */
  @IsOptional()
  @IsNumber()
  overrideAmount?: number;

  /**
   * Payment schedule
   */
  @IsString()
  @IsNotEmpty()
  paymentSchedule: 'immediate' | 'first_payroll' | 'after_probation';

  /**
   * Notes
   */
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Result DTO for signing bonus processing
 */
export class SigningBonusResultDto {
  /**
   * Success
   */
  success: boolean;

  /**
   * Onboarding ID
   */
  onboardingId: string;

  /**
   * Signing bonus record ID
   */
  signingBonusRecordId?: string;

  /**
   * Amount
   */
  amount: number;

  /**
   * Status
   */
  status: 'pending' | 'approved' | 'paid' | 'rejected';

  /**
   * Scheduled payment date
   */
  scheduledPaymentDate?: Date;

  /**
   * Message
   */
  message: string;
}
