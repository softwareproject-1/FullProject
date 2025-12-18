import axios from '../lib/axios';
import {
  JobTemplate,
  JobRequisition,
  Application,
  ApplicationStage,
  ApplicationStatus,
  Interview,
  InterviewMethod,
  AssessmentResult,
  Offer,
  Contract,
  Referral,
  HiringStage,
  RecruitmentProgress,
  RequisitionProgress,
  ChecklistTemplate,
  OnboardingTracker,
  ComplianceDocument,
  ComplianceStatus,
  SystemProvisioning,
  AllReservations,
  SignedContractDetails,
  PayrollInitiationResult,
  SigningBonusResult,
  OverdueTask,
  OnboardingTaskStatus,
  TaskCategory,
} from '../lib/types';

// ==================== Auth API ====================
export const authApi = {
  login: (identifier: string, password: string, identifierType: 'workEmail' | 'personalEmail' | 'nationalId' = 'workEmail') =>
    axios.post('/auth/login', { [identifierType]: identifier, password }),

  register: (data: any) =>
    axios.post('/auth/register', data),

  getProfile: () =>
    axios.get('/auth/me'),

  logout: () =>
    axios.post('/auth/logout'),
};

// ==================== Recruitment API ====================
export const recruitmentApi = {
  // ----- REC-003: Job Templates -----
  templates: {
    create: (data: { title: string; department: string; qualifications?: string[]; skills?: string[]; description?: string }) =>
      axios.post<JobTemplate>('/recruitment/templates', data),

    getAll: () =>
      axios.get<JobTemplate[]>('/recruitment/templates'),

    getById: (id: string) =>
      axios.get<JobTemplate>(`/recruitment/templates/${id}`),

    update: (id: string, data: Partial<JobTemplate>) =>
      axios.patch<JobTemplate>(`/recruitment/templates/${id}`, data),

    delete: (id: string) =>
      axios.delete(`/recruitment/templates/${id}`),
  },

  // ----- Organization Structure Integration -----
  positions: {
    getAvailable: () =>
      axios.get('/recruitment/positions'),

    validate: (name: string) =>
      axios.get(`/recruitment/positions/${name}/validate`),
  },

  departments: {
    validate: (name: string) =>
      axios.get(`/recruitment/departments/${name}/validate`),
  },

  // ----- REC-004: Hiring Stages -----
  stages: {
    getAll: () =>
      axios.get<HiringStage[]>('/recruitment/stages'),

    getProgress: (stage: string) =>
      axios.get(`/recruitment/stages/${stage}/progress`),
  },

  // ----- REC-023: Job Requisitions -----
  jobs: {
    create: (data: { requisitionId: string; templateId?: string; openings: number; location?: string; hiringManagerId: string; expiryDate?: string }) =>
      axios.post<JobRequisition>('/recruitment/jobs', data),

    getAll: (status?: 'draft' | 'published' | 'closed') =>
      axios.get<JobRequisition[]>('/recruitment/jobs', { params: status ? { status } : {} }),

    getPublished: () =>
      axios.get<JobRequisition[]>('/recruitment/jobs/published'),

    getById: (id: string) =>
      axios.get<JobRequisition>(`/recruitment/jobs/${id}`),

    preview: (id: string) =>
      axios.get(`/recruitment/jobs/${id}/preview`),

    publish: (id: string) =>
      axios.post<JobRequisition>(`/recruitment/jobs/${id}/publish`),

    close: (id: string) =>
      axios.post<JobRequisition>(`/recruitment/jobs/${id}/close`),

    delete: (id: string) =>
      axios.delete(`/recruitment/jobs/${id}`),

    update: (id: string, data: Partial<JobRequisition>) =>
      axios.patch<JobRequisition>(`/recruitment/jobs/${id}`, data),
  },

  // ----- REC-007: Applications -----
  // ----- Document Upload (REC-007) -----
  documents: {
    uploadCV: (candidateId: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('candidateId', candidateId);
      return axios.post('/recruitment/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },

    getCandidateDocuments: (candidateId: string) =>
      axios.get(`/recruitment/documents/candidate/${candidateId}`),
  },

  applications: {
    create: (data: { candidateId: string; requisitionId: string; assignedHr?: string; resumeUrl?: string }) =>
      axios.post<Application>('/recruitment/applications', data),

    getAll: () =>
      axios.get<Application[]>('/recruitment/applications'),

    getByRequisition: (requisitionId: string) =>
      axios.get<Application[]>('/recruitment/applications', { params: { requisitionId } }),

    getByCandidate: (candidateId: string) =>
      axios.get<Application[]>('/recruitment/applications', { params: { candidateId } }),

    getById: (id: string) =>
      axios.get<Application>(`/recruitment/applications/${id}`),

    getProgress: (id: string) =>
      axios.get(`/recruitment/applications/${id}/progress`),

    // REC-008 & REC-017: Status Tracking
    updateStatus: (id: string, data: { currentStage?: ApplicationStage; status?: ApplicationStatus; changedBy: string; notes?: string }) =>
      axios.patch<Application>(`/recruitment/applications/${id}/status`, data),

    getHistory: (id: string) =>
      axios.get(`/recruitment/applications/${id}/history`),

    // REC-022: Rejection
    reject: (id: string, changedBy: string, reason?: string) =>
      axios.post<Application>(`/recruitment/applications/${id}/reject`, { changedBy, reason }),

    // REC-028: Consent
    submitConsent: (id: string, data: { dataProcessingConsent: boolean; backgroundCheckConsent: boolean; ipAddress?: string; userAgent?: string; consentText?: string }) =>
      axios.post(`/recruitment/applications/${id}/consent`, data),

    getConsent: (id: string) =>
      axios.get(`/recruitment/applications/${id}/consent`),

    verifyConsent: (id: string) =>
      axios.get(`/recruitment/applications/${id}/consent/verify`),

    // Check referral status
    checkReferral: (id: string) =>
      axios.get(`/recruitment/applications/${id}/referral`),
  },

  // ----- REC-010, REC-021: Interviews -----
  interviews: {
    schedule: (data: { applicationId: string; stage: ApplicationStage; scheduledDate: string; method?: InterviewMethod; panel?: string[]; videoLink?: string; calendarEventId?: string }) =>
      axios.post<Interview>('/recruitment/interviews', data),

    getAll: () =>
      axios.get<Interview[]>('/recruitment/interviews'),

    getByApplication: (applicationId: string) =>
      axios.get<Interview[]>('/recruitment/interviews', { params: { applicationId } }),

    getById: (id: string) =>
      axios.get<Interview>(`/recruitment/interviews/${id}`),

    update: (id: string, data: Partial<Interview>) =>
      axios.patch<Interview>(`/recruitment/interviews/${id}`, data),

    cancel: (id: string) =>
      axios.post<Interview>(`/recruitment/interviews/${id}/cancel`),

    complete: (id: string) =>
      axios.post<Interview>(`/recruitment/interviews/${id}/complete`),

    assignPanel: (id: string, panelIds: string[]) =>
      axios.patch<Interview>(`/recruitment/interviews/${id}/panel`, { panelIds }),

    // REC-011, REC-020: Feedback
    submitFeedback: (id: string, data: { interviewerId: string; score: number; comments?: string }) =>
      axios.post<AssessmentResult>(`/recruitment/interviews/${id}/feedback`, data),

    getFeedback: (id: string) =>
      axios.get<AssessmentResult[]>(`/recruitment/interviews/${id}/feedback`),

    getAverageScore: (id: string) =>
      axios.get<{ averageScore: number }>(`/recruitment/interviews/${id}/score`),
  },

  // ----- REC-030: Referrals -----
  referrals: {
    create: (data: { referringEmployeeId: string; candidateId: string; role?: string; level?: string }) =>
      axios.post<Referral>('/recruitment/referrals', data),

    getApplications: (requisitionId?: string) =>
      axios.get<Application[]>('/recruitment/referrals/applications', { params: requisitionId ? { requisitionId } : {} }),

    getByCandidate: (candidateId: string) =>
      axios.get<Referral>(`/recruitment/candidates/${candidateId}/referral`),
  },

  // ----- REC-014: Offers -----
  offers: {
    create: (data: { applicationId: string; grossSalary: number; signingBonus?: number; benefits?: string; offerExpiry?: string; approvers: { employeeId: string; role: string }[] }) =>
      axios.post<Offer>('/recruitment/offers', data),

    getAll: () =>
      axios.get<Offer[]>('/recruitment/offers'),

    getById: (id: string) =>
      axios.get<Offer>(`/recruitment/offers/${id}`),

    getByApplication: (applicationId: string) =>
      axios.get(`/recruitment/applications/${applicationId}/offer`),

    update: (id: string, data: Partial<Offer>) =>
      axios.patch<Offer>(`/recruitment/offers/${id}`, data),

    // Approval workflow
    approve: (id: string, data: { employeeId: string; status: 'approved' | 'rejected'; comment?: string }) =>
      axios.post<Offer>(`/recruitment/offers/${id}/approve`, data),

    getApprovalStatus: (id: string) =>
      axios.get(`/recruitment/offers/${id}/approval-status`),

    // REC-018: E-signed offers
    respond: (id: string, data: { response: 'accepted' | 'rejected' | 'pending'; notes?: string }) =>
      axios.post<Offer>(`/recruitment/offers/${id}/respond`, data),

    sign: (id: string, data: { signerId: string; role: 'candidate' | 'hr' | 'manager' }) =>
      axios.post<Offer>(`/recruitment/offers/${id}/sign`, data),

    getSignatureStatus: (id: string) =>
      axios.get(`/recruitment/offers/${id}/signature-status`),
  },

  // ----- REC-029: Contracts -----
  contracts: {
    create: (offerId: string) =>
      axios.post<Contract>('/recruitment/contracts', { offerId }),

    getAll: () =>
      axios.get<Contract[]>('/recruitment/contracts'),

    getById: (id: string) =>
      axios.get<Contract>(`/recruitment/contracts/${id}`),

    getByOffer: (offerId: string) =>
      axios.get(`/recruitment/offers/${offerId}/contract`),
  },

  // ----- REC-009: Analytics -----
  analytics: {
    getProgress: (requisitionId: string) =>
      axios.get<RecruitmentProgress>(`/recruitment/analytics/progress/${requisitionId}`),

    getAllProgress: () =>
      axios.get<RequisitionProgress[]>('/recruitment/analytics/progress'),
  },
};

// ==================== Employee Profile API ====================
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

// ==================== Time Management API ====================
export const timeManagementApi = {
  getShifts: () =>
    axios.get('/time-management/shifts'),

  createShift: (data: any) =>
    axios.post('/time-management/shifts', data),

  getAttendance: () =>
    axios.get('/time-management/attendance'),

  createAttendance: (data: any) =>
    axios.post('/time-management/attendance', data),

  getTimeExceptions: () =>
    axios.get('/time-management/time-exceptions'),

  createTimeException: (data: any) =>
    axios.post('/time-management/time-exceptions', data),

  getHolidays: () =>
    axios.get('/time-management/holidays'),

  createHoliday: (data: any) =>
    axios.post('/time-management/holidays', data),
};

// ==================== Leaves API ====================
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

// ==================== Payroll Configuration API ====================
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

// ==================== Payroll Execution API ====================
export const payrollExecutionApi = {
  getAll: () =>
    axios.get('/payroll-execution'),

  getById: (id: string) =>
    axios.get(`/payroll-execution/${id}`),

  execute: (data: any) =>
    axios.post('/payroll-execution/execute', data),
};

// ==================== Payroll Tracking API ====================
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

// ==================== Performance API ====================
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

// ==================== Organization Structure API ====================
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

// ==================== Onboarding API ====================
export const onboardingApi = {
  // ----- ONB-001: Checklist Templates -----
  templates: {
    create: (data: {
      name: string;
      departmentId?: string;
      tasks: { name: string; department: string; category?: string; daysFromStart: number; description?: string; priority?: number; requiresDocument?: boolean }[];
      isDefault?: boolean;
    }) => axios.post<ChecklistTemplate>('/onboarding/templates', data),

    getAll: () => axios.get<ChecklistTemplate[]>('/onboarding/templates'),

    getById: (templateId: string) => axios.get<ChecklistTemplate>(`/onboarding/templates/${templateId}`),

    delete: (templateId: string) => axios.delete<{ deleted: boolean; templateId: string }>(`/onboarding/templates/${templateId}`),

    applyToOnboarding: (onboardingId: string, templateId: string, startDate: string) =>
      axios.post<OnboardingTracker>(`/onboarding/tracker/${onboardingId}/apply-template`, { templateId, startDate }),
  },

  // ----- ONB-002: Contract Access & Employee Profile -----
  contracts: {
    getDetails: (contractId: string) => axios.get<SignedContractDetails>(`/onboarding/contracts/${contractId}`),

    createEmployee: (contractId: string, data: {
      department: string;
      position: string;
      startDate: string;
      managerId?: string;
    }) => axios.post(`/onboarding/contracts/${contractId}/create-employee`, data),

    uploadSigned: (contractId: string, data: {
      signatureUrl: string;
      signedAt?: string;
    }) => axios.post(`/onboarding/contracts/${contractId}/upload-signed`, data),
  },

  // ----- ONB-004: Tracker -----
  tracker: {
    getAll: () => axios.get<OnboardingTracker[]>('/onboarding/all'),

    getByOnboardingId: (onboardingId: string) => axios.get<OnboardingTracker>(`/onboarding/tracker/${onboardingId}`),

    getByEmployeeId: (employeeId: string) => axios.get<OnboardingTracker>(`/onboarding/tracker/employee/${employeeId}`),

    updateTaskStatus: (onboardingId: string, taskIndex: number, data: {
      status: OnboardingTaskStatus;
      notes?: string;
    }) => axios.put<OnboardingTracker>(`/onboarding/${onboardingId}/tasks/${taskIndex}/status`, data),

    completeTask: (onboardingId: string, taskIndex: number, data: {
      notes?: string;
      documentId?: string;
    }) => axios.post<OnboardingTracker>(`/onboarding/${onboardingId}/tasks/${taskIndex}/complete`, data),
  },

  // ----- ONB-005: Reminders -----
  reminders: {
    sendTaskReminder: (onboardingId: string, taskIndex: number) =>
      axios.post<{ sent: boolean; message: string }>(`/onboarding/${onboardingId}/tasks/${taskIndex}/remind`),

    getOverdueTasks: () => axios.get<OverdueTask[]>('/onboarding/overdue-tasks'),

    sendBulkReminders: () => axios.post<{ remindersSent: number; tasksReminded: { onboardingId: string; taskIndex: number; taskName: string }[] }>('/onboarding/reminders/send-bulk'),
  },

  // ----- ONB-007: Compliance Documents -----
  documents: {
    // URL-based upload (backward compatibility)
    upload: (data: {
      onboardingId: string;
      documentType: string;
      filePath: string;
      documentName: string;
    }) => axios.post<ComplianceDocument>('/onboarding/documents/upload', data),

    // Actual file upload using FormData
    uploadFile: (file: File, onboardingId: string, documentType: string, documentName?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('onboardingId', onboardingId);
      formData.append('documentType', documentType);
      if (documentName) {
        formData.append('documentName', documentName);
      }
      return axios.post<ComplianceDocument>('/onboarding/documents/upload-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },

    verify: (documentId: string, data: {
      verified: boolean;
      verifiedBy: string;
      rejectionReason?: string;
    }) => axios.post<ComplianceDocument>(`/onboarding/documents/${documentId}/verify`, data),

    getByOnboarding: (onboardingId: string) => axios.get<ComplianceDocument[]>(`/onboarding/${onboardingId}/documents`),

    getComplianceStatus: (onboardingId: string) => axios.get<ComplianceStatus>(`/onboarding/compliance/${onboardingId}`),
  },

  // ----- ONB-009: System Access Provisioning -----
  provisioning: {
    requestAccess: (onboardingId: string, data: {
      systems: string[];
      requestedBy: string;
      priority?: 'low' | 'normal' | 'high';
    }) => axios.post(`/onboarding/${onboardingId}/provision-access`, data),

    getStatus: (onboardingId: string) => axios.get<SystemProvisioning>(`/onboarding/${onboardingId}/provisioning-status`),
  },

  // ----- ONB-012: Equipment/Desk/Access Card Reservations -----
  reservations: {
    reserveEquipment: (onboardingId: string, data: {
      itemName: string;
      quantity?: number;
      notes?: string;
      requestedBy: string;
    }) => axios.post(`/onboarding/${onboardingId}/reserve-equipment`, data),

    reserveDesk: (onboardingId: string, data: {
      building?: string;
      floor?: string;
      preferredLocation?: string;
      requestedBy: string;
    }) => axios.post(`/onboarding/${onboardingId}/reserve-desk`, data),

    reserveAccessCard: (onboardingId: string, data: {
      accessLevel: string;
      areas?: string[];
      requestedBy: string;
    }) => axios.post(`/onboarding/${onboardingId}/reserve-access-card`, data),

    getAll: (onboardingId: string) => axios.get<AllReservations>(`/onboarding/${onboardingId}/reservations`),
  },

  // ----- ONB-013: Automated Provisioning & Revocation -----
  automation: {
    scheduleProvisioning: (onboardingId: string, data: {
      startDate: string;
      systems: string[];
    }) => axios.post<{ scheduled: boolean; scheduledFor: string; systems: string[]; taskId: string }>(`/onboarding/${onboardingId}/schedule-provisioning`, data),



    scheduleRevocation: (data: {
      employeeId: string;
      exitDate: string;
      reason: 'termination' | 'resignation' | 'no_show' | 'contract_cancelled';
      revokeImmediately: boolean;
    }) => axios.post<{ scheduled: boolean; scheduledFor: string; taskId: string }>('/onboarding/schedule-revocation', data),
  },


  // ----- ONB-018: Payroll Initiation -----
  payroll: {
    initiate: (onboardingId: string, data: {
      employeeId: string;
      contractId: string;
      effectiveDate?: string;
    }) => axios.post<PayrollInitiationResult>(`/onboarding/${onboardingId}/initiate-payroll`, data),
  },

  // ----- ONB-019: Signing Bonus -----
  signingBonus: {
    process: (onboardingId: string, data: {
      employeeId: string;
      contractId: string;
      paymentDate?: string;
    }) => axios.post<SigningBonusResult>(`/onboarding/${onboardingId}/process-signing-bonus`, data),
  },

  // ----- Forms Upload -----
  forms: {
    upload: (onboardingId: string, data: {
      formType: string;
      formUrl: string;
      fileName: string;
      taskIndex?: number;
    }) => axios.post(`/onboarding/${onboardingId}/forms/upload`, data),
  },

  // ----- ONB-005: Notifications -----
  notifications: {
    getForRecipient: (recipientId: string) => axios.get<any[]>(`/onboarding/notifications/${recipientId}`),
  },

  // ----- Cancel Onboarding -----
  cancel: (onboardingId: string, data: {
    reason: string;
    cancelledBy: string;
  }) => axios.delete(`/onboarding/${onboardingId}`, { data }),

  // ----- Onboarding Completion / Finalization -----
  finalization: {
    canFinalize: (onboardingId: string) => axios.get<{
      canFinalize: boolean;
      completedTasks: number;
      totalTasks: number;
      pendingTasks: string[];
    }>(`/onboarding/${onboardingId}/can-finalize`),

    finalize: (onboardingId: string) => axios.post<{
      success: boolean;
      employeeId: string;
      previousRole: string;
      newRole: string;
      message: string;
    }>(`/onboarding/${onboardingId}/finalize`),
  },
};
// ==================== Offboarding API ====================
export const offboardingApi = {
  // ----- OFF-001: Termination Review -----
  termination: {
    initiateReview: (data: {
      employeeId: string;
      contractId: string;
      reason: string;
      initiator: 'employee' | 'hr' | 'manager';
      comments?: string;
      notifyUserId?: string;
    }) => axios.post('/recruitment/offboarding/termination/review', data),

    updateStatus: (terminationId: string, data: {
      status: 'pending' | 'under_review' | 'approved' | 'rejected';
      comments?: string;
      terminationDate?: string;
    }) => axios.patch(`/recruitment/offboarding/termination/${terminationId}/status`, data),

    getPending: () =>
      axios.get('/recruitment/offboarding/termination/pending'),

    getByEmployee: (employeeId: string) =>
      axios.get(`/recruitment/offboarding/termination/employee/${employeeId}`),

    getById: (terminationId: string) =>
      axios.get(`/recruitment/offboarding/termination/${terminationId}`),

    getEmployeePerformance: (employeeId: string) =>
      axios.get(`/recruitment/offboarding/termination/employee/${employeeId}/performance`),
  },

  // ----- OFF-018/019: Resignation -----
  resignation: {
    create: (data: {
      employeeId: string;
      contractId: string;
      reason: string;
      requestedLastDay?: string;
      comments?: string;
      hrManagerId?: string;
    }) => axios.post('/recruitment/offboarding/resignation', data),

    getMy: (employeeId: string) =>
      axios.get('/recruitment/offboarding/resignation/my', { params: { employeeId } }),

    getStatus: (resignationId: string, employeeId: string) =>
      axios.get(`/recruitment/offboarding/resignation/${resignationId}`, { params: { employeeId } }),

    review: (resignationId: string, data: {
      status: 'pending' | 'under_review' | 'approved' | 'rejected';
      hrComments?: string;
      approvedLastDay?: string;
    }) => axios.patch(`/recruitment/offboarding/resignation/${resignationId}/review`, data),
  },

  // ----- OFF-006: Offboarding Checklist -----
  checklist: {
    create: (data: {
      terminationId: string;
      departments?: string[];
      hrManagerId?: string;
    }) => axios.post('/recruitment/offboarding/checklist', data),

    addEquipment: (checklistId: string, data: {
      equipment: Array<{ name: string; equipmentId?: string }>;
    }) => axios.post(`/recruitment/offboarding/checklist/${checklistId}/equipment`, data),

    getByTermination: (terminationId: string) =>
      axios.get(`/recruitment/offboarding/checklist/termination/${terminationId}`),
  },

  // ----- OFF-010: Department Clearance -----
  clearance: {
    departmentSignOff: (checklistId: string, userId: string, data: {
      department: string;
      status: 'approved' | 'rejected' | 'pending';
      comments?: string;
    }) => axios.patch(`/recruitment/offboarding/checklist/${checklistId}/signoff`, data, { params: { userId } }),
    
    addEquipment: (checklistId: string, data: {
      name: string;
    }) => axios.post(`/recruitment/offboarding/checklist/${checklistId}/equipment`, { 
      equipment: [{ name: data.name }] 
    }),
    
    updateEquipmentReturn: (checklistId: string, data: {
      equipmentId: string;
      returned: boolean;
      condition?: string;
    }) => axios.patch(`/recruitment/offboarding/checklist/${checklistId}/equipment`, data),

    updateAccessCardReturn: (checklistId: string, data: {
      returned: boolean;
    }) => axios.patch(`/recruitment/offboarding/checklist/${checklistId}/access-card`, data),

    isComplete: (checklistId: string) =>
      axios.get<{ isComplete: boolean }>(`/recruitment/offboarding/checklist/${checklistId}/complete`),
  },

  // ----- OFF-007: Access Revocation -----
  access: {
    scheduleRevocation: (data: {
      employeeId: string;
      revocationDate: string;
      terminationId?: string;
    }) => axios.post('/recruitment/offboarding/access/schedule-revocation', data),

    revokeImmediately: (data: {
      employeeId: string;
      reason: 'termination' | 'resignation' | 'no_show' | 'contract_cancelled';
      terminationId?: string;
    }) => axios.post('/recruitment/offboarding/access/revoke-immediate', data),

    getScheduledRevocations: () =>
      axios.get('/recruitment/offboarding/access/scheduled-revocations'),
  },

  // ----- OFF-013: Final Settlement -----
  settlement: {
    getTermination: (terminationId: string) =>
      axios.get(`/recruitment/offboarding/settlement/termination/${terminationId}`),

    getPending: () =>
      axios.get('/recruitment/offboarding/settlement/pending'),

    getLeaveBalance: (employeeId: string) =>
      axios.get(`/recruitment/offboarding/settlement/employee/${employeeId}/leave-balance`),

    getEmployeeContext: (employeeId: string) =>
      axios.get(`/recruitment/offboarding/settlement/employee/${employeeId}/context`),

    getComplete: (terminationId: string) =>
      axios.get(`/recruitment/offboarding/settlement/${terminationId}/complete`),

    trigger: (terminationId: string, data: {
      triggeredBy: string;
      notes?: string;
    }) => axios.post(`/recruitment/offboarding/settlement/${terminationId}/trigger`, data),
  },
};