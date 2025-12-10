import axios from '../lib/axios';

// Auth API
export const authApi = {
  login: (email: string, password: string) => 
    axios.post('/auth/login', { email, password }),
  
  register: (data: any) => 
    axios.post('/auth/register', data),
  
  getProfile: () => 
    axios.get('/auth/profile'),
  
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }
};

// Employee Profile API
export const employeeProfileApi = {
  getAll: () => 
    axios.get('/employee-profile'),
  
  getById: (id: string) => 
    axios.get(`/employee-profile/${id}`),
  
  create: (data: any) => 
    axios.post('/employee-profile', data),
  
  update: (id: string, data: any) => 
    axios.patch(`/employee-profile/${id}`, data),
  
  delete: (id: string) => 
    axios.delete(`/employee-profile/${id}`),
};

// Time Management API
export const timeManagementApi = {
  // Shifts
  getShifts: () => 
    axios.get('/time-management/shifts'),
  
  createShift: (data: any) => 
    axios.post('/time-management/shifts', data),
  
  // Attendance
  getAttendance: () => 
    axios.get('/time-management/attendance'),
  
  createAttendance: (data: any) => 
    axios.post('/time-management/attendance', data),
  
  // Time Exceptions
  getTimeExceptions: () => 
    axios.get('/time-management/time-exceptions'),
  
  createTimeException: (data: any) => 
    axios.post('/time-management/time-exceptions', data),
  
  // Holidays
  getHolidays: () => 
    axios.get('/time-management/holidays'),
  
  createHoliday: (data: any) => 
    axios.post('/time-management/holidays', data),
};

// Leaves API
export const leavesApi = {
  getAll: () => 
    axios.get('/leaves'),
  
  getById: (id: string) => 
    axios.get(`/leaves/${id}`),
  
  create: (data: any) => 
    axios.post('/leaves', data),
  
  update: (id: string, data: any) => 
    axios.patch(`/leaves/${id}`, data),
  
  approve: (id: string) => 
    axios.patch(`/leaves/${id}/approve`),
  
  reject: (id: string) => 
    axios.patch(`/leaves/${id}/reject`),
};

// Recruitment API
export const recruitmentApi = {
  getAll: () => 
    axios.get('/recruitment'),
  
  getById: (id: string) => 
    axios.get(`/recruitment/${id}`),
  
  create: (data: any) => 
    axios.post('/recruitment', data),
  
  update: (id: string, data: any) => 
    axios.patch(`/recruitment/${id}`, data),
  
  delete: (id: string) => 
    axios.delete(`/recruitment/${id}`),
};

// Payroll Configuration API
export const payrollConfigApi = {
  getAll: () => 
    axios.get('/payroll-configuration'),
  
  getById: (id: string) => 
    axios.get(`/payroll-configuration/${id}`),
  
  create: (data: any) => 
    axios.post('/payroll-configuration', data),
  
  update: (id: string, data: any) => 
    axios.patch(`/payroll-configuration/${id}`, data),
};

// Payroll Execution API
export const payrollExecutionApi = {
  getAll: () => 
    axios.get('/payroll-execution'),
  
  getById: (id: string) => 
    axios.get(`/payroll-execution/${id}`),
  
  execute: (data: any) => 
    axios.post('/payroll-execution/execute', data),
};

// Payroll Tracking API
export const payrollTrackingApi = {
  getAll: () => 
    axios.get('/payroll-tracking'),
  
  getById: (id: string) => 
    axios.get(`/payroll-tracking/${id}`),
  
  getByEmployee: (employeeId: string) => 
    axios.get(`/payroll-tracking/employee/${employeeId}`),
  
  createClaim: (data: any) => 
    axios.post('/payroll-tracking/claims', data),
  
  createDispute: (data: any) => 
    axios.post('/payroll-tracking/disputes', data),
};

// Performance API
export const performanceApi = {
  getAll: () => 
    axios.get('/performance'),
  
  getById: (id: string) => 
    axios.get(`/performance/${id}`),
  
  create: (data: any) => 
    axios.post('/performance', data),
  
  update: (id: string, data: any) => 
    axios.patch(`/performance/${id}`, data),
};

// Organization Structure API
export const organizationApi = {
  getDepartments: () => 
    axios.get('/organization-structure/departments'),
  
  getPositions: () => 
    axios.get('/organization-structure/positions'),
  
  createDepartment: (data: any) => 
    axios.post('/organization-structure/departments', data),
  
  createPosition: (data: any) => 
    axios.post('/organization-structure/positions', data),
};
