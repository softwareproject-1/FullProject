import axiosInstance from './ApiClient';

export interface EmployeeProfile {
  _id: string;
  employeeNumber: string;
  dateOfHire: string;
  workEmail?: string;
  personalEmail?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  nationalId: string;
  gender?: 'MALE' | 'FEMALE';
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
  dateOfBirth?: string;
  mobilePhone?: string;
  homePhone?: string;
  profilePictureUrl?: string;
  address?: {
    city?: string;
    streetAddress?: string;
    country?: string;
  };
  contractType?: 'FULL_TIME_CONTRACT' | 'PART_TIME_CONTRACT';
  workType?: 'FULL_TIME' | 'PART_TIME';
  contractStartDate?: string;
  contractEndDate?: string;
  biography?: string;
  bankName?: string;
  bankAccountNumber?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'RETIRED' | 'PROBATION' | 'TERMINATED';
  statusEffectiveFrom?: string;
  primaryPositionId?: string;
  primaryDepartmentId?: string;
  supervisorPositionId?: string;
  payGradeId?: string;
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeProfileFilter {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  departmentIds?: string[];
  positionIds?: string[];
  payGradeIds?: string[];
  workType?: string;
  contractType?: string;
  dateOfHireRange?: {
    from?: string;
    to?: string;
  };
  search?: string;
}

export interface ChangeRequest {
  _id: string;
  requestId: string;
  employeeProfileId: string;
  requestDescription: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED';
  submittedAt?: string;
  processedAt?: string;
  employeeProfile?: EmployeeProfile;
}

// List all employee profiles with filters
export const listEmployeeProfiles = async (filters?: EmployeeProfileFilter) => {
  const params = new URLSearchParams();
  
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.workType) params.append('workType', filters.workType);
  if (filters?.contractType) params.append('contractType', filters.contractType);
  if (filters?.search) params.append('search', filters.search);
  
  if (filters?.departmentIds && filters.departmentIds.length > 0) {
    filters.departmentIds.forEach(id => params.append('departmentIds', id));
  }
  if (filters?.positionIds && filters.positionIds.length > 0) {
    filters.positionIds.forEach(id => params.append('positionIds', id));
  }
  if (filters?.payGradeIds && filters.payGradeIds.length > 0) {
    filters.payGradeIds.forEach(id => params.append('payGradeIds', id));
  }
  if (filters?.dateOfHireRange?.from) {
    params.append('dateOfHireRange[from]', filters.dateOfHireRange.from);
  }
  if (filters?.dateOfHireRange?.to) {
    params.append('dateOfHireRange[to]', filters.dateOfHireRange.to);
  }

  const response = await axiosInstance.get(`/employee-profile?${params.toString()}`);
  return response.data;
};

// Create employee profile
export const createEmployeeProfile = async (data: Partial<EmployeeProfile> & { password?: string }) => {
  // Filter out MongoDB internal fields
  const { _id, __v, createdAt, updatedAt, ...cleanData } = data as any;
  const response = await axiosInstance.post(`/employee-profile`, cleanData);
  return response.data;
};

// Get employee profile by ID
export const getEmployeeProfileById = async (profileId: string, populate?: string[]) => {
  const params = new URLSearchParams();
  if (populate && populate.length > 0) {
    params.append('populate', populate.join(','));
  }
  const response = await axiosInstance.get(`/employee-profile/${profileId}${params.toString() ? '?' + params.toString() : ''}`);
  return response.data;
};

// Update employee profile
export const updateEmployeeProfile = async (profileId: string, data: Partial<EmployeeProfile>) => {
  // Filter out MongoDB internal fields that should not be sent in update requests
  const { _id, __v, createdAt, updatedAt, ...cleanData } = data as any;
  const response = await axiosInstance.put(`/employee-profile/${profileId}`, cleanData);
  return response.data;
};

// Get change requests
export const getChangeRequests = async (status?: string, employeeProfileId?: string) => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (employeeProfileId) params.append('employeeProfileId', employeeProfileId);
  
  const response = await axiosInstance.get(`/employee-profile/change-requests?${params.toString()}`);
  return response.data;
};

// Process change request (approve/reject)
export const processChangeRequest = async (requestId: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
  const response = await axiosInstance.patch(`/employee-profile/change-requests/${requestId}`, {
    status,
    reason,
    processedAt: new Date().toISOString(),
  });
  return response.data;
};

// Archive employee profile
export const archiveEmployeeProfile = async (profileId: string, reason?: string) => {
  const response = await axiosInstance.patch(`/employee-profile/${profileId}/archive`, { reason });
  return response.data;
};

// Reactivate employee profile
export const reactivateEmployeeProfile = async (profileId: string, reason?: string) => {
  const response = await axiosInstance.patch(`/employee-profile/${profileId}/reactivate`, { reason });
  return response.data;
};

// Deactivate employee access
export const deactivateEmployeeAccess = async (profileId: string) => {
  const response = await axiosInstance.patch(`/employee-profile/${profileId}/access/deactivate`);
  return response.data;
};

// Reactivate employee access
export const reactivateEmployeeAccess = async (profileId: string) => {
  const response = await axiosInstance.patch(`/employee-profile/${profileId}/access/reactivate`);
  return response.data;
};

// Get system roles for an employee (via auth service)
export const getEmployeeSystemRoles = async (profileId: string) => {
  try {
    // Try to get roles from the employee profile or use auth service
    // Since there's no direct GET endpoint, we'll use the auth service
    const response = await axiosInstance.get(`/auth/me`);
    // This returns current user's roles, but we need the employee's roles
    // For now, return null and we'll fetch it differently
    return null;
  } catch (err: any) {
    return null;
  }
};

// Assign system roles to an employee
export const assignEmployeeSystemRoles = async (
  profileId: string,
  roles: string[],
  permissions?: string[],
  isActive: boolean = true
) => {
  const response = await axiosInstance.post(`/employee-profile/${profileId}/system-roles`, {
    roles,
    permissions: permissions || [],
    isActive,
  });
  return response.data;
};

// Update system roles for an employee
export const updateEmployeeSystemRoles = async (
  profileId: string,
  roles?: string[],
  permissions?: string[],
  isActive?: boolean
) => {
  const response = await axiosInstance.patch(`/employee-profile/${profileId}/system-roles`, {
    roles,
    permissions,
    isActive,
  });
  return response.data;
};

// Update own employee profile (limited fields)
export const updateMyEmployeeProfile = async (data: {
  personalEmail?: string;
  mobilePhone?: string;
  homePhone?: string;
  gender?: 'MALE' | 'FEMALE';
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
}) => {
  const response = await axiosInstance.patch(`/employee-profile/me`, data);
  return response.data;
};

