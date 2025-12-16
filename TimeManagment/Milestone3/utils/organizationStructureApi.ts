import axiosInstance from './ApiClient';

export interface Department {
  _id: string;
  code: string;
  name: string;
  description?: string;
  headPositionId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Position {
  _id: string;
  code: string;
  title: string;
  description?: string;
  departmentId: string;
  reportsToPositionId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StructureChangeRequest {
  _id: string;
  requestId: string;
  requestType: string;
  status: string;
  description?: string;
  departmentId?: string;
  positionId?: string;
  changes?: any;
  submittedBy?: string;
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Department APIs
export const getAllDepartments = async () => {
  const response = await axiosInstance.get('/organization-structure/departments');
  return response.data;
};

export const getDepartmentById = async (departmentId: string) => {
  const response = await axiosInstance.get(`/organization-structure/departments/${departmentId}`);
  return response.data;
};

export const getDepartmentByName = async (departmentName: string) => {
  const response = await axiosInstance.get(`/organization-structure/departments/by-name/${encodeURIComponent(departmentName)}`);
  return response.data;
};

export const createDepartment = async (data: {
  code: string;
  name: string;
  description?: string;
  headPositionId?: string;
}) => {
  const response = await axiosInstance.post('/organization-structure/departments', data);
  return response.data;
};

export const updateDepartment = async (departmentId: string, data: {
  name?: string;
  description?: string;
  headPositionId?: string;
}) => {
  // Filter out MongoDB internal fields
  const { _id, __v, createdAt, updatedAt, ...cleanData } = data as any;
  const response = await axiosInstance.patch(`/organization-structure/departments/${departmentId}`, cleanData);
  return response.data;
};

export const deactivateDepartment = async (departmentId: string, reason?: string) => {
  const response = await axiosInstance.patch(`/organization-structure/departments/${departmentId}/deactivate`, {
    reason: reason || 'Deactivated by System Admin',
  });
  return response.data;
};

export const reactivateDepartment = async (departmentId: string, reason?: string) => {
  const response = await axiosInstance.patch(`/organization-structure/departments/${departmentId}/reactivate`, {
    reason: reason || 'Reactivated by System Admin',
  });
  return response.data;
};

// Position APIs
export const getAllPositions = async (names?: string[]) => {
  const params = names && names.length > 0 ? `?names=${names.join(',')}` : '';
  const response = await axiosInstance.get(`/organization-structure/positions${params}`);
  return response.data;
};

export const getPositionById = async (positionId: string) => {
  const response = await axiosInstance.get(`/organization-structure/positions/${positionId}`);
  return response.data;
};

export const getPositionByName = async (positionName: string) => {
  const response = await axiosInstance.get(`/organization-structure/positions/by-name/${encodeURIComponent(positionName)}`);
  return response.data;
};

export const createPosition = async (data: {
  code: string;
  title: string;
  description?: string;
  departmentId?: string;
  departmentName?: string;
  reportsToPositionId?: string;
}) => {
  const response = await axiosInstance.post('/organization-structure/positions', data);
  return response.data;
};

export const updatePosition = async (positionId: string, data: {
  title?: string;
  description?: string;
  departmentId?: string;
  departmentName?: string;
  reportsToPositionId?: string;
  isActive?: boolean;
}) => {
  // Filter out MongoDB internal fields
  const { _id, __v, createdAt, updatedAt, ...cleanData } = data as any;
  const response = await axiosInstance.patch(`/organization-structure/positions/${positionId}`, cleanData);
  return response.data;
};

export const deactivatePosition = async (positionId: string, reason?: string) => {
  const response = await axiosInstance.patch(`/organization-structure/positions/${positionId}/deactivate`, {
    reason: reason || 'Deactivated by System Admin',
  });
  return response.data;
};

export const reactivatePosition = async (positionId: string, reason?: string) => {
  const response = await axiosInstance.patch(`/organization-structure/positions/${positionId}/reactivate`, {
    reason: reason || 'Reactivated by System Admin',
  });
  return response.data;
};

// Change Request APIs
export const createStructureChangeRequest = async (data: {
  requestType: string;
  description?: string;
  departmentId?: string;
  positionId?: string;
  changes?: any;
}) => {
  const response = await axiosInstance.post('/organization-structure/change-requests', data);
  return response.data;
};

export const submitStructureChangeRequest = async (requestId: string, data: {
  submittedBy?: string;
}) => {
  const response = await axiosInstance.post(`/organization-structure/change-requests/${requestId}/submit`, data);
  return response.data;
};

export const updateStructureRequestStatus = async (requestId: string, data: {
  status: string;
  summary?: string;
  performedByEmployeeId?: string;
}) => {
  const response = await axiosInstance.patch(`/organization-structure/change-requests/${requestId}/status`, data);
  return response.data;
};

export const recordApprovalDecision = async (requestId: string, data: {
  decision: 'APPROVED' | 'REJECTED';
  approverId: string;
  comments?: string;
}) => {
  const response = await axiosInstance.post(`/organization-structure/change-requests/${requestId}/approvals`, data);
  return response.data;
};

