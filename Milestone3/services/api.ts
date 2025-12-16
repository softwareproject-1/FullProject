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
    employee: string;
    amount: number;
    description: string;
    category?: string;
    claimType?: string;
    receipts?: string[];
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
    createdAt: string;
    updatedAt?: string;
    submittedAt?: string;
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
    payslip?: string;
    description: string;
    category?: string;
    status: 'PENDING' | 'RESOLVED' | 'REJECTED' | 'INVESTIGATING';
    createdAt: string;
    updatedAt?: string;
    resolvedBy?: string;
    resolvedAt?: string;
    resolution?: string;
    refundAmount?: number;
}

export interface CreateDisputeDto {
    payslipId?: string;
    description: string;
    category?: string;
    expectedAmount?: number;
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
     * Download payslip as PDF
     */
    downloadPayslip: (id: string) =>
        axiosInstance.get(`/payroll-tracking/payslips/${id}/download`, {
            responseType: 'blob'
        }),

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
// EXPORT DEFAULT
// ============================================================

export default payrollTrackingApi;
