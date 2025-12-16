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
  PayrollPolicy,
  CreatePayrollPolicyDto,
  PayType,
  CreatePayTypeDto,
  TerminationBenefit,
  CreateTerminationBenefitDto,
  CompanyWideSettings,
  CreateCompanyWideSettingsDto,
  UpdateCompanyWideSettingsDto,
  CreateTaxRuleDto,
} from "./types";

// ==================== EMPLOYEE PROFILE ====================

export const mockEmployees: Employee[] = [
  {
    id: "emp001",
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    phone: "+1-555-0101",
    address: "123 Main St, New York, NY 10001",
    photo: "https://i.pravatar.cc/150?img=1",
    employeeId: "EMP001",
    department: "Engineering",
    position: "Senior Software Engineer",
    managerId: "emp005",
    managerName: "Michael Chen",
    joinDate: "2021-03-15",
    status: "Active",
    payGrade: "G5",
  },
  {
    id: "emp002",
    name: "James Martinez",
    email: "james.martinez@company.com",
    phone: "+1-555-0102",
    address: "456 Oak Ave, Los Angeles, CA 90001",
    photo: "https://i.pravatar.cc/150?img=12",
    employeeId: "EMP002",
    department: "Marketing",
    position: "Marketing Manager",
    managerId: "emp006",
    managerName: "Emily Rodriguez",
    joinDate: "2020-07-01",
    status: "Active",
    payGrade: "G4",
  },
  {
    id: "emp003",
    name: "Emma Davis",
    email: "emma.davis@company.com",
    phone: "+1-555-0103",
    address: "789 Pine Rd, Chicago, IL 60601",
    photo: "https://i.pravatar.cc/150?img=5",
    employeeId: "EMP003",
    department: "HR",
    position: "HR Specialist",
    managerId: "emp007",
    managerName: "David Kim",
    joinDate: "2022-01-10",
    status: "Active",
    payGrade: "G3",
  },
  {
    id: "emp004",
    name: "Robert Wilson",
    email: "robert.wilson@company.com",
    phone: "+1-555-0104",
    address: "321 Elm St, Houston, TX 77001",
    photo: "https://i.pravatar.cc/150?img=13",
    employeeId: "EMP004",
    department: "Finance",
    position: "Financial Analyst",
    managerId: "emp008",
    managerName: "Lisa Thompson",
    joinDate: "2019-11-20",
    status: "Active",
    payGrade: "G3",
  },
  {
    id: "emp005",
    name: "Michael Chen",
    email: "michael.chen@company.com",
    phone: "+1-555-0105",
    address: "654 Maple Dr, Seattle, WA 98101",
    photo: "https://i.pravatar.cc/150?img=14",
    employeeId: "EMP005",
    department: "Engineering",
    position: "Engineering Director",
    joinDate: "2018-05-15",
    status: "Active",
    payGrade: "G6",
  },
];

export async function getEmployeeById(
  id: string
): Promise<Employee | undefined> {
  return mockEmployees.find((emp) => emp.id === id);
}

export async function updateEmployee(
  id: string,
  updates: Partial<Employee>
): Promise<Employee> {
  const employee = mockEmployees.find((emp) => emp.id === id);
  if (!employee) throw new Error("Employee not found");
  return { ...employee, ...updates };
}

export async function getTeamMembers(managerId: string): Promise<Employee[]> {
  return mockEmployees.filter((emp) => emp.managerId === managerId);
}

// ==================== ORGANIZATION STRUCTURE ====================

export const mockDepartments: Department[] = [
  {
    id: "dept001",
    name: "Engineering",
    managerId: "emp005",
    employeeCount: 45,
  },
  { id: "dept002", name: "Marketing", managerId: "emp006", employeeCount: 12 },
  { id: "dept003", name: "HR", managerId: "emp007", employeeCount: 8 },
  { id: "dept004", name: "Finance", managerId: "emp008", employeeCount: 15 },
  { id: "dept005", name: "Sales", managerId: "emp009", employeeCount: 22 },
];

export const mockPositions: Position[] = [
  {
    id: "pos001",
    title: "Senior Software Engineer",
    departmentId: "dept001",
    departmentName: "Engineering",
    payGrade: "G5",
    status: "Active",
    reportingTo: "Engineering Director",
  },
  {
    id: "pos002",
    title: "Marketing Manager",
    departmentId: "dept002",
    departmentName: "Marketing",
    payGrade: "G4",
    status: "Active",
    reportingTo: "VP Marketing",
  },
  {
    id: "pos003",
    title: "HR Specialist",
    departmentId: "dept003",
    departmentName: "HR",
    payGrade: "G3",
    status: "Active",
    reportingTo: "HR Director",
  },
  {
    id: "pos004",
    title: "Financial Analyst",
    departmentId: "dept004",
    departmentName: "Finance",
    payGrade: "G3",
    status: "Active",
    reportingTo: "Finance Manager",
  },
  {
    id: "pos005",
    title: "Junior Developer",
    departmentId: "dept001",
    departmentName: "Engineering",
    payGrade: "G2",
    status: "Delimited",
    reportingTo: "Senior Software Engineer",
  },
];

export async function getDepartments(): Promise<Department[]> {
  return mockDepartments;
}

export async function getPositions(): Promise<Position[]> {
  return mockPositions;
}

export async function updatePositionStatus(
  id: string,
  status: "Active" | "Delimited"
): Promise<Position> {
  const position = mockPositions.find((pos) => pos.id === id);
  if (!position) throw new Error("Position not found");
  return { ...position, status };
}

// ==================== PERFORMANCE MANAGEMENT ====================

export const mockPerformanceCycles: PerformanceCycle[] = [
  {
    id: "cycle001",
    name: "Q1 2025 Performance Review",
    startDate: "2025-01-01",
    endDate: "2025-03-31",
    status: "Active",
    templateId: "template001",
  },
  {
    id: "cycle002",
    name: "Q4 2024 Performance Review",
    startDate: "2024-10-01",
    endDate: "2024-12-31",
    status: "Completed",
    templateId: "template001",
  },
];

export const mockEvaluations: Evaluation[] = [
  {
    id: "eval001",
    cycleId: "cycle001",
    employeeId: "emp001",
    employeeName: "Sarah Johnson",
    managerId: "emp005",
    rating: 4.5,
    comments: "Excellent performance, consistently delivers high-quality work.",
    attendanceScore: 95,
    status: "Completed",
  },
  {
    id: "eval002",
    cycleId: "cycle001",
    employeeId: "emp002",
    employeeName: "James Martinez",
    managerId: "emp006",
    rating: 4.0,
    comments: "Good work on recent campaigns.",
    attendanceScore: 92,
    status: "Pending",
  },
];

export async function getPerformanceCycles(): Promise<PerformanceCycle[]> {
  return mockPerformanceCycles;
}

export async function createPerformanceCycle(
  cycle: Omit<PerformanceCycle, "id">
): Promise<PerformanceCycle> {
  return { ...cycle, id: `cycle${Date.now()}` };
}

export async function getEvaluations(cycleId: string): Promise<Evaluation[]> {
  return mockEvaluations.filter((evaluation) => evaluation.cycleId === cycleId);
}

export async function submitEvaluation(
  evaluation: Omit<Evaluation, "id">
): Promise<Evaluation> {
  return { ...evaluation, id: `eval${Date.now()}` };
}

// ==================== TIME MANAGEMENT ====================

export const mockShifts: Shift[] = [
  {
    id: "shift001",
    name: "Day Shift",
    type: "Normal",
    startTime: "09:00",
    endTime: "17:00",
    breakDuration: 60,
  },
  {
    id: "shift002",
    name: "Night Shift",
    type: "Overnight",
    startTime: "22:00",
    endTime: "06:00",
    breakDuration: 60,
  },
  {
    id: "shift003",
    name: "Split Shift",
    type: "Split",
    startTime: "09:00",
    endTime: "21:00",
    breakDuration: 180,
  },
];

export const mockAttendanceLogs: AttendanceLog[] = [
  {
    id: "att001",
    employeeId: "emp001",
    employeeName: "Sarah Johnson",
    date: "2025-12-09",
    punchIn: "09:05",
    punchOut: "17:10",
    status: "Late",
    shiftId: "shift001",
    corrected: false,
  },
  {
    id: "att002",
    employeeId: "emp002",
    employeeName: "James Martinez",
    date: "2025-12-09",
    punchIn: "08:55",
    punchOut: "17:00",
    status: "On Time",
    shiftId: "shift001",
    corrected: false,
  },
  {
    id: "att003",
    employeeId: "emp003",
    employeeName: "Emma Davis",
    date: "2025-12-09",
    punchIn: "09:10",
    status: "Missing Punch",
    shiftId: "shift001",
    corrected: false,
  },
  {
    id: "att004",
    employeeId: "emp004",
    employeeName: "Robert Wilson",
    date: "2025-12-09",
    status: "Absent",
    shiftId: "shift001",
    corrected: false,
  },
];

export async function getShifts(): Promise<Shift[]> {
  return mockShifts;
}

export async function getAttendanceLogs(
  date?: string
): Promise<AttendanceLog[]> {
  if (date) {
    return mockAttendanceLogs.filter((log) => log.date === date);
  }
  return mockAttendanceLogs;
}

export async function correctAttendance(
  id: string,
  updates: Partial<AttendanceLog>
): Promise<AttendanceLog> {
  const log = mockAttendanceLogs.find((l) => l.id === id);
  if (!log) throw new Error("Attendance log not found");
  return { ...log, ...updates, corrected: true };
}

// ==================== RECRUITMENT ====================

export const mockCandidates: Candidate[] = [
  {
    id: "cand001",
    name: "Alex Thompson",
    email: "alex.t@email.com",
    phone: "+1-555-0201",
    position: "Software Engineer",
    stage: "Interview",
    appliedDate: "2025-11-15",
  },
  {
    id: "cand002",
    name: "Maria Garcia",
    email: "maria.g@email.com",
    phone: "+1-555-0202",
    position: "Product Manager",
    stage: "Offer",
    appliedDate: "2025-11-20",
  },
  {
    id: "cand003",
    name: "John Lee",
    email: "john.l@email.com",
    phone: "+1-555-0203",
    position: "UX Designer",
    stage: "Applied",
    appliedDate: "2025-12-01",
  },
];

export const mockOnboardingTasks: OnboardingTask[] = [
  {
    id: "onb001",
    employeeId: "emp001",
    task: "Submit ID Documents",
    category: "Docs",
    status: "Completed",
    dueDate: "2021-03-20",
  },
  {
    id: "onb002",
    employeeId: "emp001",
    task: "Collect Laptop",
    category: "Assets",
    status: "Completed",
    dueDate: "2021-03-22",
  },
  {
    id: "onb003",
    employeeId: "emp001",
    task: "Setup Email Account",
    category: "Access",
    status: "Completed",
    dueDate: "2021-03-15",
  },
];

export const mockOffboardingCases: OffboardingCase[] = [
  {
    id: "off001",
    employeeId: "emp010",
    employeeName: "Former Employee",
    type: "Resignation",
    lastWorkingDay: "2025-12-31",
    assetsRecovered: false,
    accessRevoked: false,
    exitInterviewCompleted: false,
    status: "In Progress",
  },
];

export async function getCandidates(): Promise<Candidate[]> {
  return mockCandidates;
}

export async function updateCandidateStage(
  id: string,
  stage: Candidate["stage"]
): Promise<Candidate> {
  const candidate = mockCandidates.find((c) => c.id === id);
  if (!candidate) throw new Error("Candidate not found");
  return { ...candidate, stage };
}

export async function getOnboardingTasks(
  employeeId: string
): Promise<OnboardingTask[]> {
  return mockOnboardingTasks.filter((task) => task.employeeId === employeeId);
}

export async function getOffboardingCases(): Promise<OffboardingCase[]> {
  return mockOffboardingCases;
}

// ==================== LEAVES ====================

export const mockLeaveBalances: LeaveBalance[] = [
  {
    employeeId: "emp001",
    leaveType: "Annual",
    accrued: 20,
    taken: 5,
    remaining: 15,
  },
  {
    employeeId: "emp001",
    leaveType: "Sick",
    accrued: 10,
    taken: 2,
    remaining: 8,
  },
  {
    employeeId: "emp002",
    leaveType: "Annual",
    accrued: 20,
    taken: 8,
    remaining: 12,
  },
  {
    employeeId: "emp002",
    leaveType: "Sick",
    accrued: 10,
    taken: 3,
    remaining: 7,
  },
];

export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: "leave001",
    employeeId: "emp001",
    employeeName: "Sarah Johnson",
    leaveType: "Annual",
    startDate: "2025-12-20",
    endDate: "2025-12-24",
    days: 5,
    reason: "Christmas vacation",
    status: "Pending",
    submittedDate: "2025-12-01",
  },
  {
    id: "leave002",
    employeeId: "emp002",
    employeeName: "James Martinez",
    leaveType: "Sick",
    startDate: "2025-12-10",
    endDate: "2025-12-11",
    days: 2,
    reason: "Medical appointment",
    status: "Approved",
    reviewedBy: "emp006",
    submittedDate: "2025-12-05",
  },
  {
    id: "leave003",
    employeeId: "emp003",
    employeeName: "Emma Davis",
    leaveType: "Annual",
    startDate: "2025-12-15",
    endDate: "2025-12-16",
    days: 2,
    reason: "Personal matters",
    status: "Rejected",
    reviewedBy: "emp007",
    rejectionReason: "Insufficient coverage during that period",
    submittedDate: "2025-12-02",
  },
];

export async function getLeaveBalances(
  employeeId: string
): Promise<LeaveBalance[]> {
  return mockLeaveBalances.filter(
    (balance) => balance.employeeId === employeeId
  );
}

export async function getLeaveRequests(filters?: {
  employeeId?: string;
  status?: string;
}): Promise<LeaveRequest[]> {
  let requests = mockLeaveRequests;
  if (filters?.employeeId) {
    requests = requests.filter((req) => req.employeeId === filters.employeeId);
  }
  if (filters?.status) {
    requests = requests.filter((req) => req.status === filters.status);
  }
  return requests;
}

export async function submitLeaveRequest(
  request: Omit<LeaveRequest, "id">
): Promise<LeaveRequest> {
  return { ...request, id: `leave${Date.now()}` };
}

export async function reviewLeaveRequest(
  id: string,
  status: "Approved" | "Rejected",
  reviewedBy: string,
  rejectionReason?: string
): Promise<LeaveRequest> {
  const request = mockLeaveRequests.find((req) => req.id === id);
  if (!request) throw new Error("Leave request not found");
  return { ...request, status, reviewedBy, rejectionReason };
}

// ==================== PAYROLL ====================

// export const mockPayGrades: PayGrade[] = [
//   {
//     id: "grade001",
//     name: "G1",
//     minSalary: 30000,
//     maxSalary: 45000,
//     currency: "USD",
//   },
//   {
//     id: "grade002",
//     name: "G2",
//     minSalary: 45000,
//     maxSalary: 60000,
//     currency: "USD",
//   },
//   {
//     id: "grade003",
//     name: "G3",
//     minSalary: 60000,
//     maxSalary: 80000,
//     currency: "USD",
//   },
//   {
//     id: "grade004",
//     name: "G4",
//     minSalary: 80000,
//     maxSalary: 110000,
//     currency: "USD",
//   },
//   {
//     id: "grade005",
//     name: "G5",
//     minSalary: 110000,
//     maxSalary: 150000,
//     currency: "USD",
//   },
//   {
//     id: "grade006",
//     name: "G6",
//     minSalary: 150000,
//     maxSalary: 200000,
//     currency: "USD",
//   },
// ];

// export const mockTaxRules: TaxRule[] = [
//   {
//     id: "tax001",
//     name: "Federal Income Tax",
//     threshold: 0,
//     rate: 15,
//     type: "Income Tax",
//   },
//   {
//     id: "tax002",
//     name: "Social Security",
//     threshold: 0,
//     rate: 6.2,
//     type: "Social Security",
//   },
//   {
//     id: "tax003",
//     name: "Health Insurance",
//     threshold: 0,
//     rate: 5,
//     type: "Insurance",
//   },
// ];

export const mockPayrollRuns: PayrollRun[] = [
  {
    id: "payroll001",
    month: "November",
    year: 2025,
    status: "Paid",
    totalGross: 450000,
    totalNet: 360000,
    employeeCount: 50,
    createdDate: "2025-11-25",
  },
  {
    id: "payroll002",
    month: "December",
    year: 2025,
    status: "Draft",
    totalGross: 455000,
    totalNet: 365000,
    employeeCount: 50,
    createdDate: "2025-12-01",
  },
];

export const mockPayslips: Payslip[] = [
  {
    id: "slip001",
    employeeId: "emp001",
    employeeName: "Sarah Johnson",
    payrollRunId: "payroll001",
    month: "November",
    year: 2025,
    grossSalary: 9500,
    tax: 1425,
    insurance: 475,
    penalties: 0,
    bonuses: 1000,
    netSalary: 8600,
    bankAccount: "****5678",
  },
  {
    id: "slip002",
    employeeId: "emp002",
    employeeName: "James Martinez",
    payrollRunId: "payroll001",
    month: "November",
    year: 2025,
    grossSalary: 7500,
    tax: 1125,
    insurance: 375,
    penalties: 0,
    bonuses: 0,
    netSalary: 6000,
    bankAccount: "****1234",
  },
  {
    id: "slip003",
    employeeId: "emp003",
    employeeName: "Emma Davis",
    payrollRunId: "payroll002",
    month: "December",
    year: 2025,
    grossSalary: 5500,
    tax: 825,
    insurance: 275,
    penalties: 100,
    bonuses: 0,
    netSalary: 4300,
    errors: ["Missing bank account information"],
  },
];

// export async function getPayGrades(): Promise<PayGrade[]> {
//   return mockPayGrades;
// }

// export async function getTaxRules(): Promise<TaxRule[]> {
//   return mockTaxRules;
// }

export async function getPayrollRuns(): Promise<PayrollRun[]> {
  return mockPayrollRuns;
}

export async function getPayslips(payrollRunId?: string): Promise<Payslip[]> {
  if (payrollRunId) {
    return mockPayslips.filter((slip) => slip.payrollRunId === payrollRunId);
  }
  return mockPayslips;
}

export async function createPayrollRun(
  run: Omit<PayrollRun, "id">
): Promise<PayrollRun> {
  return { ...run, id: `payroll${Date.now()}` };
}

// ==================== REAL BACKEND API CALLS ====================
// These use the actual backend API endpoints
// Teams should use these instead of mock functions when backend is ready

import axiosInstance from "../utils/ApiClient";

// Time Management API
export const timeManagementApi = {
  // Shift Types
  getShiftTypes: () => axiosInstance.get("/time-management/shift-types"),
  createShiftType: (data: any) =>
    axiosInstance.post("/time-management/shift-types", data),
  updateShiftType: (id: string, data: any) =>
    axiosInstance.put(`/time-management/shift-types/${id}`, data),
  deleteShiftType: (id: string) =>
    axiosInstance.delete(`/time-management/shift-types/${id}`),

  // Shifts
  getShifts: () => axiosInstance.get("/time-management/shifts"),
  createShift: (data: any) =>
    axiosInstance.post("/time-management/shifts", data),
  updateShift: (id: string, data: any) =>
    axiosInstance.put(`/time-management/shifts/${id}`, data),
  deleteShift: (id: string) =>
    axiosInstance.delete(`/time-management/shifts/${id}`),

  // Schedule Rules
  getScheduleRules: () => axiosInstance.get("/time-management/schedule-rules"),
  createScheduleRule: (data: any) =>
    axiosInstance.post("/time-management/schedule-rules", data),
  updateScheduleRule: (id: string, data: any) =>
    axiosInstance.put(`/time-management/schedule-rules/${id}`, data),
  deleteScheduleRule: (id: string) =>
    axiosInstance.delete(`/time-management/schedule-rules/${id}`),

  // Shift Assignments
  getShiftAssignments: () =>
    axiosInstance.get("/time-management/shift-assignments"),
  createShiftAssignment: (data: any) =>
    axiosInstance.post("/time-management/shift-assignments", data),
  createBulkShiftAssignment: (data: any) =>
    axiosInstance.post("/time-management/shift-assignments/bulk", data),
  updateShiftAssignment: (id: string, data: any) =>
    axiosInstance.put(`/time-management/shift-assignments/${id}`, data),
  deleteShiftAssignment: (id: string) =>
    axiosInstance.delete(`/time-management/shift-assignments/${id}`),

  // Attendance
  clockInOut: (data: any) =>
    axiosInstance.post("/time-management/attendance/clock", data),
  getAttendanceRecords: (filters?: any) => {
    if (filters) {
      return axiosInstance.get("/time-management/attendance/records", {
        params: filters,
      });
    }
    return axiosInstance.get("/time-management/attendance/records");
  },
  createAttendanceRecord: (data: any) =>
    axiosInstance.post("/time-management/attendance/records", data),
  updateAttendanceRecord: (id: string, data: any) =>
    axiosInstance.put(`/time-management/attendance/records/${id}`, data),
  manualAttendanceCorrection: (id: string, data: any) =>
    axiosInstance.put(
      `/time-management/attendance/records/${id}/correct`,
      data
    ),
  checkMissedPunches: () =>
    axiosInstance.post("/time-management/attendance/missed-punches/check"),

  // Correction Requests
  getCorrectionRequests: () =>
    axiosInstance.get("/time-management/attendance/correction-requests"),
  createCorrectionRequest: (data: any) =>
    axiosInstance.post("/time-management/attendance/correction-requests", data),
  updateCorrectionRequest: (id: string, data: any) =>
    axiosInstance.put(
      `/time-management/attendance/correction-requests/${id}`,
      data
    ),
  approveCorrectionRequest: (id: string) =>
    axiosInstance.patch(
      `/time-management/attendance/correction-requests/${id}`,
      { status: "approved" }
    ),
  rejectCorrectionRequest: (id: string, reason: string) =>
    axiosInstance.patch(
      `/time-management/attendance/correction-requests/${id}`,
      { status: "rejected", rejectionReason: reason }
    ),

  // Time Exceptions
  getTimeExceptions: () =>
    axiosInstance.get("/time-management/time-exceptions"),
  createTimeException: (data: any) =>
    axiosInstance.post("/time-management/time-exceptions", data),
  updateTimeException: (id: string, data: any) =>
    axiosInstance.put(`/time-management/time-exceptions/${id}`, data),

  // Overtime Rules
  getOvertimeRules: () => axiosInstance.get("/time-management/overtime-rules"),
  createOvertimeRule: (data: any) =>
    axiosInstance.post("/time-management/overtime-rules", data),
  updateOvertimeRule: (id: string, data: any) =>
    axiosInstance.put(`/time-management/overtime-rules/${id}`, data),
  deleteOvertimeRule: (id: string) =>
    axiosInstance.delete(`/time-management/overtime-rules/${id}`),

  // Lateness Rules
  getLatenessRules: () => axiosInstance.get("/time-management/lateness-rules"),
  createLatenessRule: (data: any) =>
    axiosInstance.post("/time-management/lateness-rules", data),
  updateLatenessRule: (id: string, data: any) =>
    axiosInstance.put(`/time-management/lateness-rules/${id}`, data),
  deleteLatenessRule: (id: string) =>
    axiosInstance.delete(`/time-management/lateness-rules/${id}`),

  // Holidays
  getHolidays: () => axiosInstance.get("/time-management/holidays"),
  createHoliday: (data: any) =>
    axiosInstance.post("/time-management/holidays", data),
  updateHoliday: (id: string, data: any) =>
    axiosInstance.put(`/time-management/holidays/${id}`, data),
  deleteHoliday: (id: string) =>
    axiosInstance.delete(`/time-management/holidays/${id}`),

  // Reports
  generateAttendanceReport: (params: any) =>
    axiosInstance.get("/time-management/reports/attendance", { params }),
  generateOvertimeReport: (params: any) =>
    axiosInstance.get("/time-management/reports/overtime", { params }),
  generateExceptionReport: (params: any) =>
    axiosInstance.get("/time-management/reports/exceptions", { params }),
};

// Employee Profile API
export const employeeProfileApi = {
  getAll: () => axiosInstance.get("/employee-profile"),
  getEmployees: () => axiosInstance.get("/employee-profile"),
  getEmployee: (id: string) => axiosInstance.get(`/employee-profile/${id}`),
  createEmployee: (data: any) => axiosInstance.post("/employee-profile", data),
  updateEmployee: (id: string, data: any) =>
    axiosInstance.put(`/employee-profile/${id}`, data),
  getCandidates: () => axiosInstance.get("/employee-profile/candidates"),
  getCandidate: (id: string) =>
    axiosInstance.get(`/employee-profile/candidates/${id}`),
  // Get employees by roles (if backend supports it, otherwise filters client-side)
  getByRoles: async (roles: string[]) => {
    // Try to get all employees and filter by roles client-side
    // If backend has a specific endpoint, use that instead
    const response = await axiosInstance.get("/employee-profile");
    if (response.data && Array.isArray(response.data)) {
      const filtered = response.data.filter(
        (emp: any) =>
          emp.roles &&
          emp.roles.some((role: string) =>
            roles.some((r) => r.toLowerCase() === role.toLowerCase())
          )
      );
      return { ...response, data: filtered };
    }
    return response;
  },
};

// Organization API
export const organizationApi = {
  getDepartments: () =>
    axiosInstance.get("/organization-structure/departments"),
  getDepartment: (id: string) =>
    axiosInstance.get(`/organization-structure/departments/${id}`),
  getPositions: () => axiosInstance.get("/organization-structure/positions"),
  getPosition: (id: string) =>
    axiosInstance.get(`/organization-structure/positions/${id}`),
};

// ==================== PAYROLL POLICIES ====================

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function getPayrollPolicies(): Promise<PayrollPolicy[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/payroll-policies`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch policies");
    return await response.json();
  } catch (error) {
    console.error("Error fetching payroll policies:", error);
    return [];
  }
}

export async function getPayrollPolicyById(
  id: string
): Promise<PayrollPolicy | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/payroll-policies/${id}`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch policy");
    return await response.json();
  } catch (error) {
    console.error("Error fetching payroll policy:", error);
    return null;
  }
}

export async function createPayrollPolicy(
  dto: CreatePayrollPolicyDto
): Promise<{ data: PayrollPolicy | null; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/payroll-policies`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dto),
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to create policy" }));
      return {
        data: null,
        error: errorData.message || "Failed to create policy",
      };
    }
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("Error creating payroll policy:", error);
    return { data: null, error: "Network error: Unable to connect to server" };
  }
}

export async function updatePayrollPolicy(
  id: string,
  dto: Partial<CreatePayrollPolicyDto>
): Promise<{ data: PayrollPolicy | null; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/payroll-policies/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dto),
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to update policy" }));
      return {
        data: null,
        error: errorData.message || "Failed to update policy",
      };
    }
    const result = await response.json();
    return { data: result.data || result };
  } catch (error) {
    console.error("Error updating payroll policy:", error);
    return { data: null, error: "Network error: Unable to connect to server" };
  }
}

export async function deletePayrollPolicy(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/payroll-policies/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to delete policy" }));
      return {
        success: false,
        message: errorData.message || "Failed to delete policy",
      };
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting payroll policy:", error);
    return {
      success: false,
      message: "Network error: Unable to connect to server",
    };
  }
}
export async function updatePayrollPolicyStatus(
  id: string,
  status: "draft" | "approved" | "rejected"
): Promise<{ data: PayrollPolicy | null; error?: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/payroll-policies/${id}/status`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      }
    );
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to update policy status" }));
      return {
        data: null,
        error: errorData.message || "Failed to update policy status",
      };
    }
    const result = await response.json();
    return { data: result.data || result };
  } catch (error) {
    console.error("Error updating payroll policy status:", error);
    return { data: null, error: "Network error: Unable to connect to server" };
  }
}

// ==================== PAY TYPES ====================

export async function getPayTypes(): Promise<PayType[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/pay-types`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch pay types");
    return await response.json();
  } catch (error) {
    console.error("Error fetching pay types:", error);
    return [];
  }
}

export async function getPayTypeById(id: string): Promise<PayType | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/pay-types/${id}`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch pay type");
    return await response.json();
  } catch (error) {
    console.error("Error fetching pay type:", error);
    return null;
  }
}

export async function createPayType(
  dto: CreatePayTypeDto
): Promise<{ data: PayType | null; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/pay-types`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dto),
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to create pay type" }));
      return {
        data: null,
        error: errorData.message || "Failed to create pay type",
      };
    }
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("Error creating pay type:", error);
    return { data: null, error: "Network error: Unable to connect to server" };
  }
}

export async function updatePayType(
  id: string,
  dto: Partial<CreatePayTypeDto>
): Promise<{ data: PayType | null; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/pay-types/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dto),
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to update pay type" }));
      return {
        data: null,
        error: errorData.message || "Failed to update pay type",
      };
    }
    const result = await response.json();
    return { data: result.data || result };
  } catch (error) {
    console.error("Error updating pay type:", error);
    return { data: null, error: "Network error: Unable to connect to server" };
  }
}

export async function deletePayType(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/pay-types/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to delete pay type" }));
      return {
        success: false,
        message: errorData.message || "Failed to delete pay type",
      };
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting pay type:", error);
    return {
      success: false,
      message: "Network error: Unable to connect to server",
    };
  }
}

export async function updatePayTypeStatus(
  id: string,
  status: "draft" | "approved" | "rejected"
): Promise<{ data: PayType | null; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/pay-types/${id}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to update pay type status" }));
      return {
        data: null,
        error: errorData.message || "Failed to update pay type status",
      };
    }
    const result = await response.json();
    return { data: result.data || result };
  } catch (error) {
    console.error("Error updating pay type status:", error);
    return { data: null, error: "Network error: Unable to connect to server" };
  }
}

// ==================== TAX RULES ====================

export async function getTaxRules(): Promise<TaxRule[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/tax-rules`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch tax rules");
    return await response.json();
  } catch (error) {
    console.error("Error fetching tax rules:", error);
    return [];
  }
}

export async function getTaxRuleById(id: string): Promise<TaxRule | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/tax-rules/${id}`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch tax rule");
    return await response.json();
  } catch (error) {
    console.error("Error fetching tax rule:", error);
    return null;
  }
}

export async function createTaxRule(
  dto: CreateTaxRuleDto
): Promise<{ data: TaxRule | null; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/tax-rules`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dto),
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to create tax rule" }));
      return {
        data: null,
        error: errorData.message || "Failed to create tax rule",
      };
    }
    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("Error creating tax rule:", error);
    return { data: null, error: "Network error: Unable to connect to server" };
  }
}

export async function updateTaxRule(
  id: string,
  dto: Partial<CreateTaxRuleDto>
): Promise<{ data: TaxRule | null; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/tax-rules/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dto),
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to update tax rule" }));
      return {
        data: null,
        error: errorData.message || "Failed to update tax rule",
      };
    }
    const result = await response.json();
    return { data: result.data || result };
  } catch (error) {
    console.error("Error updating tax rule:", error);
    return { data: null, error: "Network error: Unable to connect to server" };
  }
}

export async function deleteTaxRule(
  id: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/tax-rules/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to delete tax rule" }));
      return {
        success: false,
        message: errorData.message || "Failed to delete tax rule",
      };
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting tax rule:", error);
    return {
      success: false,
      message: "Network error: Unable to connect to server",
    };
  }
}

export async function updateTaxRuleStatus(
  id: string,
  status: "draft" | "approved" | "rejected"
): Promise<{ data: TaxRule | null; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/tax-rules/${id}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to update tax rule status" }));
      return {
        data: null,
        error: errorData.message || "Failed to update tax rule status",
      };
    }
    const result = await response.json();
    return { data: result.data || result };
  } catch (error) {
    console.error("Error updating tax rule status:", error);
    return { data: null, error: "Network error: Unable to connect to server" };
  }
}

// ==================== TERMINATION & RESIGNATION BENEFITS ====================

export async function getTerminationBenefits(): Promise<TerminationBenefit[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/termination-and-resignation-benefits`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    if (!response.ok) {
      console.error("Failed to fetch termination benefits");
      return [];
    }
    const result = await response.json();
    return Array.isArray(result) ? result : result.data || [];
  } catch (error) {
    console.error("Error fetching termination benefits:", error);
    return [];
  }
}

export async function getTerminationBenefitById(
  id: string
): Promise<TerminationBenefit | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/termination-and-resignation-benefits/${id}`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    if (!response.ok) {
      console.error("Failed to fetch termination benefit");
      return null;
    }
    const result = await response.json();
    return result.data || result;
  } catch (error) {
    console.error("Error fetching termination benefit:", error);
    return null;
  }
}

export async function createTerminationBenefit(
  dto: CreateTerminationBenefitDto
): Promise<{ data: TerminationBenefit | null; error?: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/termination-and-resignation-benefits`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dto),
      }
    );
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to create termination benefit" }));
      return {
        data: null,
        error: errorData.message || "Failed to create termination benefit",
      };
    }
    const result = await response.json();
    return { data: result.data || result };
  } catch (error) {
    console.error("Error creating termination benefit:", error);
    return { data: null, error: "Network error: Unable to connect to server" };
  }
}

export async function updateTerminationBenefit(
  id: string,
  dto: Partial<CreateTerminationBenefitDto>
): Promise<{ data: TerminationBenefit | null; error?: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/termination-and-resignation-benefits/${id}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dto),
      }
    );
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to update termination benefit" }));
      return {
        data: null,
        error: errorData.message || "Failed to update termination benefit",
      };
    }
    const result = await response.json();
    return { data: result.data || result };
  } catch (error) {
    console.error("Error updating termination benefit:", error);
    return { data: null, error: "Network error: Unable to connect to server" };
  }
}

export async function deleteTerminationBenefit(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/termination-and-resignation-benefits/${id}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Failed to delete termination benefit" }));
      return {
        success: false,
        error: errorData.message || "Failed to delete termination benefit",
      };
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting termination benefit:", error);
    return {
      success: false,
      error: "Network error: Unable to connect to server",
    };
  }
}

export async function updateTerminationBenefitStatus(
  id: string,
  status: "draft" | "approved" | "rejected"
): Promise<{ data: TerminationBenefit | null; error?: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/termination-and-resignation-benefits/${id}/status`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Failed to update termination benefit status",
      }));
      return {
        data: null,
        error:
          errorData.message || "Failed to update termination benefit status",
      };
    }
    const result = await response.json();
    return { data: result.data || result };
  } catch (error) {
    console.error("Error updating termination benefit status:", error);
    return { data: null, error: "Network error: Unable to connect to server" };
  }
}

// ================= COMPANY SETTINGS =================

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function getCompanySettings() {
  const res = await fetch(`${API_URL}/company-settings`, {
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(text);
    throw new Error("Failed to fetch company settings");
  }

  return res.json();
}

export async function createCompanySettings(dto: CreateCompanyWideSettingsDto) {
  const res = await fetch(`${API_URL}/company-settings`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  const data = await res.json();
  return res.ok
    ? { data }
    : { error: data.message || "Failed to create settings" };
}

export async function updateCompanySettings(id: string, body: any) {
  const res = await fetch(`${API_URL}/company-settings/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return res.ok
    ? { data }
    : { error: data.message || "Failed to update settings" };
}

export async function deleteCompanySettings(id: string) {
  const res = await fetch(`${API_URL}/company-settings/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json();
    return { success: false, message: err.message };
  }

  return { success: true };
}

// ================= BACKUP =================

export async function createManualBackup() {
  const res = await fetch(`${API_URL}/backups`, {
    method: "POST",
    credentials: "include",
  });

  const data = await res.json();
  return res.ok
    ? { data }
    : { error: data.message || "Failed to create backup" };
}

// export async function submitEvaluation(
//   evaluation: Omit<Evaluation, "id">
// ): Promise<Evaluation> {
//   return { ...evaluation, id: `eval${Date.now()}` };
// }
