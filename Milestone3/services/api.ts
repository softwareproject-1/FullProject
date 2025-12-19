import axiosInstance from '@/utils/ApiClient';

// Import types from lib/types
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
} from '@/lib/types';

// ============================================================
// TYPE DEFINITIONS (Payroll Tracking)
// ============================================================

export interface PayslipDto {
    _id: string;
    employee: string;
    payrollRun?: string;
    createdAt: string;
    updatedAt?: string;

    // Gross Salary Components
    totalGrossSalary: number;
    baseSalary?: number;
    overtime?: number;
    allowances?: number;
    bonuses?: number;
    leaveEncashment?: number;
    transportAllowance?: number;

    // Deductions
    totalDeductions: number;
    taxDeductions?: number;
    insuranceDeductions?: number;
    misconductDeductions?: number;
    unpaidLeaveDeductions?: number;

    // Net Pay
    netPay: number;

    // Status
    paymentStatus: 'PAID' | 'PENDING' | 'DISPUTED' | 'PROCESSING';

    // Employer Contributions
    employerContributions?: {
        insurance?: number;
        pension?: number;
        socialSecurity?: number;
        total?: number;
    };

    // Additional Details
    taxRuleApplied?: string;
    insuranceRuleApplied?: string;
    payPeriod?: string;
}

export interface ExpenseClaimDto {
    _id: string;
    claimId: string;
    employee: string;
    employeeId?: string;
    employeeName?: string;
    description: string;
    claimType: string;
    amount: number;
    receipts?: Array<{ filename: string; url: string }>;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID' | 'UNDER_REVIEW' | 'PENDING_MANAGER_APPROVAL' | string;

    createdAt: string;
    updatedAt?: string;
    submittedAt?: string;
    rejectionReason?: string;
    reviewedBy?: string;
    reviewedAt?: string;
    reviewComment?: string;
    paymentDate?: string;
    specialistDecision?: string;
    specialistReviewedAt?: string;
    specialistComments?: string;
    managerReviewedAt?: string;
    managerComments?: string;
    processedAt?: string;
}

export interface CreateClaimDto {
    amount: number;
    description: string;
    claimType: string;
}

export interface DisputeDto {
    _id: string;
    employee: string;
    employeeName?: string;
    payslip?: string;
    payslipId?: string;
    description: string;
    reason?: string;
    category?: string;
    status: 'PENDING' | 'RESOLVED' | 'REJECTED' | 'INVESTIGATING' | 'APPROVED' | string;
    createdAt: string;
    updatedAt?: string;
    submittedAt?: string;
    resolvedBy?: string;
    resolvedAt?: string;
    resolution?: string;
    refundAmount?: number;
    amount?: number;
    specialistDecision?: string;
    specialistReviewedAt?: string;
    specialistComments?: string;
    managerReviewedAt?: string;
    managerComments?: string;
    processedAt?: string;
}

export interface CreateDisputeDto {
    payslipId: string;
    description: string;
}

export interface ReportFiltersDto {
    startDate: string;
    endDate: string;
    departmentId?: string;
    department?: string;
}

export interface SalaryHistoryDto {
    month: string;
    year: number;
    grossSalary: number;
    netPay: number;
    totalDeductions: number;
    paymentStatus: string;
    payslipId: string;
}

export interface TaxDocumentDto {
    year: number;
    totalIncome: number;
    totalTax: number;
    documentUrl?: string;
}

export interface InsuranceCertificateDto {
    year: number;
    totalContributions: number;
    documentUrl?: string;
}

// ==================== TIME MANAGEMENT INTEGRATION ====================
export enum PenaltyType {
    UNAPPROVED_ABSENCE = 'UNAPPROVED_ABSENCE',
    LATE = 'LATE',
    EARLY_LEAVE = 'EARLY_LEAVE',
    MISCONDUCT = 'MISCONDUCT',
}

export enum TimeItemStatus {
    FINALIZED = 'FINALIZED',
    DISPUTED = 'DISPUTED',
    PENDING_CORRECTION = 'PENDING_CORRECTION',
}

export enum OvertimeRateType {
    DAYTIME = 'DAYTIME',
    NIGHTTIME = 'NIGHTTIME',
    WEEKLY_REST = 'WEEKLY_REST',
    OFFICIAL_HOLIDAY = 'OFFICIAL_HOLIDAY',
}

export interface PenaltyItemDto {
    id: string;
    date: string;
    type: PenaltyType;
    reason: string;
    amount: number;
    minutesLate?: number;
    status: TimeItemStatus;
    attendanceRecordId: string;
    exceptionId?: string;
}

export interface OvertimeItemDto {
    id: string;
    date: string;
    hoursWorked: number;
    rate: number;
    rateType: OvertimeRateType;
    compensation: number;
    status: string;
}

export interface PermissionItemDto {
    id: string;
    date: string;
    hours: number;
    type: 'PAID' | 'UNPAID';
    reason?: string;
    limitExceeded: boolean;
}

export interface TimeImpactDataDto {
    employeeId: string;
    month: number;
    year: number;
    penalties: PenaltyItemDto[];
    totalPenalties: number;
    overtime: OvertimeItemDto[];
    totalOvertimeCompensation: number;
    permissions: PermissionItemDto[];
    paidPermissions: number;
    unpaidPermissions: number;
    minimumWageAlert: boolean;
    projectedNetPay: number;
    minimumWage: number;
    hasDisputedItems: boolean;
    disputedItemIds: string[];
}

// ==================== ENHANCED PAYSLIP (Itemized) ====================

export interface AllowanceLineItemDto {
    id: string;
    name: string;
    amount: number;
}

export interface TaxBracketInfoDto {
    minIncome: number;
    maxIncome: number;
    rate: number;
}

export interface TaxLineItemDto {
    id: string;
    name: string;
    amount: number;
    lawReference: string;
    bracket?: TaxBracketInfoDto;
}

export interface InsuranceLineItemDto {
    id: string;
    name: string;
    employeeContribution: number;
    employerContribution: number;
    totalContribution: number;
}

export interface LeaveDeductionDto {
    unpaidDays: number;
    deductionAmount: number;
    calculationFormula: string;
}

export interface EnhancedPayslipDataDto {
    payslipId: string;
    month: string;
    year: number;
    employeeName: string;
    payGrade?: string;

    baseSalary: number;
    allowances: AllowanceLineItemDto[];
    totalAllowances: number;
    overtimeCompensation: number;
    leaveEncashment?: number;
    grossPay: number;

    taxDeductions: TaxLineItemDto[];
    totalTax: number;
    insuranceDeductions: InsuranceLineItemDto[];
    totalInsurance: number;
    leaveDeductions?: LeaveDeductionDto;
    timeBasedPenalties: number;
    totalDeductions: number;

    netPay: number;

    minimumWage: number;
    minimumWageAlert: boolean;

    employerContributions: InsuranceLineItemDto[];
    totalEmployerContributions: number;

    disputeEligibleItems: string[];
}


// ============================================================
// AUTH API (Optional convenience wrapper - doesn't replace AuthContext)
// ============================================================

export const authApi = {
    login: (identifier: string, password: string, identifierType: 'workEmail' | 'personalEmail' | 'nationalId' = 'workEmail') =>
        axiosInstance.post('/auth/login', { [identifierType]: identifier, password }),

    register: (data: any) =>
        axiosInstance.post('/auth/register', data),

    getProfile: () =>
        axiosInstance.get('/auth/me'),

    logout: () =>
        axiosInstance.post('/auth/logout'),
};

// ============================================================
// RECRUITMENT API
// ============================================================

export const recruitmentApi = {
    // ----- REC-003: Job Templates -----
    templates: {
        create: (data: { title: string; department: string; qualifications?: string[]; skills?: string[]; description?: string }) =>
            axiosInstance.post<JobTemplate>('/recruitment/templates', data),

        getAll: () =>
            axiosInstance.get<JobTemplate[]>('/recruitment/templates'),

        getById: (id: string) =>
            axiosInstance.get<JobTemplate>(`/recruitment/templates/${id}`),

        update: (id: string, data: Partial<JobTemplate>) =>
            axiosInstance.patch<JobTemplate>(`/recruitment/templates/${id}`, data),

        delete: (id: string) =>
            axiosInstance.delete(`/recruitment/templates/${id}`),
    },

    // ----- Organization Structure Integration -----
    positions: {
        getAvailable: () =>
            axiosInstance.get('/recruitment/positions'),

        validate: (name: string) =>
            axiosInstance.get(`/recruitment/positions/${name}/validate`),
    },

    departments: {
        validate: (name: string) =>
            axiosInstance.get(`/recruitment/departments/${name}/validate`),
    },

    // ----- REC-004: Hiring Stages -----
    stages: {
        getAll: () =>
            axiosInstance.get<HiringStage[]>('/recruitment/stages'),

        getProgress: (stage: string) =>
            axiosInstance.get(`/recruitment/stages/${stage}/progress`),
    },

    // ----- REC-023: Job Requisitions -----
    jobs: {
        create: (data: { requisitionId: string; templateId?: string; openings: number; location?: string; hiringManagerId: string; expiryDate?: string }) =>
            axiosInstance.post<JobRequisition>('/recruitment/jobs', data),

        getAll: (status?: 'draft' | 'published' | 'closed') =>
            axiosInstance.get<JobRequisition[]>('/recruitment/jobs', { params: status ? { status } : {} }),

        getPublished: () =>
            axiosInstance.get<JobRequisition[]>('/recruitment/jobs/published'),

        getById: (id: string) =>
            axiosInstance.get<JobRequisition>(`/recruitment/jobs/${id}`),

        preview: (id: string) =>
            axiosInstance.get(`/recruitment/jobs/${id}/preview`),

        publish: (id: string) =>
            axiosInstance.post<JobRequisition>(`/recruitment/jobs/${id}/publish`),

        close: (id: string) =>
            axiosInstance.post<JobRequisition>(`/recruitment/jobs/${id}/close`),

        delete: (id: string) =>
            axiosInstance.delete(`/recruitment/jobs/${id}`),

        update: (id: string, data: Partial<JobRequisition>) =>
            axiosInstance.patch<JobRequisition>(`/recruitment/jobs/${id}`, data),
    },

    // ----- Document Upload (REC-007) -----
    documents: {
        uploadCV: (candidateId: string, file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('candidateId', candidateId);
            return axiosInstance.post('/recruitment/documents/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },

        getCandidateDocuments: (candidateId: string) =>
            axiosInstance.get(`/recruitment/documents/candidate/${candidateId}`),
    },

    // ----- REC-007: Applications -----
    applications: {
        create: (data: { candidateId: string; requisitionId: string; assignedHr?: string; resumeUrl?: string }) =>
            axiosInstance.post<Application>('/recruitment/applications', data),

        getAll: () =>
            axiosInstance.get<Application[]>('/recruitment/applications'),

        getByRequisition: (requisitionId: string) =>
            axiosInstance.get<Application[]>('/recruitment/applications', { params: { requisitionId } }),

        getByCandidate: (candidateId: string) =>
            axiosInstance.get<Application[]>('/recruitment/applications', { params: { candidateId } }),

        getById: (id: string) =>
            axiosInstance.get<Application>(`/recruitment/applications/${id}`),

        getProgress: (id: string) =>
            axiosInstance.get(`/recruitment/applications/${id}/progress`),

        updateStatus: (id: string, data: { currentStage?: ApplicationStage; status?: ApplicationStatus; changedBy: string; notes?: string }) =>
            axiosInstance.patch<Application>(`/recruitment/applications/${id}/status`, data),

        getHistory: (id: string) =>
            axiosInstance.get(`/recruitment/applications/${id}/history`),

        reject: (id: string, changedBy: string, reason?: string) =>
            axiosInstance.post<Application>(`/recruitment/applications/${id}/reject`, { changedBy, reason }),

        submitConsent: (id: string, data: { dataProcessingConsent: boolean; backgroundCheckConsent: boolean; ipAddress?: string; userAgent?: string; consentText?: string }) =>
            axiosInstance.post(`/recruitment/applications/${id}/consent`, data),

        getConsent: (id: string) =>
            axiosInstance.get(`/recruitment/applications/${id}/consent`),

        verifyConsent: (id: string) =>
            axiosInstance.get(`/recruitment/applications/${id}/consent/verify`),

        checkReferral: (id: string) =>
            axiosInstance.get(`/recruitment/applications/${id}/referral`),
    },

    // ----- REC-010, REC-021: Interviews -----
    interviews: {
        schedule: (data: { applicationId: string; stage: ApplicationStage; scheduledDate: string; method?: InterviewMethod; panel?: string[]; videoLink?: string; calendarEventId?: string }) =>
            axiosInstance.post<Interview>('/recruitment/interviews', data),

        getAll: () =>
            axiosInstance.get<Interview[]>('/recruitment/interviews'),

        getByApplication: (applicationId: string) =>
            axiosInstance.get<Interview[]>('/recruitment/interviews', { params: { applicationId } }),

        getById: (id: string) =>
            axiosInstance.get<Interview>(`/recruitment/interviews/${id}`),

        update: (id: string, data: Partial<Interview>) =>
            axiosInstance.patch<Interview>(`/recruitment/interviews/${id}`, data),

        cancel: (id: string) =>
            axiosInstance.post<Interview>(`/recruitment/interviews/${id}/cancel`),

        complete: (id: string) =>
            axiosInstance.post<Interview>(`/recruitment/interviews/${id}/complete`),

        assignPanel: (id: string, panelIds: string[]) =>
            axiosInstance.patch<Interview>(`/recruitment/interviews/${id}/panel`, { panelIds }),

        submitFeedback: (id: string, data: { interviewerId: string; score: number; comments?: string }) =>
            axiosInstance.post<AssessmentResult>(`/recruitment/interviews/${id}/feedback`, data),

        getFeedback: (id: string) =>
            axiosInstance.get<AssessmentResult[]>(`/recruitment/interviews/${id}/feedback`),

        getAverageScore: (id: string) =>
            axiosInstance.get<{ averageScore: number }>(`/recruitment/interviews/${id}/score`),
    },

    // ----- REC-030: Referrals -----
    referrals: {
        create: (data: { referringEmployeeId: string; candidateId: string; role?: string; level?: string }) =>
            axiosInstance.post<Referral>('/recruitment/referrals', data),

        getApplications: (requisitionId?: string) =>
            axiosInstance.get<Application[]>('/recruitment/referrals/applications', { params: requisitionId ? { requisitionId } : {} }),

        getByCandidate: (candidateId: string) =>
            axiosInstance.get<Referral>(`/recruitment/candidates/${candidateId}/referral`),
    },

    // ----- REC-014: Offers -----
    offers: {
        create: (data: { applicationId: string; grossSalary: number; signingBonus?: number; benefits?: string; offerExpiry?: string; approvers: { employeeId: string; role: string }[] }) =>
            axiosInstance.post<Offer>('/recruitment/offers', data),

        getAll: () =>
            axiosInstance.get<Offer[]>('/recruitment/offers'),

        getById: (id: string) =>
            axiosInstance.get<Offer>(`/recruitment/offers/${id}`),

        getByApplication: (applicationId: string) =>
            axiosInstance.get(`/recruitment/applications/${applicationId}/offer`),

        update: (id: string, data: Partial<Offer>) =>
            axiosInstance.patch<Offer>(`/recruitment/offers/${id}`, data),

        approve: (id: string, data: { employeeId: string; status: 'approved' | 'rejected'; comment?: string }) =>
            axiosInstance.post<Offer>(`/recruitment/offers/${id}/approve`, data),

        getApprovalStatus: (id: string) =>
            axiosInstance.get(`/recruitment/offers/${id}/approval-status`),

        respond: (id: string, data: { response: 'accepted' | 'rejected' | 'pending'; notes?: string }) =>
            axiosInstance.post<Offer>(`/recruitment/offers/${id}/respond`, data),

        sign: (id: string, data: { signerId: string; role: 'candidate' | 'hr' | 'manager' }) =>
            axiosInstance.post<Offer>(`/recruitment/offers/${id}/sign`, data),

        getSignatureStatus: (id: string) =>
            axiosInstance.get(`/recruitment/offers/${id}/signature-status`),
    },

    // ----- REC-029: Contracts -----
    contracts: {
        create: (offerId: string) =>
            axiosInstance.post<Contract>('/recruitment/contracts', { offerId }),

        getAll: () =>
            axiosInstance.get<Contract[]>('/recruitment/contracts'),

        getById: (id: string) =>
            axiosInstance.get<Contract>(`/recruitment/contracts/${id}`),

        getByOffer: (offerId: string) =>
            axiosInstance.get(`/recruitment/offers/${offerId}/contract`),
    },

    // ----- REC-009: Analytics -----
    analytics: {
        getProgress: (requisitionId: string) =>
            axiosInstance.get<RecruitmentProgress>(`/recruitment/analytics/progress/${requisitionId}`),

        getAllProgress: () =>
            axiosInstance.get<RequisitionProgress[]>('/recruitment/analytics/progress'),
    },
};

// ============================================================
// ONBOARDING API
// ============================================================

export const onboardingApi = {
    // ----- ONB-001: Checklist Templates -----
    templates: {
        create: (data: {
            name: string;
            departmentId?: string;
            tasks: { name: string; department: string; category?: string; daysFromStart: number; description?: string; priority?: number; requiresDocument?: boolean }[];
            isDefault?: boolean;
        }) => axiosInstance.post<ChecklistTemplate>('/onboarding/templates', data),

        getAll: () => axiosInstance.get<ChecklistTemplate[]>('/onboarding/templates'),

        getById: (templateId: string) => axiosInstance.get<ChecklistTemplate>(`/onboarding/templates/${templateId}`),

        delete: (templateId: string) => axiosInstance.delete<{ deleted: boolean; templateId: string }>(`/onboarding/templates/${templateId}`),

        applyToOnboarding: (onboardingId: string, templateId: string, startDate: string) =>
            axiosInstance.post<OnboardingTracker>(`/onboarding/tracker/${onboardingId}/apply-template`, { templateId, startDate }),
    },

    // ----- ONB-002: Contract Access & Employee Profile -----
    contracts: {
        getDetails: (contractId: string) => axiosInstance.get<SignedContractDetails>(`/onboarding/contracts/${contractId}`),

        createEmployee: (contractId: string, data: {
            department: string;
            position: string;
            startDate: string;
            managerId?: string;
        }) => axiosInstance.post(`/onboarding/contracts/${contractId}/create-employee`, data),

        uploadSigned: (contractId: string, data: {
            signatureUrl: string;
            signedAt?: string;
        }) => axiosInstance.post(`/onboarding/contracts/${contractId}/upload-signed`, data),
    },

    // ----- ONB-004: Tracker -----
    tracker: {
        getAll: () => axiosInstance.get<OnboardingTracker[]>('/onboarding/all'),

        getByOnboardingId: (onboardingId: string) => axiosInstance.get<OnboardingTracker>(`/onboarding/tracker/${onboardingId}`),

        getByEmployeeId: (employeeId: string) => axiosInstance.get<OnboardingTracker>(`/onboarding/tracker/employee/${employeeId}`),

        updateTaskStatus: (onboardingId: string, taskIndex: number, data: {
            status: OnboardingTaskStatus;
            notes?: string;
        }) => axiosInstance.put<OnboardingTracker>(`/onboarding/${onboardingId}/tasks/${taskIndex}/status`, data),

        completeTask: (onboardingId: string, taskIndex: number, data: {
            notes?: string;
            documentId?: string;
        }) => axiosInstance.post<OnboardingTracker>(`/onboarding/${onboardingId}/tasks/${taskIndex}/complete`, data),
    },

    // ----- ONB-005: Reminders -----
    reminders: {
        sendTaskReminder: (onboardingId: string, taskIndex: number) =>
            axiosInstance.post<{ sent: boolean; message: string }>(`/onboarding/${onboardingId}/tasks/${taskIndex}/remind`),

        getOverdueTasks: () => axiosInstance.get<OverdueTask[]>('/onboarding/overdue-tasks'),

        sendBulkReminders: () => axiosInstance.post<{ remindersSent: number; tasksReminded: { onboardingId: string; taskIndex: number; taskName: string }[] }>('/onboarding/reminders/send-bulk'),
    },

    // ----- ONB-007: Compliance Documents -----
    documents: {
        upload: (data: {
            onboardingId: string;
            documentType: string;
            filePath: string;
            documentName: string;
        }) => axiosInstance.post<ComplianceDocument>('/onboarding/documents/upload', data),

        uploadFile: (file: File, onboardingId: string, documentType: string, documentName?: string) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('onboardingId', onboardingId);
            formData.append('documentType', documentType);
            if (documentName) {
                formData.append('documentName', documentName);
            }
            return axiosInstance.post<ComplianceDocument>('/onboarding/documents/upload-file', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        },

        verify: (documentId: string, data: {
            verified: boolean;
            verifiedBy: string;
            rejectionReason?: string;
        }) => axiosInstance.post<ComplianceDocument>(`/onboarding/documents/${documentId}/verify`, data),

        getByOnboarding: (onboardingId: string) => axiosInstance.get<ComplianceDocument[]>(`/onboarding/${onboardingId}/documents`),

        getComplianceStatus: (onboardingId: string) => axiosInstance.get<ComplianceStatus>(`/onboarding/compliance/${onboardingId}`),
    },

    // ----- ONB-009: System Access Provisioning -----
    provisioning: {
        requestAccess: (onboardingId: string, data: {
            systems: string[];
            requestedBy: string;
            priority?: 'low' | 'normal' | 'high';
        }) => axiosInstance.post(`/onboarding/${onboardingId}/provision-access`, data),

        getStatus: (onboardingId: string) => axiosInstance.get<SystemProvisioning>(`/onboarding/${onboardingId}/provisioning-status`),
    },

    // ----- ONB-012: Equipment/Desk/Access Card Reservations -----
    reservations: {
        reserveEquipment: (onboardingId: string, data: {
            itemName: string;
            quantity?: number;
            notes?: string;
            requestedBy: string;
        }) => axiosInstance.post(`/onboarding/${onboardingId}/reserve-equipment`, data),

        reserveDesk: (onboardingId: string, data: {
            building?: string;
            floor?: string;
            preferredLocation?: string;
            requestedBy: string;
        }) => axiosInstance.post(`/onboarding/${onboardingId}/reserve-desk`, data),

        reserveAccessCard: (onboardingId: string, data: {
            accessLevel: string;
            areas?: string[];
            requestedBy: string;
        }) => axiosInstance.post(`/onboarding/${onboardingId}/reserve-access-card`, data),

        getAll: (onboardingId: string) => axiosInstance.get<AllReservations>(`/onboarding/${onboardingId}/reservations`),
    },

    // ----- ONB-013: Automated Provisioning & Revocation -----
    automation: {
        scheduleProvisioning: (onboardingId: string, data: {
            startDate: string;
            systems: string[];
        }) => axiosInstance.post<{ scheduled: boolean; scheduledFor: string; systems: string[]; taskId: string }>(`/onboarding/${onboardingId}/schedule-provisioning`, data),

        scheduleRevocation: (data: {
            employeeId: string;
            exitDate: string;
            reason: 'termination' | 'resignation' | 'no_show' | 'contract_cancelled';
            revokeImmediately: boolean;
        }) => axiosInstance.post<{ scheduled: boolean; scheduledFor: string; taskId: string }>('/onboarding/schedule-revocation', data),
    },

    // ----- ONB-018: Payroll Initiation -----
    payroll: {
        initiate: (onboardingId: string, data: {
            employeeId: string;
            contractId: string;
            effectiveDate?: string;
        }) => axiosInstance.post<PayrollInitiationResult>(`/onboarding/${onboardingId}/initiate-payroll`, data),
    },

    // ----- ONB-019: Signing Bonus -----
    signingBonus: {
        process: (onboardingId: string, data: {
            employeeId: string;
            contractId: string;
            paymentDate?: string;
        }) => axiosInstance.post<SigningBonusResult>(`/onboarding/${onboardingId}/process-signing-bonus`, data),
    },

    // ----- Forms Upload -----
    forms: {
        upload: (onboardingId: string, data: {
            formType: string;
            formUrl: string;
            fileName: string;
            taskIndex?: number;
        }) => axiosInstance.post(`/onboarding/${onboardingId}/forms/upload`, data),
    },

    // ----- ONB-005: Notifications -----
    notifications: {
        getForRecipient: (recipientId: string) => axiosInstance.get<any[]>(`/onboarding/notifications/${recipientId}`),
    },

    // ----- Cancel Onboarding -----
    cancel: (onboardingId: string, data: {
        reason: string;
        cancelledBy: string;
    }) => axiosInstance.delete(`/onboarding/${onboardingId}`, { data }),

    // ----- Onboarding Completion / Finalization -----
    finalization: {
        canFinalize: (onboardingId: string) => axiosInstance.get<{
            canFinalize: boolean;
            completedTasks: number;
            totalTasks: number;
            pendingTasks: string[];
        }>(`/onboarding/${onboardingId}/can-finalize`),

        finalize: (onboardingId: string) => axiosInstance.post<{
            success: boolean;
            employeeId: string;
            previousRole: string;
            newRole: string;
            message: string;
        }>(`/onboarding/${onboardingId}/finalize`),
    },
};

// ============================================================
// OFFBOARDING API
// ============================================================

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
        }) => axiosInstance.post('/recruitment/offboarding/termination/review', data),

        updateStatus: (terminationId: string, data: {
            status: 'pending' | 'under_review' | 'approved' | 'rejected';
            comments?: string;
            terminationDate?: string;
        }) => axiosInstance.patch(`/recruitment/offboarding/termination/${terminationId}/status`, data),

        getPending: () =>
            axiosInstance.get('/recruitment/offboarding/termination/pending'),

        getByEmployee: (employeeId: string) =>
            axiosInstance.get(`/recruitment/offboarding/termination/employee/${employeeId}`),

        getById: (terminationId: string) =>
            axiosInstance.get(`/recruitment/offboarding/termination/${terminationId}`),

        getEmployeePerformance: (employeeId: string) =>
            axiosInstance.get(`/recruitment/offboarding/termination/employee/${employeeId}/performance`),
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
        }) => axiosInstance.post('/recruitment/offboarding/resignation', data),

        getMy: (employeeId: string) =>
            axiosInstance.get('/recruitment/offboarding/resignation/my', { params: { employeeId } }),

        getStatus: (resignationId: string, employeeId: string) =>
            axiosInstance.get(`/recruitment/offboarding/resignation/${resignationId}`, { params: { employeeId } }),

        review: (resignationId: string, data: {
            status: 'pending' | 'under_review' | 'approved' | 'rejected';
            hrComments?: string;
            approvedLastDay?: string;
        }) => axiosInstance.patch(`/recruitment/offboarding/resignation/${resignationId}/review`, data),
    },

    // ----- OFF-006: Offboarding Checklist -----
    checklist: {
        create: (data: {
            terminationId: string;
            departments?: string[];
            hrManagerId?: string;
        }) => axiosInstance.post('/recruitment/offboarding/checklist', data),

        addEquipment: (checklistId: string, data: {
            equipment: Array<{ name: string; equipmentId?: string }>;
        }) => axiosInstance.post(`/recruitment/offboarding/checklist/${checklistId}/equipment`, data),

        getByTermination: (terminationId: string) =>
            axiosInstance.get(`/recruitment/offboarding/checklist/termination/${terminationId}`),
    },

    // ----- OFF-010: Department Clearance -----
    clearance: {
        departmentSignOff: (checklistId: string, userId: string, data: {
            department: string;
            status: 'approved' | 'rejected' | 'pending';
            comments?: string;
        }) => axiosInstance.patch(`/recruitment/offboarding/checklist/${checklistId}/signoff`, data, { params: { userId } }),

        addEquipment: (checklistId: string, data: {
            name: string;
        }) => axiosInstance.post(`/recruitment/offboarding/checklist/${checklistId}/equipment`, {
            equipment: [{ name: data.name }]
        }),

        updateEquipmentReturn: (checklistId: string, data: {
            equipmentId: string;
            returned: boolean;
            condition?: string;
        }) => axiosInstance.patch(`/recruitment/offboarding/checklist/${checklistId}/equipment`, data),

        updateAccessCardReturn: (checklistId: string, data: {
            returned: boolean;
        }) => axiosInstance.patch(`/recruitment/offboarding/checklist/${checklistId}/access-card`, data),

        isComplete: (checklistId: string) =>
            axiosInstance.get<{ isComplete: boolean }>(`/recruitment/offboarding/checklist/${checklistId}/complete`),
    },

    // ----- OFF-007: Access Revocation -----
    access: {
        scheduleRevocation: (data: {
            employeeId: string;
            revocationDate: string;
            terminationId?: string;
        }) => axiosInstance.post('/recruitment/offboarding/access/schedule-revocation', data),

        revokeImmediately: (data: {
            employeeId: string;
            reason: 'termination' | 'resignation' | 'no_show' | 'contract_cancelled';
            terminationId?: string;
        }) => axiosInstance.post('/recruitment/offboarding/access/revoke-immediate', data),

        getScheduledRevocations: () =>
            axiosInstance.get('/recruitment/offboarding/access/scheduled-revocations'),
    },

    // ----- OFF-013: Final Settlement -----
    settlement: {
        getTermination: (terminationId: string) =>
            axiosInstance.get(`/recruitment/offboarding/settlement/termination/${terminationId}`),

        getPending: () =>
            axiosInstance.get('/recruitment/offboarding/settlement/pending'),

        getLeaveBalance: (employeeId: string) =>
            axiosInstance.get(`/recruitment/offboarding/settlement/employee/${employeeId}/leave-balance`),

        getEmployeeContext: (employeeId: string) =>
            axiosInstance.get(`/recruitment/offboarding/settlement/employee/${employeeId}/context`),

        getComplete: (terminationId: string) =>
            axiosInstance.get(`/recruitment/offboarding/settlement/${terminationId}/complete`),

        trigger: (terminationId: string, data: {
            triggeredBy: string;
            notes?: string;
        }) => axiosInstance.post(`/recruitment/offboarding/settlement/${terminationId}/trigger`, data),
    },
};

// ============================================================
// EMPLOYEE PROFILE API
// ============================================================

export const employeeProfileApi = {
    getAll: () =>
        axiosInstance.get('/employee-profile'),

    getById: (id: string) =>
        axiosInstance.get(`/employee-profile/${id}`),

    create: (data: any) =>
        axiosInstance.post('/employee-profile', data),

    update: (id: string, data: any) =>
        axiosInstance.patch(`/employee-profile/${id}`, data),

    delete: (id: string) =>
        axiosInstance.delete(`/employee-profile/${id}`),
};

// ============================================================
// TIME MANAGEMENT API
// ============================================================

export const timeManagementApi = {
    getShifts: () =>
        axiosInstance.get('/time-management/shifts'),

    createShift: (data: any) =>
        axiosInstance.post('/time-management/shifts', data),

    getAttendance: () =>
        axiosInstance.get('/time-management/attendance'),

    createAttendance: (data: any) =>
        axiosInstance.post('/time-management/attendance', data),

    getTimeExceptions: () =>
        axiosInstance.get('/time-management/time-exceptions'),

    createTimeException: (data: any) =>
        axiosInstance.post('/time-management/time-exceptions', data),

    getHolidays: () =>
        axiosInstance.get('/time-management/holidays'),

    createHoliday: (data: any) =>
        axiosInstance.post('/time-management/holidays', data),

    // Notification methods
    getNotifications: (employeeId: string) =>
        axiosInstance.get(`/time-management/notifications/employee/${employeeId}`),
    
    checkMissedPunches: () =>
        axiosInstance.post('/time-management/attendance/missed-punches/check'),
};

// ============================================================
// LEAVES API
// ============================================================

export const leavesApi = {
    // Leave Types
    getLeaveTypes: () => axiosInstance.get('/leaves/types'),

    createLeaveType: (data: any) => axiosInstance.post('/leaves/types', data),

    updateLeaveType: (id: string, data: any) => axiosInstance.patch(`/leaves/types/${id}`, data),

    // Entitlement Rules
    setEntitlementRule: (leaveTypeId: string, data: any) =>
        axiosInstance.post(`/leaves/types/${leaveTypeId}/entitlement-rule`, data),

    // Personalized Entitlements
    setPersonalizedEntitlement: (data: { employeeId: string; leaveTypeId: string; yearlyEntitlement: number; reason?: string }) =>
        axiosInstance.post('/leaves/entitlement/personalized', data),

    setPersonalizedEntitlementGroup: (data: any) =>
        axiosInstance.post('/leaves/entitlement/personalized/group', data),

    // Accrual Policy
    configureAccrualPolicy: (employeeId: string, leaveTypeId: string, monthsWorked: number, data: any) =>
        axiosInstance.post(`/leaves/accrual/${employeeId}/${leaveTypeId}?monthsWorked=${monthsWorked}`, data),

    // Approval Workflow
    configureApprovalWorkflow: (leaveTypeId: string, data: { approvalWorkflow: any[]; payrollCode: string }) =>
        axiosInstance.patch(`/leaves/types/${leaveTypeId}/workflow`, data),

    // Holiday Calendar
    addHoliday: (year: number, data: any) =>
        axiosInstance.post(`/leaves/calendar/${year}/holiday`, data),

    addBlockedPeriod: (year: number, data: any) =>
        axiosInstance.post(`/leaves/calendar/${year}/blocked`, data),

    // Net Leave Calculation
    calculateNetLeaveDuration: (startDate: string, endDate: string, year: number, employeeId?: string) =>
        axiosInstance.get('/leaves/net-duration', {
            params: { startDate, endDate, year, employeeId }
        }),

    // Leave Requests
    submitLeaveRequest: (data: any) =>
        axiosInstance.post('/leaves/request', data),

    approveLeaveRequest: (id: string, data: any) =>
        axiosInstance.post(`/leaves/request/${id}/approve`, data),

    reviewLeaveRequest: (id: string, data: any) =>
        axiosInstance.post(`/leaves/request/${id}/review`, data),

    getLeaveBalance: (employeeId: string, leaveTypeId: string) =>
        axiosInstance.get(`/leaves/balance/${employeeId}/${leaveTypeId}`),

    // Escalation
    checkAutoEscalation: () =>
        axiosInstance.post('/leaves/escalation/check'),

    // Retroactive Deduction
    applyRetroactiveDeduction: (data: any) =>
        axiosInstance.post('/leaves/deduction/retroactive', data),

    // Delegation
    setDelegation: (data: any) =>
        axiosInstance.post('/leaves/delegation/set', data),

    revokeDelegation: (data: any) =>
        axiosInstance.post('/leaves/delegation/revoke', data),

    getDelegationStatus: (managerId: string) =>
        axiosInstance.get(`/leaves/delegation/status/${managerId}`),

    acceptDelegation: (data: any) =>
        axiosInstance.post('/leaves/delegation/accept', data),

    rejectDelegation: (data: any) =>
        axiosInstance.post('/leaves/delegation/reject', data),
};

// ============================================================
// PAYROLL CONFIGURATION API
// ============================================================

export const payrollConfigApi = {
    getAll: () =>
        axiosInstance.get('/payroll-configuration'),

    getById: (id: string) =>
        axiosInstance.get(`/payroll-configuration/${id}`),

    create: (data: any) =>
        axiosInstance.post('/payroll-configuration', data),

    update: (id: string, data: any) =>
        axiosInstance.patch(`/payroll-configuration/${id}`, data),
};

// ============================================================
// PERFORMANCE API
// ============================================================

export const performanceApi = {
    getAll: () =>
        axiosInstance.get('/performance'),

    getById: (id: string) =>
        axiosInstance.get(`/performance/${id}`),

    create: (data: any) =>
        axiosInstance.post('/performance', data),

    update: (id: string, data: any) =>
        axiosInstance.patch(`/performance/${id}`, data),
};

// ============================================================
// ORGANIZATION STRUCTURE API
// ============================================================

export const organizationApi = {
    getDepartments: () =>
        axiosInstance.get('/organization-structure/departments'),

    getPositions: () =>
        axiosInstance.get('/organization-structure/positions'),

    createDepartment: (data: any) =>
        axiosInstance.post('/organization-structure/departments', data),

    createPosition: (data: any) =>
        axiosInstance.post('/organization-structure/positions', data),
};

// ============================================================
// PAYROLL TRACKING API (Detailed - from Milestone3)
// ============================================================

export const payrollTrackingApi = {
    // ==================== PAYSLIPS ====================
    getMyPayslips: () =>
        axiosInstance.get<{ data: PayslipDto[] }>('/payroll-tracking/payslips'),

    getPayslipById: (id: string) =>
        axiosInstance.get<{ data: PayslipDto }>(`/payroll-tracking/payslips/${id}`),

    getEnhancedPayslip: (id: string) =>
        axiosInstance.get<{ data: EnhancedPayslipDataDto }>(`/payroll-tracking/payslips/${id}/enhanced`),

    downloadPayslipPDF: (id: string) =>
        axiosInstance.get(`/payroll-tracking/payslips/${id}/download-pdf`, {
            responseType: 'blob'
        }),

    getTimeImpactData: (month: number, year: number) =>
        axiosInstance.get<{ data: TimeImpactDataDto }>(`/payroll-tracking/time-impact/${month}/${year}`),

    // ==================== SALARY HISTORY ====================
    getSalaryHistory: () =>
        axiosInstance.get<{ data: SalaryHistoryDto[] }>('/payroll-tracking/salary-history'),

    // ==================== EXPENSE CLAIMS ====================
    getMyClaims: () =>
        axiosInstance.get<{ data: ExpenseClaimDto[] }>('/payroll-tracking/claims/me'),

    submitClaim: (data: CreateClaimDto) =>
        axiosInstance.post<{ data: ExpenseClaimDto }>('/payroll-tracking/claims', data),

    getClaimById: (id: string) =>
        axiosInstance.get<{ data: ExpenseClaimDto }>(`/payroll-tracking/claims/${id}`),

    // ==================== DISPUTES ====================
    getMyDisputes: () =>
        axiosInstance.get<{ data: DisputeDto[] }>('/payroll-tracking/disputes/me'),

    submitDispute: (data: CreateDisputeDto) =>
        axiosInstance.post<{ data: DisputeDto }>('/payroll-tracking/disputes', data),

    getDisputeById: (id: string) =>
        axiosInstance.get<{ data: DisputeDto }>(`/payroll-tracking/disputes/${id}`),

    // ==================== TAX DOCUMENTS ====================
    downloadTaxCertificate: (year?: number) =>
        axiosInstance.post('/payroll-tracking/certificates/tax',
            { year },
            { responseType: 'blob' }
        ),

    downloadInsuranceCertificate: (year?: number) =>
        axiosInstance.post('/payroll-tracking/certificates/insurance',
            { year },
            { responseType: 'blob' }
        ),

    getTaxDocuments: () =>
        axiosInstance.get<{ data: TaxDocumentDto[] }>('/payroll-tracking/documents/tax'),

    getInsuranceCertificates: () =>
        axiosInstance.get<{ data: InsuranceCertificateDto[] }>('/payroll-tracking/documents/insurance'),
};

// ============================================================
// PAYROLL SPECIALIST API
// ============================================================

export const payrollSpecialistApi = {
    getPendingDisputes: () =>
        axiosInstance.get<{ data: DisputeDto[] }>('/payroll-tracking/disputes/pending'),

    getAllDisputes: () =>
        axiosInstance.get<{ data: DisputeDto[] }>('/payroll-tracking/disputes/all'),

    getDispute: (id: string) =>
        axiosInstance.get<{ data: DisputeDto }>(`/payroll-tracking/disputes/${id}`),

    reviewDispute: (id: string, decision: 'APPROVE' | 'REJECT', comments: string) =>
        axiosInstance.patch<{ data: DisputeDto }>(`/payroll-tracking/disputes/${id}/resolve`, {
            status: decision === 'APPROVE' ? 'approved' : 'rejected',
            resolutionComment: comments
        }),

    getPendingClaims: () =>
        axiosInstance.get<{ data: ExpenseClaimDto[] }>('/payroll-tracking/claims/pending'),

    getAllClaims: () =>
        axiosInstance.get<{ data: ExpenseClaimDto[] }>('/payroll-tracking/claims/all'),

    getClaim: (id: string) =>
        axiosInstance.get<{ data: ExpenseClaimDto }>(`/payroll-tracking/claims/${id}`),

    reviewClaim: (id: string, decision: 'APPROVE' | 'REJECT', comments: string) =>
        axiosInstance.patch<{ data: ExpenseClaimDto }>(`/payroll-tracking/claims/${id}/review`, {
            status: decision === 'APPROVE' ? 'pending payroll Manager approval' : 'rejected',
            rejectionReason: decision === 'REJECT' ? comments : undefined
        }),

    getDepartmentReport: (filters: ReportFiltersDto) => {
        const dept = filters.departmentId || filters.department;
        return axiosInstance.get<{ data: any }>('/payroll-tracking/reports/departmental', {
            params: {
                startDate: filters.startDate,
                endDate: filters.endDate,
                department: dept === 'all' ? undefined : dept
            }
        });
    },
};

// ============================================================
// PAYROLL MANAGER API
// ============================================================

export const payrollManagerApi = {
    getSpecialistApprovedDisputes: () =>
        axiosInstance.get<{ data: DisputeDto[] }>('/payroll-tracking/disputes', {
            params: { specialistApproved: true }
        }),

    getSpecialistApprovedClaims: () =>
        axiosInstance.get<{ data: ExpenseClaimDto[] }>('/payroll-tracking/claims', {
            params: { specialistApproved: true }
        }),

    getDispute: (id: string) =>
        axiosInstance.get<{ data: DisputeDto }>(`/payroll-tracking/disputes/${id}`),

    getClaim: (id: string) =>
        axiosInstance.get<{ data: ExpenseClaimDto }>(`/payroll-tracking/claims/${id}`),

    managerActionDispute: (id: string, action: 'confirm' | 'reject', rejectionReason?: string) =>
        axiosInstance.patch<{ data: DisputeDto }>(`/payroll-tracking/disputes/${id}/manager-action`, {
            action,
            rejectionReason
        }),

    managerActionClaim: (id: string, action: 'confirm' | 'reject', rejectionReason?: string) =>
        axiosInstance.patch<{ data: ExpenseClaimDto }>(`/payroll-tracking/claims/${id}/manager-action`, {
            action,
            rejectionReason
        }),
};

// ============================================================
// FINANCE STAFF API
// ============================================================

export const financeStaffApi = {
    getApprovedDisputes: () =>
        axiosInstance.get<{ data: DisputeDto[] }>('/finance/disputes/approved'),

    getDispute: (id: string) =>
        axiosInstance.get<{ data: DisputeDto }>(`/finance/disputes/${id}`),

    processDisputeRefund: (id: string, refundAmount: number) =>
        axiosInstance.post<{ data: DisputeDto }>(`/finance/disputes/${id}/process`, { refundAmount }),

    rejectDispute: (id: string, reason: string) =>
        axiosInstance.post<{ data: DisputeDto }>(`/finance/disputes/${id}/reject`, { reason }),

    getApprovedClaims: () =>
        axiosInstance.get<{ data: ExpenseClaimDto[] }>('/finance/claims/approved'),

    getClaim: (id: string) =>
        axiosInstance.get<{ data: ExpenseClaimDto }>(`/finance/claims/${id}`),

    processClaimRefund: (id: string) =>
        axiosInstance.post<{ data: ExpenseClaimDto }>(`/finance/claims/${id}/process`),

    rejectClaim: (id: string, reason: string) =>
        axiosInstance.post<{ data: ExpenseClaimDto }>(`/finance/claims/${id}/reject`, { reason }),

    getTaxComplianceReport: (startDate: string, endDate: string) =>
        axiosInstance.post<{ data: any }>('/finance/reports/compliance/tax', { startDate, endDate }),

    getInsuranceComplianceReport: (startDate: string, endDate: string) =>
        axiosInstance.post<{ data: any }>('/finance/reports/compliance/insurance', { startDate, endDate }),

    getBenefitsReport: (startDate: string, endDate: string) =>
        axiosInstance.post<{ data: any }>('/finance/reports/compliance/benefits', { startDate, endDate }),

    getFinancialReport: (startDate: string, endDate: string) =>
        axiosInstance.post<{ data: any }>('/finance/reports/summary/financial', { startDate, endDate }),

    getComplianceReport: (reportType: 'TAX' | 'INSURANCE' | 'BENEFITS', filters: ReportFiltersDto) =>
        axiosInstance.post<{ data: any }>('/finance/reports/compliance', { reportType, ...filters }),

    getMonthEndSummary: (month: number, year: number) =>
        axiosInstance.post<{ data: any }>('/finance/reports/summary/month', { month, year }),

    getYearEndSummary: (year: number) =>
        axiosInstance.post<{ data: any }>('/finance/reports/summary/year', { year }),
};

// ============================================================
// PAYROLL EXECUTION API (Detailed - from Milestone3)
// ============================================================

export const payrollExecutionApi = {
    // Phase 0: Pre-Run Review
    getPendingBenefits: () => axiosInstance.get('/payroll-execution/benefits/pending'),

    reviewBenefit: (data: {
        employeeId: string;
        type: 'SIGNING_BONUS' | 'TERMINATION';
        action: 'APPROVED' | 'REJECTED';
        reviewerId: string;
        reason?: string;
        amount?: number;
    }) => axiosInstance.patch('/payroll-execution/benefits/review', data),

    // Phase 1: Initiation
    initiatePeriod: (data: { month: string; year: number; entity: string }) =>
        axiosInstance.post('/payroll-execution/period', data),

    // Phase 1.1: Draft Review & Logic
    getPayrollRuns: () => axiosInstance.get('/payroll-execution/runs'),

    getDraftEmployees: (runId: string) => axiosInstance.get(`/payroll-execution/drafts/${runId}/employees`),

    reviewPeriod: (data: { runId: string, action: 'APPROVED' | 'REJECTED' }) =>
        axiosInstance.patch('/payroll-execution/period/review', data),

    processRunCalculations: (runId: string) => axiosInstance.post(`/payroll-execution/runs/${runId}/calculate`, {}, {
        timeout: 120000 // Increase timeout to 120 seconds for heavy calculations
    }),

    submitForApproval: (runId: string) => axiosInstance.patch(`/payroll-execution/runs/${runId}/submit`, {}, { timeout: 120000 }),

    // Phase 2-3: Approvals
    managerReview: (runId: string, data: { status?: 'APPROVED' | 'REJECTED', action?: 'APPROVED' | 'REJECTED', comment?: string }) =>
        axiosInstance.patch(`/payroll-execution/runs/${runId}/manager-review`, data),

    financeReview: (runId: string, data: { status: 'APPROVED' | 'REJECTED', comment?: string }) =>
        axiosInstance.patch(`/payroll-execution/runs/${runId}/finance-review`, data),

    // Phase 4: Management (Lock/Unfreeze)
    lockPayroll: (runId: string) => axiosInstance.patch(`/payroll-execution/runs/${runId}/lock`),

    unfreezePayroll: (runId: string, data: { reason: string }) =>
        axiosInstance.patch(`/payroll-execution/runs/${runId}/unfreeze`, { justification: data.reason }),

    // Phase 5: Execution
    executeAndDistribute: (runId: string) => axiosInstance.patch(`/payroll-execution/runs/${runId}/execute-and-distribute`, {}, {
        timeout: 120000 // Heavy PDF generation
    }),

    // Anomaly Resolution
    resolveAnomalies: (runId: string, data: { resolutions: any[] }) =>
        axiosInstance.patch(`/payroll-execution/runs/${runId}/resolve-anomalies`, data),

    // Details
    getPayslipDetails: (employeeId: string, runId: string) =>
        axiosInstance.get(`/payroll-execution/payslips/${employeeId}/run/${runId}`),

    // Test/Seed
    seedTestBenefits: () => axiosInstance.post('/payroll-execution/seed/benefits'),
};

// ============================================================
// EXPORT DEFAULT
// ============================================================

export default axiosInstance;
