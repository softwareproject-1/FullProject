// Shared TypeScript types for the HR Management System
export type ConfigStatus = "draft" | "approved" | "rejected";

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
  status: "Active" | "Terminated" | "On Leave";
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
  status: "Active" | "Delimited";
  reportingTo?: string;
}

export interface PerformanceCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "Draft" | "Active" | "Completed";
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
  status: "Pending" | "Completed" | "Disputed";
  disputeReason?: string;
}

export interface Shift {
  id: string;
  name: string;
  type: "Normal" | "Split" | "Overnight";
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
  status: "On Time" | "Late" | "Missing Punch" | "Absent";
  shiftId: string;
  corrected: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  stage: "Applied" | "Interview" | "Offer" | "Hired" | "Rejected";
  appliedDate: string;
  resume?: string;
}

export interface OnboardingTask {
  id: string;
  employeeId: string;
  task: string;
  category: "Docs" | "Assets" | "Access";
  status: "Pending" | "In Progress" | "Completed";
  dueDate: string;
}

export interface OffboardingCase {
  id: string;
  employeeId: string;
  employeeName: string;
  type: "Resignation" | "Termination";
  lastWorkingDay: string;
  assetsRecovered: boolean;
  accessRevoked: boolean;
  exitInterviewCompleted: boolean;
  status: "In Progress" | "Completed";
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
  leaveType: "Annual" | "Sick" | "Personal" | "Unpaid";
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  attachments?: string[];
  status: "Pending" | "Approved" | "Rejected";
  reviewedBy?: string;
  rejectionReason?: string;
  submittedDate: string;
}

// export interface PayGrade {
//   id: string;
//   name: string;
//   minSalary: number;
//   maxSalary: number;
//   currency: string;
// }

export interface PayGrade {
  _id: string;
  grade: string;
  baseSalary: number;
  grossSalary: number;
  //allowances?: Allowance[];
  status: ConfigStatus;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// export interface TaxRule {
//   id: string;
//   name: string;
//   threshold: number;
//   rate: number;
//   type: "Income Tax" | "Social Security" | "Insurance";
// }

export interface TaxRule {
  _id: string;
  name: string;
  description?: string;
  taxType: "Single Rate" | "Progressive Brackets" | "Flat Rate with Exemption";
  rate: number;
  exemptionAmount?: number;
  thresholdAmount?: number;
  brackets?: { minIncome: number; maxIncome: number; rate: number }[];
  status: "draft" | "approved" | "rejected";
  createdBy?: string;
  createdByName?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PayrollRun {
  id: string;
  month: string;
  year: number;
  status: "Draft" | "Validated" | "Approved" | "Paid";
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

export interface PayrollPolicy {
  _id: string;
  policyName: string;
  policyType: "Misconduct" | "Deduction" | "Allowance" | "Benefit" | "Leave";
  description: string;
  effectiveDate: string;
  ruleDefinition: {
    percentage: number;
    fixedAmount: number;
    thresholdAmount: number;
  };
  applicability:
    | "All Employees"
    | "Full Time Employees"
    | "Part Time Employees"
    | "Contractors";
  status: "draft" | "approved" | "rejected";
  createdBy?: string;
  createdByName?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePayrollPolicyDto {
  policyName: string;
  policyType: "Misconduct" | "Deduction" | "Allowance" | "Benefit" | "Leave";
  description: string;
  effectiveDate: string;
  ruleDefinition: {
    percentage: number;
    fixedAmount: number;
    thresholdAmount: number;
  };
  applicability:
    | "All Employees"
    | "Full Time Employees"
    | "Part Time Employees"
    | "Contractors";
}

export interface PayType {
  _id: string;
  type: string;
  amount: number;
  status: "draft" | "approved" | "rejected";
  createdBy?: string;
  createdByName?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePayTypeDto {
  type: string;
  amount: number;
}

export interface CreateTaxRuleDto {
  name: string;
  description?: string;
  taxType: "Single Rate" | "Progressive Brackets" | "Flat Rate with Exemption";
  rate: number;
  exemptionAmount?: number;
  thresholdAmount?: number;
  brackets?: { minIncome: number; maxIncome: number; rate: number }[];
}

export interface TerminationBenefit {
  _id: string;
  name: string;
  amount: number;
  terms?: string;
  status: "draft" | "approved" | "rejected";
  createdBy?: string;
  createdByName?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTerminationBenefitDto {
  name: string;
  amount: number;
  terms?: string;
}

export interface Allowance {
  _id: string;
  name: string;
  amount: number;
  status: "draft" | "approved" | "rejected";
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InsuranceBracket {
  _id: string;
  name: string;
  minSalary: number;
  maxSalary: number;
  employeeRate: number;
  employerRate: number;
  status: ConfigStatus;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
}

//export type ConfigStatus = "draft" | "approved" | "rejected";

export interface SigningBonus {
  _id?: string; // optional because MongoDB adds it
  positionName: string;
  amount: number;
  status: ConfigStatus;
  createdBy?: string; // optional MongoDB ObjectId as string
  approvedBy?: string; // optional MongoDB ObjectId as string
  approvedAt?: string; // optional ISO date string
}
// lib/types.ts

// src/lib/types.ts

export interface CompanyWideSettings {
  _id: string;
  payDate: string; // ISO string from backend
  timeZone: string;
  currency: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCompanyWideSettingsDto {
  payDate: string; // send as ISO string
  timeZone: string;
  currency: string;
}

export interface UpdateCompanyWideSettingsDto {
  payDate?: string;
  timeZone?: string;
  currency?: string;
}
