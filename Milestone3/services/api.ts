import axiosInstance from '@/utils/ApiClient';

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
        axiosInstance.patch(`/payroll-execution/runs/${data.runId}/period-review`, data),

    processRunCalculations: (runId: string) => axiosInstance.post(`/payroll-execution/runs/${runId}/calculate`),

    submitForApproval: (runId: string) => axiosInstance.post(`/payroll-execution/runs/${runId}/submit`),

    // Phase 2-3: Approvals
    managerReview: (runId: string, data: { status?: 'APPROVED' | 'REJECTED', action?: 'APPROVED' | 'REJECTED', comment?: string }) =>
        axiosInstance.patch(`/payroll-execution/runs/${runId}/manager-review`, data),

    financeReview: (runId: string, data: { status: 'APPROVED' | 'REJECTED', comment?: string }) =>
        axiosInstance.patch(`/payroll-execution/runs/${runId}/finance-review`, data),

    // Phase 4: Management (Lock/Unfreeze)
    lockPayroll: (runId: string) => axiosInstance.post(`/payroll-execution/runs/${runId}/lock`),

    unfreezePayroll: (runId: string, data: { reason: string }) =>
        axiosInstance.post(`/payroll-execution/runs/${runId}/unfreeze`, data),

    // Phase 5: Execution
    executeAndDistribute: (runId: string) => axiosInstance.post(`/payroll-execution/runs/${runId}/execute`),

    // Anomaly Resolution
    resolveAnomalies: (runId: string, data: { resolutions: any[] }) =>
        axiosInstance.post(`/payroll-execution/runs/${runId}/resolve-anomalies`, data),

    // Details
    getPayslipDetails: (employeeId: string, runId: string) =>
        axiosInstance.get(`/payroll-execution/payslips/${runId}/${employeeId}`),

    // Test/Seed
    seedTestBenefits: () => axiosInstance.post('/payroll-execution/seed/benefits'),
};

export const employeeProfileApi = {
    // Placeholder if needed, or implement if used
};

// Export the base api instance as default or named
export default axiosInstance;
