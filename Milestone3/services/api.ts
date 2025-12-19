import axiosInstance from '@/utils/ApiClient';

// ============================================================
// TYPE DEFINITIONS
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
    employeeId?: string;  // Added for display
    employeeName?: string;
    description: string;
    claimType: string;
    amount: number;
    receipts?: Array<{ filename: string; url: string }>;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID' | 'UNDER_REVIEW' | 'PENDING_MANAGER_APPROVAL' | string;

    createdAt: string;
    updatedAt?: string;
    submittedAt?: string;
    rejectionReason?: string;  // Added for rejected claims
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
    department?: string;  // For the specialist API endpoint
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
    // Payslip Identification
    payslipId: string;
    month: string;
    year: number;
    employeeName: string;
    payGrade?: string;

    // Itemized Earnings
    baseSalary: number;
    allowances: AllowanceLineItemDto[];
    totalAllowances: number;
    overtimeCompensation: number;
    leaveEncashment?: number;
    grossPay: number;

    // Itemized Deductions
    taxDeductions: TaxLineItemDto[];
    totalTax: number;
    insuranceDeductions: InsuranceLineItemDto[];
    totalInsurance: number;
    leaveDeductions?: LeaveDeductionDto;
    timeBasedPenalties: number;
    totalDeductions: number;

    // Net Pay
    netPay: number;

    // Compliance & Transparency
    minimumWage: number;
    minimumWageAlert: boolean;

    // Employer Contributions (Total Rewards)
    employerContributions: InsuranceLineItemDto[];
    totalEmployerContributions: number;

    // Dispute Support
    disputeEligibleItems: string[];
}


// ============================================================
// API ENDPOINTS
// ============================================================

export const payrollTrackingApi = {
    // ==================== PAYSLIPS ====================
    /**
     * Get current user's payslips
     */
    getMyPayslips: () =>
        axiosInstance.get<{ data: PayslipDto[] }>('/payroll-tracking/payslips'),

    /**
     * Get a specific payslip by ID
     */
    getPayslipById: (id: string) =>
        axiosInstance.get<{ data: PayslipDto }>(`/payroll-tracking/payslips/${id}`),

    /**
     * Get enhanced payslip with itemized allowances, tax, insurance
     */
    getEnhancedPayslip: (id: string) =>
        axiosInstance.get<{ data: EnhancedPayslipDataDto }>(`/payroll-tracking/payslips/${id}/enhanced`),

    /**
     * Download payslip as PDF
     */
    downloadPayslipPDF: (id: string) =>
        axiosInstance.get(`/payroll-tracking/payslips/${id}/download-pdf`, {
            responseType: 'blob'
        }),

    /**
     * Get time-related financial impact for a specific pay period
     */
    getTimeImpactData: (month: number, year: number) =>
        axiosInstance.get<{ data: TimeImpactDataDto }>(`/payroll-tracking/time-impact/${month}/${year}`),

    // ==================== SALARY HISTORY ====================
    /**
     * Get salary history for current user
     */
    getSalaryHistory: () =>
        axiosInstance.get<{ data: SalaryHistoryDto[] }>('/payroll-tracking/salary-history'),

    // ==================== EXPENSE CLAIMS ====================
    /**
     * Get current user's expense claims
     */
    getMyClaims: () =>
        axiosInstance.get<{ data: ExpenseClaimDto[] }>('/payroll-tracking/claims/me'),

    /**
     * Submit a new expense claim
     */
    submitClaim: (data: CreateClaimDto) =>
        axiosInstance.post<{ data: ExpenseClaimDto }>('/payroll-tracking/claims', data),

    /**
     * Get a specific claim by ID
     */
    getClaimById: (id: string) =>
        axiosInstance.get<{ data: ExpenseClaimDto }>(`/payroll-tracking/claims/${id}`),

    // ==================== DISPUTES ====================
    /**
     * Get current user's disputes
     */
    getMyDisputes: () =>
        axiosInstance.get<{ data: DisputeDto[] }>('/payroll-tracking/disputes/me'),

    /**
     * Submit a new dispute
     */
    submitDispute: (data: CreateDisputeDto) =>
        axiosInstance.post<{ data: DisputeDto }>('/payroll-tracking/disputes', data),

    /**
     * Get a specific dispute by ID
     */
    getDisputeById: (id: string) =>
        axiosInstance.get<{ data: DisputeDto }>(`/payroll-tracking/disputes/${id}`),

    // ==================== TAX DOCUMENTS ====================
    /**
     * Download tax certificate/statement
     */
    downloadTaxCertificate: (year?: number) =>
        axiosInstance.post('/payroll-tracking/certificates/tax',
            { year },
            { responseType: 'blob' }
        ),

    /**
     * Download insurance certificate
     */
    downloadInsuranceCertificate: (year?: number) =>
        axiosInstance.post('/payroll-tracking/certificates/insurance',
            { year },
            { responseType: 'blob' }
        ),

    /**
     * Get available tax documents
     */
    getTaxDocuments: () =>
        axiosInstance.get<{ data: TaxDocumentDto[] }>('/payroll-tracking/documents/tax'),

    /**
     * Get available insurance certificates
     */
    getInsuranceCertificates: () =>
        axiosInstance.get<{ data: InsuranceCertificateDto[] }>('/payroll-tracking/documents/insurance'),
};

// ============================================================
// PAYROLL SPECIALIST API
// ============================================================

export const payrollSpecialistApi = {
    // ==================== DISPUTES ====================
    // Backend provides dedicated endpoints for specialists to get ALL pending disputes
    getPendingDisputes: () =>
        axiosInstance.get<{ data: DisputeDto[] }>('/payroll-tracking/disputes/pending'),

    getAllDisputes: () =>
        axiosInstance.get<{ data: DisputeDto[] }>('/payroll-tracking/disputes/all'),

    getDispute: (id: string) =>
        axiosInstance.get<{ data: DisputeDto }>(`/payroll-tracking/disputes/${id}`),

    // Backend uses PATCH /payroll-tracking/disputes/:id/resolve for specialist reviews
    reviewDispute: (id: string, decision: 'APPROVE' | 'REJECT', comments: string) =>
        axiosInstance.patch<{ data: DisputeDto }>(`/payroll-tracking/disputes/${id}/resolve`, {
            status: decision === 'APPROVE' ? 'approved' : 'rejected',
            resolutionComment: comments
        }),

    // ==================== CLAIMS ====================
    // Backend provides dedicated endpoints for specialists to get ALL pending claims
    getPendingClaims: () =>
        axiosInstance.get<{ data: ExpenseClaimDto[] }>('/payroll-tracking/claims/pending'),

    getAllClaims: () =>
        axiosInstance.get<{ data: ExpenseClaimDto[] }>('/payroll-tracking/claims/all'),

    getClaim: (id: string) =>
        axiosInstance.get<{ data: ExpenseClaimDto }>(`/payroll-tracking/claims/${id}`),

    // Backend uses PATCH /payroll-tracking/claims/:id/review for specialist reviews
    reviewClaim: (id: string, decision: 'APPROVE' | 'REJECT', comments: string) =>
        axiosInstance.patch<{ data: ExpenseClaimDto }>(`/payroll-tracking/claims/${id}/review`, {
            status: decision === 'APPROVE' ? 'pending payroll Manager approval' : 'rejected',
            rejectionReason: decision === 'REJECT' ? comments : undefined
        }),

    // ==================== DEPARTMENT REPORTS ====================
    // Backend uses GET /payroll-tracking/reports/departmental with query params
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
    // ==================== SPECIALIST-APPROVED ITEMS ====================
    /**
     * Get disputes approved by specialist awaiting manager confirmation
     */
    getSpecialistApprovedDisputes: () =>
        axiosInstance.get<{ data: DisputeDto[] }>('/payroll-tracking/disputes', {
            params: { specialistApproved: true }
        }),

    /**
     * Get claims approved by specialist awaiting manager confirmation
     */
    getSpecialistApprovedClaims: () =>
        axiosInstance.get<{ data: ExpenseClaimDto[] }>('/payroll-tracking/claims', {
            params: { specialistApproved: true }
        }),

    // ==================== GET BY ID ====================
    /**
     * Get a specific dispute for manager review
     */
    getDispute: (id: string) =>
        axiosInstance.get<{ data: DisputeDto }>(`/payroll-tracking/disputes/${id}`),

    /**
     * Get a specific claim for manager review
     */
    getClaim: (id: string) =>
        axiosInstance.get<{ data: ExpenseClaimDto }>(`/payroll-tracking/claims/${id}`),

    // ==================== MANAGER ACTIONS ====================
    /**
     * Manager confirms or rejects a dispute
     * action: 'confirm' | 'reject'
     */
    managerActionDispute: (id: string, action: 'confirm' | 'reject', rejectionReason?: string) =>
        axiosInstance.patch<{ data: DisputeDto }>(`/payroll-tracking/disputes/${id}/manager-action`, {
            action,
            rejectionReason
        }),

    /**
     * Manager confirms or rejects a claim
     * action: 'confirm' | 'reject'
     */
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
    // ==================== APPROVED DISPUTES ====================
    getApprovedDisputes: () =>
        axiosInstance.get<{ data: DisputeDto[] }>('/finance/disputes/approved'),

    getDispute: (id: string) =>
        axiosInstance.get<{ data: DisputeDto }>(`/finance/disputes/${id}`),

    processDisputeRefund: (id: string) =>
        axiosInstance.post<{ data: DisputeDto }>(`/finance/disputes/${id}/process`),

    rejectDispute: (id: string, reason: string) =>
        axiosInstance.post<{ data: DisputeDto }>(`/finance/disputes/${id}/reject`, { reason }),

    // ==================== APPROVED CLAIMS ====================
    getApprovedClaims: () =>
        axiosInstance.get<{ data: ExpenseClaimDto[] }>('/finance/claims/approved'),

    getClaim: (id: string) =>
        axiosInstance.get<{ data: ExpenseClaimDto }>(`/finance/claims/${id}`),

    processClaimRefund: (id: string) =>
        axiosInstance.post<{ data: ExpenseClaimDto }>(`/finance/claims/${id}/process`),

    rejectClaim: (id: string, reason: string) =>
        axiosInstance.post<{ data: ExpenseClaimDto }>(`/finance/claims/${id}/reject`, { reason }),

    // ==================== COMPLIANCE REPORTS ====================
    getTaxComplianceReport: (startDate: string, endDate: string) =>
        axiosInstance.post<{ data: any }>('/finance/reports/compliance/tax', { startDate, endDate }),

    getInsuranceComplianceReport: (startDate: string, endDate: string) =>
        axiosInstance.post<{ data: any }>('/finance/reports/compliance/insurance', { startDate, endDate }),

    getBenefitsReport: (startDate: string, endDate: string) =>
        axiosInstance.post<{ data: any }>('/finance/reports/compliance/benefits', { startDate, endDate }),

    // ==================== FINANCIAL SUMMARIES ====================
    getFinancialReport: (startDate: string, endDate: string) =>
        axiosInstance.post<{ data: any }>('/finance/reports/summary/financial', { startDate, endDate }),

    // ==================== LEGACY / DEPRECATED ====================
    getComplianceReport: (reportType: 'TAX' | 'INSURANCE' | 'BENEFITS', filters: ReportFiltersDto) =>
        axiosInstance.post<{ data: any }>('/finance/reports/compliance', { reportType, ...filters }),

    getMonthEndSummary: (month: number, year: number) =>
        axiosInstance.post<{ data: any }>('/finance/reports/summary/month', { month, year }),

    getYearEndSummary: (year: number) =>
        axiosInstance.post<{ data: any }>('/finance/reports/summary/year', { year }),
};

// ============================================================
// EXPORT DEFAULT
// ============================================================

// Payroll Execution API
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
        axiosInstance.patch(`/payroll-execution/period/review`, data),

    processRunCalculations: (runId: string) => axiosInstance.post(`/payroll-execution/runs/${runId}/calculate`, {}, {
        timeout: 120000 // Increase timeout to 120 seconds for heavy calculations
    }),

    submitForApproval: (runId: string) => axiosInstance.post(`/payroll-execution/runs/${runId}/submit`),

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

export const employeeProfileApi = {
    // Placeholder if needed, or implement if used
};

// Export the base api instance as default or named
export default axiosInstance;
