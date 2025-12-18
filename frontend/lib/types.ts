// Shared TypeScript types for the HR Management System

// ==================== Recruitment Enums ====================

export enum ApplicationStage {
  SCREENING = 'screening',
  DEPARTMENT_INTERVIEW = 'department_interview',
  HR_INTERVIEW = 'hr_interview',
  OFFER = 'offer',
}

export enum ApplicationStatus {
  SUBMITTED = 'submitted',
  IN_PROCESS = 'in_process',
  OFFER = 'offer',
  HIRED = 'hired',
  REJECTED = 'rejected',
}

export enum InterviewMethod {
  ONSITE = 'onsite',
  VIDEO = 'video',
  PHONE = 'phone',
}

export enum InterviewStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ApprovalStatus {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PENDING = 'pending',
}

export enum OfferFinalStatus {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PENDING = 'pending',
}

export enum OfferResponseStatus {
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  PENDING = 'pending',
}

export enum DocumentType {
  CV = 'cv',
  CONTRACT = 'contract',
  ID = 'id',
  CERTIFICATE = 'certificate',
  RESIGNATION = 'resignation',
}

export enum OnboardingTaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TerminationInitiation {
  EMPLOYEE = 'employee',
  HR = 'hr',
  MANAGER = 'manager',
}

export enum TerminationStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// ==================== Recruitment Interfaces ====================

export interface JobTemplate {
  _id: string;
  title: string;
  department: string;
  qualifications: string[];
  skills: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobRequisition {
  _id: string;
  requisitionId: string;
  templateId?: string;
  template?: JobTemplate;
  openings: number;
  location?: string;
  hiringManagerId: string;
  publishStatus: 'draft' | 'published' | 'closed';
  postingDate?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  _id: string;
  candidateId: string;
  requisitionId: string;
  requisition?: JobRequisition;
  assignedHr?: string;
  currentStage: ApplicationStage;
  status: ApplicationStatus;
  isReferral?: boolean;
  resumeUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationStatusHistory {
  _id: string;
  applicationId: string;
  oldStage: string;
  newStage: string;
  oldStatus: string;
  newStatus: string;
  notes?: string;
  changedBy: string;
  createdAt: string;
}

export interface Interview {
  _id: string;
  applicationId: string;
  application?: Application;
  stage: ApplicationStage;
  scheduledDate: string;
  method: InterviewMethod;
  panel: string[];
  calendarEventId?: string;
  videoLink?: string;
  status: InterviewStatus;
  feedbackId?: string;
  candidateFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentResult {
  _id: string;
  interviewId: string;
  interviewerId: string;
  score: number;
  comments?: string;
  createdAt: string;
}

export interface OfferApprover {
  employeeId: string;
  role: string;
  status: ApprovalStatus;
  actionDate?: string;
  comment?: string;
}

export interface Offer {
  _id: string;
  applicationId: string;
  application?: Application;
  candidateId: string;
  hrEmployeeId?: string;
  grossSalary: number;
  signingBonus?: number;
  benefits?: string[];
  conditions?: string;
  insurances?: string;
  content: string;
  role: string;
  deadline: string;
  applicantResponse: OfferResponseStatus;
  approvers: OfferApprover[];
  finalStatus: OfferFinalStatus;
  candidateSignedAt?: string;
  hrSignedAt?: string;
  managerSignedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  _id: string;
  offerId: string;
  offer?: Offer;
  acceptanceDate: string;
  grossSalary: number;
  signingBonus?: number;
  role: string;
  benefits?: string[];
  documentId?: string;
  employeeSignatureUrl?: string;
  employerSignatureUrl?: string;
  employeeSignedAt?: string;
  employerSignedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  _id: string;
  referringEmployeeId: string;
  candidateId: string;
  role?: string;
  level?: string;
  createdAt: string;
}

export interface HiringStage {
  stage: ApplicationStage;
  progress: number;
  order: number;
}

export interface RecruitmentProgress {
  requisitionId: string;
  total: number;
  byStage: Record<ApplicationStage, number>;
  byStatus: Record<ApplicationStatus, number>;
}

export interface RequisitionProgress {
  requisitionId: string;
  title: string;
  publishStatus: string;
  progress: RecruitmentProgress;
}

// ==================== Pipeline UI Types ====================

// Maps backend data to UI columns
export type PipelineColumn = 'Applied' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';

export interface PipelineCandidate {
  id: string;
  applicationId: string;
  candidateId: string;
  name: string;
  email: string;
  position: string;
  stage: ApplicationStage;
  status: ApplicationStatus;
  column: PipelineColumn;
  appliedDate: string;
  isReferral?: boolean;
  resumeUrl?: string;
}

// ==================== Original Employee/HR Types ====================

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  photo?: string;
  employeeId: string;
  department: string;
  position: string;
  managerId?: string;
  managerName?: string;
  joinDate: string;
  status: 'Active' | 'Terminated' | 'On Leave';
  payGrade: string;
}

export interface Department {
  id: string;
  name: string;
  managerId: string;
  parentId?: string;
  employeeCount: number;
}

export interface Position {
  id: string;
  title: string;
  departmentId: string;
  departmentName: string;
  payGrade: string;
  status: 'Active' | 'Delimited';
  reportingTo?: string;
}

export interface PerformanceCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Draft' | 'Active' | 'Completed';
  templateId: string;
}

export interface Evaluation {
  id: string;
  cycleId: string;
  employeeId: string;
  employeeName: string;
  managerId: string;
  rating: number;
  comments: string;
  attendanceScore: number;
  status: 'Pending' | 'Completed' | 'Disputed';
  disputeReason?: string;
}

export interface Shift {
  id: string;
  name: string;
  type: 'Normal' | 'Split' | 'Overnight';
  startTime: string;
  endTime: string;
  breakDuration: number;
}

export interface AttendanceLog {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  punchIn?: string;
  punchOut?: string;
  status: 'On Time' | 'Late' | 'Missing Punch' | 'Absent';
  shiftId: string;
  corrected: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  stage: 'Applied' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';
  appliedDate: string;
  resume?: string;
}

export interface OnboardingTask {
  id: string;
  employeeId: string;
  task: string;
  category: 'Docs' | 'Assets' | 'Access';
  status: 'Pending' | 'In Progress' | 'Completed';
  dueDate: string;
}

export interface OffboardingCase {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'Resignation' | 'Termination';
  lastWorkingDay: string;
  assetsRecovered: boolean;
  accessRevoked: boolean;
  exitInterviewCompleted: boolean;
  status: 'In Progress' | 'Completed';
}

export interface LeaveBalance {
  employeeId: string;
  leaveType: string;
  accrued: number;
  taken: number;
  remaining: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'Annual' | 'Sick' | 'Personal' | 'Unpaid';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  attachments?: string[];
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewedBy?: string;
  rejectionReason?: string;
  submittedDate: string;
}

export interface PayGrade {
  id: string;
  name: string;
  minSalary: number;
  maxSalary: number;
  currency: string;
}

export interface TaxRule {
  id: string;
  name: string;
  threshold: number;
  rate: number;
  type: 'Income Tax' | 'Social Security' | 'Insurance';
}

export interface PayrollRun {
  id: string;
  month: string;
  year: number;
  status: 'Draft' | 'Validated' | 'Approved' | 'Paid';
  totalGross: number;
  totalNet: number;
  employeeCount: number;
  createdDate: string;
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  payrollRunId: string;
  month: string;
  year: number;
  grossSalary: number;
  tax: number;
  insurance: number;
  penalties: number;
  bonuses: number;
  netSalary: number;
  bankAccount?: string;
  errors?: string[];
}

// ==================== Onboarding Enums ====================

export enum OnboardingStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskCategory {
  HR = 'HR',
  IT = 'IT',
  ADMIN = 'Admin',
  LEGAL = 'Legal',
  TRAINING = 'Training',
}

export enum DocumentVerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum ProvisioningStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ReservationStatus {
  PENDING = 'pending',
  RESERVED = 'reserved',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

// ==================== Onboarding Interfaces ====================

export interface ChecklistTaskTemplate {
  name: string;
  department: string;
  category?: string;
  daysFromStart: number;
  priority?: number;
  requiresDocument?: boolean;
  description?: string;
}

export interface ChecklistTemplate {
  templateId: string;
  name: string;
  departmentId?: string;
  positionId?: string;
  isDefault: boolean;
  tasks: ChecklistTaskTemplate[];
  createdAt: string;
}

export interface OnboardingTaskItem {
  name: string;
  department: string;
  status: OnboardingTaskStatus;
  deadline: string;
  completedAt?: string;
  documentId?: string;
  notes?: string;
}

export interface OnboardingTracker {
  onboardingId: string;
  employeeId: string;
  contractId: string;
  employeeName?: string;
  employeeNumber?: string;
  tasks: OnboardingTaskItem[];
  progressPercentage: number;
  completedTasks: number;
  totalTasks: number;
  overdueTasks: number;
  completed: boolean;
  completedAt?: string;
}

export interface ComplianceDocument {
  _id: string;
  onboardingId: string;
  ownerId: string;
  documentType: string;
  documentUrl: string;
  fileName: string;
  status: DocumentVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  uploadedAt: string;
}

export interface ComplianceStatus {
  onboardingId: string;
  requiredDocuments: string[];
  uploadedDocuments: ComplianceDocument[];
  pendingDocuments: string[];
  verifiedDocuments: string[];
  isCompliant: boolean;
}

export interface ProvisioningItem {
  system: string;
  status: ProvisioningStatus;
  requestedAt: string;
  completedAt?: string;
  error?: string;
}

export interface SystemProvisioning {
  onboardingId: string;
  employeeId: string;
  items: ProvisioningItem[];
  overallStatus: ProvisioningStatus;
}

export interface Reservation {
  _id: string;
  onboardingId: string;
  type: 'equipment' | 'desk' | 'access_card';
  itemName: string;
  itemId?: string;
  status: ReservationStatus;
  requestedBy: string;
  requestedAt: string;
  notes?: string;
}

export interface AllReservations {
  onboardingId: string;
  equipment: Reservation[];
  desks: Reservation[];
  accessCards: Reservation[];
}

export interface SignedContractDetails {
  contractId: string;
  offerId: string;
  candidateId: string;
  candidateName?: string;
  candidateEmail?: string;
  role: string;
  department?: string;
  grossSalary: number;
  signingBonus?: number;
  benefits?: string[];
  startDate?: string;
  signedAt: string;
}

export interface PayrollInitiationResult {
  success: boolean;
  onboardingId: string;
  employeeId: string;
  payrollRecordId?: string;
  grossSalary: number;
  effectiveDate: string;
  message: string;
}

export interface SigningBonusResult {
  success: boolean;
  onboardingId: string;
  employeeId: string;
  bonusAmount: number;
  paymentDate: string;
  transactionId?: string;
  message: string;
}

export interface OverdueTask {
  onboardingId: string;
  employeeId: string;
  taskIndex: number;
  taskName: string;
  department: string;
  deadline: string;
  daysOverdue: number;
}
// ==================== Offboarding Interfaces ====================

export interface TerminationRequest {
  _id: string;
  employeeId: string;
  initiator: TerminationInitiation;
  reason: string;
  employeeComments?: string;
  hrComments?: string;
  status: TerminationStatus;
  terminationDate?: string;
  contractId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClearanceChecklistItem {
  department: string;
  status: ApprovalStatus;
  comments: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface EquipmentItem {
  equipmentId?: string;
  name: string;
  returned: boolean;
  condition?: string;
}

export interface ClearanceChecklist {
  _id: string;
  terminationId: string;
  items: ClearanceChecklistItem[];
  equipmentList: EquipmentItem[];
  cardReturned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeePerformanceData {
  hasPerformanceData: boolean;
  latestAppraisal: {
    id: string;
    totalScore: number | null;
    overallRating: string | null;
    managerComments: string | null;
    status: string | null;
    publishedAt: string | null;
  } | null;
  allRecords: Array<{
    id: string;
    overallRating: string | null;
    totalScore: number | null;
    publishedAt: string | null;
  }>;
}

export interface LeaveBalanceForSettlement {
  totalRemainingDays: number;
  entitlements: Array<{
    leaveTypeId: string;
    leaveTypeName: string;
    remaining: number;
    taken: number;
    pending: number;
  }>;
}

export interface EmployeeOffboardingContext {
  employeeNumber: string | null;
  dateOfHire: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  primaryDepartmentId: string | null;
  status: string;
}

export interface AccessRevocationSchedule {
  scheduled: boolean;
  taskId: string | null;
  systems: string[];
  effectiveDate: string;
}

export interface ImmediateRevocationResult {
  success: boolean;
  systemRoleDeactivated: boolean;
  revokedSystems: string[];
}

export interface TerminationSettlement {
  termination: TerminationRequest;
  clearanceComplete: boolean;
}

export interface CompleteSettlementData {
  termination: TerminationRequest;
  clearanceComplete: boolean;
  settlementData: {
    employeeId: string;
    terminationDate?: string;
    reason: string;
    initiator: TerminationInitiation;
  };
  leaveBalance: LeaveBalanceForSettlement;
  employeeContext: EmployeeOffboardingContext | null;
}

export interface FinalSettlementResult {
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
}

// ==================== Offboarding Request DTOs ====================

export interface InitiateTerminationReviewRequest {
  employeeId: string;
  contractId: string;
  reason: string;
  initiator: TerminationInitiation;
  comments?: string;
  notifyUserId?: string;
}

export interface UpdateTerminationStatusRequest {
  status: TerminationStatus;
  comments?: string;
  terminationDate?: string;
}

export interface CreateResignationRequest {
  employeeId: string;
  contractId: string;
  reason: string;
  requestedLastDay?: string;
  comments?: string;
  hrManagerId?: string;
}

export interface ReviewResignationRequest {
  status: TerminationStatus;
  hrComments?: string;
  approvedLastDay?: string;
}

export interface CreateChecklistRequest {
  terminationId: string;
  departments?: string[];
  hrManagerId?: string;
}

export interface AddEquipmentRequest {
  equipment: Array<{ name: string; equipmentId?: string }>;
}

export interface DepartmentSignOffRequest {
  department: string;
  status: ApprovalStatus;
  comments?: string;
}

export interface UpdateEquipmentReturnRequest {
  equipmentId: string;
  returned: boolean;
  condition?: string;
}

export interface UpdateAccessCardReturnRequest {
  returned: boolean;
}

export interface ScheduleRevocationRequest {
  employeeId: string;
  revocationDate: string;
  terminationId?: string;
}

export type RevocationReason = 'termination' | 'resignation' | 'no_show' | 'contract_cancelled';

export interface RevokeImmediatelyRequest {
  employeeId: string;
  reason: RevocationReason;
  terminationId?: string;
}

export interface TriggerSettlementRequest {
  triggeredBy: string;
  notes?: string;
}

// ==================== Offboarding Workflow Tracking ====================

export enum OffboardingStage {
  INITIATION = 'initiation',
  APPROVAL = 'approval',
  CLEARANCE = 'clearance',
  ACCESS_REVOCATION = 'access_revocation',
  SETTLEMENT = 'settlement',
  COMPLETED = 'completed',
}

export interface OffboardingWorkflowProgress {
  initiation: {
    completed: boolean;
    date?: string;
  };
  approval: {
    completed: boolean;
    status?: string;
    date?: string;
  };
  clearance: {
    completed: boolean;
    progress?: number;
    departmentsCleared?: number;
    totalDepartments?: number;
  };
  accessRevocation: {
    completed: boolean;
    date?: string;
    systems?: string[];
  };
  settlement: {
    completed: boolean;
    date?: string;
    leaveBalance?: number;
  };
}

export interface FullOffboardingCase {
  termination: TerminationRequest;
  checklist: ClearanceChecklist | null;
  currentStage: OffboardingStage;
  workflowProgress: OffboardingWorkflowProgress;
}