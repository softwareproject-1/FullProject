// Mock API Layer - Teams can replace these with real backend calls

import type {
  Employee,
  Department,
  Position,
  PerformanceCycle,
  Evaluation,
  Shift,
  AttendanceLog,
  Candidate,
  OnboardingTask,
  OffboardingCase,
  LeaveBalance,
  LeaveRequest,
  PayGrade,
  TaxRule,
  PayrollRun,
  Payslip,
} from './types';

// ==================== EMPLOYEE PROFILE ====================

export const mockEmployees: Employee[] = [
  {
    id: 'emp001',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    phone: '+1-555-0101',
    address: '123 Main St, New York, NY 10001',
    photo: 'https://i.pravatar.cc/150?img=1',
    employeeId: 'EMP001',
    department: 'Engineering',
    position: 'Senior Software Engineer',
    managerId: 'emp005',
    managerName: 'Michael Chen',
    joinDate: '2021-03-15',
    status: 'Active',
    payGrade: 'G5',
  },
  {
    id: 'emp002',
    name: 'James Martinez',
    email: 'james.martinez@company.com',
    phone: '+1-555-0102',
    address: '456 Oak Ave, Los Angeles, CA 90001',
    photo: 'https://i.pravatar.cc/150?img=12',
    employeeId: 'EMP002',
    department: 'Marketing',
    position: 'Marketing Manager',
    managerId: 'emp006',
    managerName: 'Emily Rodriguez',
    joinDate: '2020-07-01',
    status: 'Active',
    payGrade: 'G4',
  },
  {
    id: 'emp003',
    name: 'Emma Davis',
    email: 'emma.davis@company.com',
    phone: '+1-555-0103',
    address: '789 Pine Rd, Chicago, IL 60601',
    photo: 'https://i.pravatar.cc/150?img=5',
    employeeId: 'EMP003',
    department: 'HR',
    position: 'HR Specialist',
    managerId: 'emp007',
    managerName: 'David Kim',
    joinDate: '2022-01-10',
    status: 'Active',
    payGrade: 'G3',
  },
  {
    id: 'emp004',
    name: 'Robert Wilson',
    email: 'robert.wilson@company.com',
    phone: '+1-555-0104',
    address: '321 Elm St, Houston, TX 77001',
    photo: 'https://i.pravatar.cc/150?img=13',
    employeeId: 'EMP004',
    department: 'Finance',
    position: 'Financial Analyst',
    managerId: 'emp008',
    managerName: 'Lisa Thompson',
    joinDate: '2019-11-20',
    status: 'Active',
    payGrade: 'G3',
  },
  {
    id: 'emp005',
    name: 'Michael Chen',
    email: 'michael.chen@company.com',
    phone: '+1-555-0105',
    address: '654 Maple Dr, Seattle, WA 98101',
    photo: 'https://i.pravatar.cc/150?img=14',
    employeeId: 'EMP005',
    department: 'Engineering',
    position: 'Engineering Director',
    joinDate: '2018-05-15',
    status: 'Active',
    payGrade: 'G6',
  },
];

export async function getEmployeeById(id: string): Promise<Employee | undefined> {
  return mockEmployees.find((emp) => emp.id === id);
}

export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
  const employee = mockEmployees.find((emp) => emp.id === id);
  if (!employee) throw new Error('Employee not found');
  return { ...employee, ...updates };
}

export async function getTeamMembers(managerId: string): Promise<Employee[]> {
  return mockEmployees.filter((emp) => emp.managerId === managerId);
}

// ==================== ORGANIZATION STRUCTURE ====================

export const mockDepartments: Department[] = [
  { id: 'dept001', name: 'Engineering', managerId: 'emp005', employeeCount: 45 },
  { id: 'dept002', name: 'Marketing', managerId: 'emp006', employeeCount: 12 },
  { id: 'dept003', name: 'HR', managerId: 'emp007', employeeCount: 8 },
  { id: 'dept004', name: 'Finance', managerId: 'emp008', employeeCount: 15 },
  { id: 'dept005', name: 'Sales', managerId: 'emp009', employeeCount: 22 },
];

export const mockPositions: Position[] = [
  {
    id: 'pos001',
    title: 'Senior Software Engineer',
    departmentId: 'dept001',
    departmentName: 'Engineering',
    payGrade: 'G5',
    status: 'Active',
    reportingTo: 'Engineering Director',
  },
  {
    id: 'pos002',
    title: 'Marketing Manager',
    departmentId: 'dept002',
    departmentName: 'Marketing',
    payGrade: 'G4',
    status: 'Active',
    reportingTo: 'VP Marketing',
  },
  {
    id: 'pos003',
    title: 'HR Specialist',
    departmentId: 'dept003',
    departmentName: 'HR',
    payGrade: 'G3',
    status: 'Active',
    reportingTo: 'HR Director',
  },
  {
    id: 'pos004',
    title: 'Financial Analyst',
    departmentId: 'dept004',
    departmentName: 'Finance',
    payGrade: 'G3',
    status: 'Active',
    reportingTo: 'Finance Manager',
  },
  {
    id: 'pos005',
    title: 'Junior Developer',
    departmentId: 'dept001',
    departmentName: 'Engineering',
    payGrade: 'G2',
    status: 'Delimited',
    reportingTo: 'Senior Software Engineer',
  },
];

export async function getDepartments(): Promise<Department[]> {
  return mockDepartments;
}

export async function getPositions(): Promise<Position[]> {
  return mockPositions;
}

export async function updatePositionStatus(id: string, status: 'Active' | 'Delimited'): Promise<Position> {
  const position = mockPositions.find((pos) => pos.id === id);
  if (!position) throw new Error('Position not found');
  return { ...position, status };
}

// ==================== PERFORMANCE MANAGEMENT ====================

export const mockPerformanceCycles: PerformanceCycle[] = [
  {
    id: 'cycle001',
    name: 'Q1 2025 Performance Review',
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    status: 'Active',
    templateId: 'template001',
  },
  {
    id: 'cycle002',
    name: 'Q4 2024 Performance Review',
    startDate: '2024-10-01',
    endDate: '2024-12-31',
    status: 'Completed',
    templateId: 'template001',
  },
];

export const mockEvaluations: Evaluation[] = [
  {
    id: 'eval001',
    cycleId: 'cycle001',
    employeeId: 'emp001',
    employeeName: 'Sarah Johnson',
    managerId: 'emp005',
    rating: 4.5,
    comments: 'Excellent performance, consistently delivers high-quality work.',
    attendanceScore: 95,
    status: 'Completed',
  },
  {
    id: 'eval002',
    cycleId: 'cycle001',
    employeeId: 'emp002',
    employeeName: 'James Martinez',
    managerId: 'emp006',
    rating: 4.0,
    comments: 'Good work on recent campaigns.',
    attendanceScore: 92,
    status: 'Pending',
  },
];

export async function getPerformanceCycles(): Promise<PerformanceCycle[]> {
  return mockPerformanceCycles;
}

export async function createPerformanceCycle(cycle: Omit<PerformanceCycle, 'id'>): Promise<PerformanceCycle> {
  return { ...cycle, id: `cycle${Date.now()}` };
}

export async function getEvaluations(cycleId: string): Promise<Evaluation[]> {
  return mockEvaluations.filter((evaluation) => evaluation.cycleId === cycleId);
}

export async function submitEvaluation(evaluation: Omit<Evaluation, 'id'>): Promise<Evaluation> {
  return { ...evaluation, id: `eval${Date.now()}` };
}

// ==================== TIME MANAGEMENT ====================

export const mockShifts: Shift[] = [
  { id: 'shift001', name: 'Day Shift', type: 'Normal', startTime: '09:00', endTime: '17:00', breakDuration: 60 },
  { id: 'shift002', name: 'Night Shift', type: 'Overnight', startTime: '22:00', endTime: '06:00', breakDuration: 60 },
  { id: 'shift003', name: 'Split Shift', type: 'Split', startTime: '09:00', endTime: '21:00', breakDuration: 180 },
];

export const mockAttendanceLogs: AttendanceLog[] = [
  {
    id: 'att001',
    employeeId: 'emp001',
    employeeName: 'Sarah Johnson',
    date: '2025-12-09',
    punchIn: '09:05',
    punchOut: '17:10',
    status: 'Late',
    shiftId: 'shift001',
    corrected: false,
  },
  {
    id: 'att002',
    employeeId: 'emp002',
    employeeName: 'James Martinez',
    date: '2025-12-09',
    punchIn: '08:55',
    punchOut: '17:00',
    status: 'On Time',
    shiftId: 'shift001',
    corrected: false,
  },
  {
    id: 'att003',
    employeeId: 'emp003',
    employeeName: 'Emma Davis',
    date: '2025-12-09',
    punchIn: '09:10',
    status: 'Missing Punch',
    shiftId: 'shift001',
    corrected: false,
  },
  {
    id: 'att004',
    employeeId: 'emp004',
    employeeName: 'Robert Wilson',
    date: '2025-12-09',
    status: 'Absent',
    shiftId: 'shift001',
    corrected: false,
  },
];

export async function getShifts(): Promise<Shift[]> {
  return mockShifts;
}

export async function getAttendanceLogs(date?: string): Promise<AttendanceLog[]> {
  if (date) {
    return mockAttendanceLogs.filter((log) => log.date === date);
  }
  return mockAttendanceLogs;
}

export async function correctAttendance(id: string, updates: Partial<AttendanceLog>): Promise<AttendanceLog> {
  const log = mockAttendanceLogs.find((l) => l.id === id);
  if (!log) throw new Error('Attendance log not found');
  return { ...log, ...updates, corrected: true };
}

// ==================== RECRUITMENT ====================

export const mockCandidates: Candidate[] = [
  {
    id: 'cand001',
    name: 'Alex Thompson',
    email: 'alex.t@email.com',
    phone: '+1-555-0201',
    position: 'Software Engineer',
    stage: 'Interview',
    appliedDate: '2025-11-15',
  },
  {
    id: 'cand002',
    name: 'Maria Garcia',
    email: 'maria.g@email.com',
    phone: '+1-555-0202',
    position: 'Product Manager',
    stage: 'Offer',
    appliedDate: '2025-11-20',
  },
  {
    id: 'cand003',
    name: 'John Lee',
    email: 'john.l@email.com',
    phone: '+1-555-0203',
    position: 'UX Designer',
    stage: 'Applied',
    appliedDate: '2025-12-01',
  },
];

export const mockOnboardingTasks: OnboardingTask[] = [
  {
    id: 'onb001',
    employeeId: 'emp001',
    task: 'Submit ID Documents',
    category: 'Docs',
    status: 'Completed',
    dueDate: '2021-03-20',
  },
  {
    id: 'onb002',
    employeeId: 'emp001',
    task: 'Collect Laptop',
    category: 'Assets',
    status: 'Completed',
    dueDate: '2021-03-22',
  },
  {
    id: 'onb003',
    employeeId: 'emp001',
    task: 'Setup Email Account',
    category: 'Access',
    status: 'Completed',
    dueDate: '2021-03-15',
  },
];

export const mockOffboardingCases: OffboardingCase[] = [
  {
    id: 'off001',
    employeeId: 'emp010',
    employeeName: 'Former Employee',
    type: 'Resignation',
    lastWorkingDay: '2025-12-31',
    assetsRecovered: false,
    accessRevoked: false,
    exitInterviewCompleted: false,
    status: 'In Progress',
  },
];

export async function getCandidates(): Promise<Candidate[]> {
  return mockCandidates;
}

export async function updateCandidateStage(
  id: string,
  stage: Candidate['stage']
): Promise<Candidate> {
  const candidate = mockCandidates.find((c) => c.id === id);
  if (!candidate) throw new Error('Candidate not found');
  return { ...candidate, stage };
}

export async function getOnboardingTasks(employeeId: string): Promise<OnboardingTask[]> {
  return mockOnboardingTasks.filter((task) => task.employeeId === employeeId);
}

export async function getOffboardingCases(): Promise<OffboardingCase[]> {
  return mockOffboardingCases;
}

// ==================== LEAVES ====================

export const mockLeaveBalances: LeaveBalance[] = [
  { employeeId: 'emp001', leaveType: 'Annual', accrued: 20, taken: 5, remaining: 15 },
  { employeeId: 'emp001', leaveType: 'Sick', accrued: 10, taken: 2, remaining: 8 },
  { employeeId: 'emp002', leaveType: 'Annual', accrued: 20, taken: 8, remaining: 12 },
  { employeeId: 'emp002', leaveType: 'Sick', accrued: 10, taken: 3, remaining: 7 },
];

export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 'leave001',
    employeeId: 'emp001',
    employeeName: 'Sarah Johnson',
    leaveType: 'Annual',
    startDate: '2025-12-20',
    endDate: '2025-12-24',
    days: 5,
    reason: 'Christmas vacation',
    status: 'Pending',
    submittedDate: '2025-12-01',
  },
  {
    id: 'leave002',
    employeeId: 'emp002',
    employeeName: 'James Martinez',
    leaveType: 'Sick',
    startDate: '2025-12-10',
    endDate: '2025-12-11',
    days: 2,
    reason: 'Medical appointment',
    status: 'Approved',
    reviewedBy: 'emp006',
    submittedDate: '2025-12-05',
  },
  {
    id: 'leave003',
    employeeId: 'emp003',
    employeeName: 'Emma Davis',
    leaveType: 'Annual',
    startDate: '2025-12-15',
    endDate: '2025-12-16',
    days: 2,
    reason: 'Personal matters',
    status: 'Rejected',
    reviewedBy: 'emp007',
    rejectionReason: 'Insufficient coverage during that period',
    submittedDate: '2025-12-02',
  },
];

export async function getLeaveBalances(employeeId: string): Promise<LeaveBalance[]> {
  return mockLeaveBalances.filter((balance) => balance.employeeId === employeeId);
}

export async function getLeaveRequests(filters?: { employeeId?: string; status?: string }): Promise<LeaveRequest[]> {
  let requests = mockLeaveRequests;
  if (filters?.employeeId) {
    requests = requests.filter((req) => req.employeeId === filters.employeeId);
  }
  if (filters?.status) {
    requests = requests.filter((req) => req.status === filters.status);
  }
  return requests;
}

export async function submitLeaveRequest(request: Omit<LeaveRequest, 'id'>): Promise<LeaveRequest> {
  return { ...request, id: `leave${Date.now()}` };
}

export async function reviewLeaveRequest(
  id: string,
  status: 'Approved' | 'Rejected',
  reviewedBy: string,
  rejectionReason?: string
): Promise<LeaveRequest> {
  const request = mockLeaveRequests.find((req) => req.id === id);
  if (!request) throw new Error('Leave request not found');
  return { ...request, status, reviewedBy, rejectionReason };
}

// ==================== PAYROLL ====================

export const mockPayGrades: PayGrade[] = [
  { id: 'grade001', name: 'G1', minSalary: 30000, maxSalary: 45000, currency: 'USD' },
  { id: 'grade002', name: 'G2', minSalary: 45000, maxSalary: 60000, currency: 'USD' },
  { id: 'grade003', name: 'G3', minSalary: 60000, maxSalary: 80000, currency: 'USD' },
  { id: 'grade004', name: 'G4', minSalary: 80000, maxSalary: 110000, currency: 'USD' },
  { id: 'grade005', name: 'G5', minSalary: 110000, maxSalary: 150000, currency: 'USD' },
  { id: 'grade006', name: 'G6', minSalary: 150000, maxSalary: 200000, currency: 'USD' },
];

export const mockTaxRules: TaxRule[] = [
  { id: 'tax001', name: 'Federal Income Tax', threshold: 0, rate: 15, type: 'Income Tax' },
  { id: 'tax002', name: 'Social Security', threshold: 0, rate: 6.2, type: 'Social Security' },
  { id: 'tax003', name: 'Health Insurance', threshold: 0, rate: 5, type: 'Insurance' },
];

export const mockPayrollRuns: PayrollRun[] = [
  {
    id: 'payroll001',
    month: 'November',
    year: 2025,
    status: 'Paid',
    totalGross: 450000,
    totalNet: 360000,
    employeeCount: 50,
    createdDate: '2025-11-25',
  },
  {
    id: 'payroll002',
    month: 'December',
    year: 2025,
    status: 'Draft',
    totalGross: 455000,
    totalNet: 365000,
    employeeCount: 50,
    createdDate: '2025-12-01',
  },
];

export const mockPayslips: Payslip[] = [
  {
    id: 'slip001',
    employeeId: 'emp001',
    employeeName: 'Sarah Johnson',
    payrollRunId: 'payroll001',
    month: 'November',
    year: 2025,
    grossSalary: 9500,
    tax: 1425,
    insurance: 475,
    penalties: 0,
    bonuses: 1000,
    netSalary: 8600,
    bankAccount: '****5678',
  },
  {
    id: 'slip002',
    employeeId: 'emp002',
    employeeName: 'James Martinez',
    payrollRunId: 'payroll001',
    month: 'November',
    year: 2025,
    grossSalary: 7500,
    tax: 1125,
    insurance: 375,
    penalties: 0,
    bonuses: 0,
    netSalary: 6000,
    bankAccount: '****1234',
  },
  {
    id: 'slip003',
    employeeId: 'emp003',
    employeeName: 'Emma Davis',
    payrollRunId: 'payroll002',
    month: 'December',
    year: 2025,
    grossSalary: 5500,
    tax: 825,
    insurance: 275,
    penalties: 100,
    bonuses: 0,
    netSalary: 4300,
    errors: ['Missing bank account information'],
  },
];

export async function getPayGrades(): Promise<PayGrade[]> {
  return mockPayGrades;
}

export async function getTaxRules(): Promise<TaxRule[]> {
  return mockTaxRules;
}

export async function getPayrollRuns(): Promise<PayrollRun[]> {
  return mockPayrollRuns;
}

export async function getPayslips(payrollRunId?: string): Promise<Payslip[]> {
  if (payrollRunId) {
    return mockPayslips.filter((slip) => slip.payrollRunId === payrollRunId);
  }
  return mockPayslips;
}

export async function createPayrollRun(run: Omit<PayrollRun, 'id'>): Promise<PayrollRun> {
  return { ...run, id: `payroll${Date.now()}` };
}