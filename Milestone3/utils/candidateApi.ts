import axiosInstance from "./ApiClient";

export interface Candidate {
  _id?: string;
  id?: string;
  candidateNumber?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName?: string;
  nationalId?: string;
  personalEmail?: string;
  mobilePhone?: string;
  homePhone?: string;
  gender?: string;
  maritalStatus?: string;
  dateOfBirth?: string;
  address?: {
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  profilePictureUrl?: string;
  departmentId?: string | any;
  positionId?: string | any;
  applicationDate?: string;
  status?: string;
  resumeUrl?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateCandidateData {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  fullName?: string;
  personalEmail?: string;
  mobilePhone?: string;
  homePhone?: string;
  gender?: string;
  maritalStatus?: string;
  dateOfBirth?: string;
  address?: {
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  profilePictureUrl?: string;
  resumeUrl?: string;
  status?: string;
  applicationDate?: string;
  departmentId?: string;
  positionId?: string;
  notes?: string;
}

export interface CandidateFilter {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  departmentIds?: string[];
  positionIds?: string[];
  search?: string;
}

export interface CreateCandidateData {
  candidateNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  nationalId: string;
  personalEmail?: string;
  mobilePhone?: string;
  homePhone?: string;
  gender?: string;
  maritalStatus?: string;
  dateOfBirth?: string;
  address?: {
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  profilePictureUrl?: string;
  departmentId?: string;
  positionId?: string;
  applicationDate?: string;
  status?: string;
  resumeUrl?: string;
  notes?: string;
}

export const candidateApi = {
  // List all candidates (for recruiters)
  listCandidates: async (filters?: CandidateFilter) => {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    
    if (filters?.departmentIds && filters.departmentIds.length > 0) {
      filters.departmentIds.forEach(id => params.append('departmentIds', id));
    }
    if (filters?.positionIds && filters.positionIds.length > 0) {
      filters.positionIds.forEach(id => params.append('positionIds', id));
    }

    const response = await axiosInstance.get(`/employee-profile/candidates?${params.toString()}`);
    return response.data;
  },

  // Create candidate (for recruiters)
  createCandidate: async (data: CreateCandidateData) => {
    const response = await axiosInstance.post(`/employee-profile/candidates`, data);
    return response.data;
  },

  // Get candidate by ID
  getCandidateById: async (candidateId: string) => {
    const response = await axiosInstance.get(`/employee-profile/candidates/${candidateId}`);
    return response.data;
  },

  // Update candidate (for recruiters)
  updateCandidate: async (candidateId: string, data: UpdateCandidateData) => {
    const response = await axiosInstance.put(`/employee-profile/candidates/${candidateId}`, data);
    return response.data;
  },

  // Update candidate status (for recruiters)
  updateCandidateStatus: async (candidateId: string, status: string, notes?: string) => {
    const response = await axiosInstance.patch(`/employee-profile/candidates/${candidateId}/status`, {
      status,
      notes,
    });
    return response.data;
  },

  // Get own candidate profile by employee profile ID
  getMyCandidateProfileByEmployeeId: async (employeeProfileId: string) => {
    const response = await axiosInstance.get(`/employee-profile/candidates/by-employee-profile/${employeeProfileId}`);
    return response.data;
  },

  // Get own candidate profile by email
  getMyCandidateProfileByEmail: async (email: string) => {
    const response = await axiosInstance.get(`/employee-profile/candidates/by-email/${encodeURIComponent(email)}`);
    return response.data;
  },

  // Get own candidate profile by national ID
  getMyCandidateProfileByNationalId: async (nationalId: string) => {
    const response = await axiosInstance.get(`/employee-profile/candidates/by-national-id/${encodeURIComponent(nationalId)}`);
    return response.data;
  },

  // Update own candidate profile
  updateMyCandidateProfile: async (candidateId: string, data: UpdateCandidateData) => {
    const response = await axiosInstance.put(`/employee-profile/candidates/${candidateId}`, data);
    return response.data;
  },
};

