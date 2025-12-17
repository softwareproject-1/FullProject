export enum ClaimStatus {
    UNDER_REVIEW = 'under review',
    PENDING_MANAGER_APPROVAL = 'pending payroll Manager approval',
    APPROVED = 'approved',// when manager approves
    REJECTED = 'rejected',
    COMPLETED = 'completed' // when finance processes refund
}
export enum DisputeStatus {
    UNDER_REVIEW = 'under review',
    PENDING_MANAGER_APPROVAL = 'pending payroll Manager approval',
    APPROVED = 'approved',// when manager approves
    REJECTED = 'rejected',
    COMPLETED = 'completed' // when finance processes refund
}
export enum RefundStatus {
    PENDING = 'pending',
    PAID = 'paid' // when payroll execution
} 