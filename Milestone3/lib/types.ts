// Shared TypeScript types for the HR Management System

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
