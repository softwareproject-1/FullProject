/**
 * Integration Interfaces for Payroll Execution Module
 * 
 * This file documents all expected integrations with other HR subsystems.
 * These interfaces define the contract between Payroll Execution and other modules.
 * 
 * Status: Ready for integration - Payroll module uses employee data fields as fallback
 */

// ============================================================================
// TIME MANAGEMENT SERVICE INTEGRATION
// ============================================================================

/**
 * Interface for Time Management Service integration
 * Used for: Overtime calculations, unpaid leave deductions, attendance data
 * 
 * Business Rules: BR 11 (Unpaid leave deductions)
 * Requirements: REQ-PY-1 (Auto-calculate based on attendance)
 */
export interface ITimeManagementIntegration {
  /**
   * Get employee time data for a specific payroll period
   * @param employeeId - Employee identifier
   * @param periodStart - Start date of payroll period
   * @param periodEnd - End date of payroll period
   * @returns Time data including overtime, absences, unpaid leave
   */
  getEmployeeTimeData(
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<EmployeeTimeData>;

  /**
   * Get working days for an employee in a period
   * @param employeeId - Employee identifier
   * @param periodStart - Start date
   * @param periodEnd - End date
   * @returns Number of working days
   */
  getWorkingDays(
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<number>;
}

export interface EmployeeTimeData {
  employeeId: string;
  overtimeHours: number; // Total overtime hours worked
  unpaidLeaveDays: number; // Days of unpaid leave taken
  absenceDays: number; // Total absence days
  workingDays: number; // Actual days worked
  totalScheduledDays: number; // Expected working days
  attendanceRate: number; // Percentage of attendance
}

// ============================================================================
// LEAVES MODULE INTEGRATION
// ============================================================================

/**
 * Interface for Leaves Module integration
 * Used for: Leave encashment on termination/resignation, unpaid leave tracking
 * 
 * Business Rules: BR 56 (Resignation - accrued leave payout)
 * Requirements: REQ-PY-2 (Prorated calculations for exits)
 */
export interface ILeavesIntegration {
  /**
   * Calculate leave encashment for terminated/resigned employees
   * @param employeeId - Employee identifier
   * @param terminationDate - Date of termination/resignation
   * @returns Leave encashment amount and breakdown
   */
  calculateLeaveEncashment(
    employeeId: string,
    terminationDate: Date,
  ): Promise<LeaveEncashmentResult>;

  /**
   * Get unpaid leave days for an employee in a period
   * @param employeeId - Employee identifier
   * @param periodStart - Start date of payroll period
   * @param periodEnd - End date of payroll period
   * @returns Number of unpaid leave days
   */
  getUnpaidLeaveDays(
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<number>;

  /**
   * Get approved leave requests for deduction calculations
   * @param employeeId - Employee identifier
   * @param periodStart - Start date
   * @param periodEnd - End date
   * @returns Array of approved leave requests
   */
  getApprovedLeaves(
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<ApprovedLeave[]>;
}

export interface LeaveEncashmentResult {
  employeeId: string;
  unusedAnnualLeaveDays: number;
  dailyRate: number;
  totalEncashmentAmount: number;
  breakdown: {
    leaveType: string;
    days: number;
    amount: number;
  }[];
  calculatedAt: Date;
}

export interface ApprovedLeave {
  leaveId: string;
  employeeId: string;
  leaveType: 'ANNUAL' | 'SICK' | 'UNPAID' | 'EMERGENCY';
  startDate: Date;
  endDate: Date;
  daysCount: number;
  isPaid: boolean;
  status: 'APPROVED';
}

// ============================================================================
// NOTIFICATION SERVICE INTEGRATION
// ============================================================================

/**
 * Interface for Notification Service integration
 * Used for: Workflow notifications, approval alerts, payslip distribution
 * 
 * Business Rules: BR 30 (Approval workflow notifications)
 * Requirements: REQ-PY-12, REQ-PY-15 (Approval workflow)
 */
export interface INotificationIntegration {
  /**
   * Notify Payroll Manager to lock payroll after Finance approval
   * @param managerId - Payroll Manager identifier
   * @param runId - Payroll run identifier
   */
  notifyManagerToLock(managerId: string, runId: string): Promise<void>;

  /**
   * Notify Payroll Specialist of rejection
   * @param specialistId - Payroll Specialist identifier
   * @param runId - Payroll run identifier
   * @param reason - Rejection reason
   */
  notifyRejection(
    specialistId: string,
    runId: string,
    reason: string,
  ): Promise<void>;

  /**
   * Notify employee of payslip availability
   * @param employeeId - Employee identifier
   * @param payslipId - Payslip identifier
   * @param runId - Payroll run identifier
   */
  notifyPayslipAvailable(
    employeeId: string,
    payslipId: string,
    runId: string,
  ): Promise<void>;

  /**
   * Send bulk payslip notifications
   * @param notifications - Array of payslip notifications
   */
  sendBulkPayslipNotifications(
    notifications: PayslipNotification[],
  ): Promise<void>;
}

export interface PayslipNotification {
  employeeId: string;
  employeeEmail: string;
  payslipId: string;
  runId: string;
  period: string;
  netPay: number;
}

// ============================================================================
// INTEGRATION IMPLEMENTATION NOTES
// ============================================================================

/**
 * CURRENT STATE (December 2025):
 * - Payroll Execution module is COMPLETE and uses employee data fields as fallback
 * - All integration points are documented with clear interfaces
 * - Integration fields expected from employee data:
 *   - employee.overtimeHours (from Time Management)
 *   - employee.unpaidLeaveDays (from Leaves Module)
 *   - employee.employmentStatus (for leave encashment)
 *   - employee.contractStartDate (for prorated calculations)
 *   - employee.contractEndDate (for prorated calculations)
 * 
 * INTEGRATION CHECKLIST:
 * ✅ Time Management: Ready - expects overtimeHours, unpaidLeaveDays fields
 * ✅ Leaves Module: Ready - expects unpaidLeaveDays, can add encashment calculation
 * ✅ Notification Service: Ready - notification points documented
 * ✅ Employee Profile: Integrated - reads contract data directly
 * ✅ Payroll Configuration: Integrated - uses TaxRulesService, InsuranceBracketsService
 * 
 * HOW TO INTEGRATE:
 * 1. Import the service into payroll-execution.module.ts
 * 2. Inject the service in payroll-execution.service.ts constructor
 * 3. Replace employee data field access with service calls
 * 4. Test with real data from integrated service
 * 
 * Example for Time Management Integration:
 * ```typescript
 * // In payroll-execution.service.ts
 * constructor(
 *   // ... existing injections
 *   @Inject(forwardRef(() => TimeManagementService))
 *   private timeManagementService: TimeManagementService,
 * ) {}
 * 
 * // In calculateSalary method:
 * const timeData = await this.timeManagementService.getEmployeeTimeData(
 *   employeeId, periodStart, periodEnd
 * );
 * const overtimeHours = timeData.overtimeHours;
 * const unpaidLeaveDays = timeData.unpaidLeaveDays;
 * ```
 */
