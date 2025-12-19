import { Controller, Post, Patch, Body, Get, Param, Req, UseGuards } from '@nestjs/common';
import { PayrollExecutionService } from './payroll-execution.service';
import { PayrollSchedulerService } from './payroll-scheduler.service';
import { AuthenticationGuard } from '../auth/guards/authentication.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SystemRole } from '../employee-profile/enums/employee-profile.enums';

// DTOs
import { InitiateRunDto } from './dto/initiate-run.dto';
import { ReviewBenefitDto } from './dto/review-benefit.dto';
import { PeriodReviewDto } from './dto/period-review.dto';
import { HrEventCheckDto } from './dto/hr-event-check.dto';
import { ManualAdjustmentDto } from './dto/manual-adjustment.dto';
import { ReviewActionDto } from './dto/review-action.dto';
import { UnfreezePayrollDto } from './dto/unfreeze-payroll.dto';

@Controller('payroll-execution')
@UseGuards(AuthenticationGuard, RolesGuard) // Apply authentication and role-based authorization to all routes
export class PayrollExecutionController {
    constructor(
        private readonly payrollService: PayrollExecutionService,
        private readonly schedulerService: PayrollSchedulerService
    ) { }

    // GANNAH: INITIATION & DRAFT GENERATION

    // 0. Get All Payroll Runs (History Dashboard)
    @Get('runs')
    @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER, SystemRole.FINANCE_STAFF, SystemRole.DEPARTMENT_EMPLOYEE) // Allow generic access?
    async getAllPayrollRuns() {
        return this.payrollService.getAllPayrollRuns();
    }

    // 1. Pre-Run: List Pending Benefits (Bonuses/Terminations)
    @Get('benefits/pending')
    @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER) // Phase 0: Specialists review benefits before run
    async getPendingBenefits() {
        return this.payrollService.getPendingBenefits();
    }

    // 2. Pre-Run: Review a Benefit (Approve/Reject)
    @Patch('benefits/review')
    @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER) // Phase 0: Specialists and Managers can approve/reject benefits
    async reviewBenefit(@Body() dto: ReviewBenefitDto) {
        return this.payrollService.reviewBenefit(dto);
    }

    // 3. Manual Check for HR Events (New Hire / Termination Status)
    @Post('events/check')
    @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER) // Phase 0: Check employee HR events
    async checkEmployeeEvent(@Body() dto: HrEventCheckDto) {
        return this.payrollService.checkHrEvent(dto);
    }

    // 4. Initiate Period (Creates Draft Run)
    @Post('period')
    @Roles(SystemRole.PAYROLL_SPECIALIST) // Phase 1: Only Specialists can initiate payroll runs
    async initiatePeriod(@Body() dto: InitiateRunDto, @Req() req: any) {
        // Use authenticated user if present; otherwise a fixed test ObjectId
        const specialistId = (req && req.user && req.user.userId);
        // ? req.user.userId;
        //: '64f1b2b3e4b0a1a2b3c4d999';
        return this.payrollService.initiatePeriod(dto, specialistId);
    }

    // 5. Review Period -> Triggers "Fetch Eligible Employees"
    @Patch('period/review')
    @Roles(SystemRole.PAYROLL_SPECIALIST) // Phase 1: Specialists approve/reject payroll period
    async reviewPeriod(@Body() dto: PeriodReviewDto) {
        return this.payrollService.reviewPeriod(dto);
    }

    // 6. Get Eligible Employees for a Draft Run
    @Get('drafts/:runId/employees')
    @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER, SystemRole.FINANCE_STAFF) // Phase 1.1: All payroll roles can view draft
    async getDraftEmployees(@Param('runId') runId: string) {
        return this.payrollService.fetchEligibleEmployees(runId);
    }

    // ==================== MEMBER 2 (CALCULATION) START ====================

    // 7. Run Calculations for a Payroll Run
    @Post('runs/:runId/calculate')
    @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER) // Allow Managers to recalculate for anomaly resolution
    async processRunCalculations(@Param('runId') runId: string) {
        return this.payrollService.processRunCalculations(runId);
    }

    // 8. Add Manual Adjustment to a Payslip
    @Patch('payslips/:id/adjust')
    @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER) // Manual adjustments require Specialist or Manager authority
    async addManualAdjustment(
        @Param('id') payslipId: string,
        @Body() manualAdjustmentDto: ManualAdjustmentDto
    ) {
        return this.payrollService.addManualAdjustment(payslipId, manualAdjustmentDto);
    }


    // Add to PayrollExecutionController
    @Get('test/db-status')
    @Roles(SystemRole.PAYROLL_MANAGER, SystemRole.FINANCE_STAFF) // Debug: Only senior staff can check database status
    async testDatabaseStatus() {
        return this.payrollService.debugDatabaseStatus();
    }

    @Get('debug/employees-data')
    async debugEmployeesData() {
        return this.payrollService.debugEmployeesCollection();
    }


    @Get('debug/run/:runId/employees')
    async debugRunEmployees(@Param('runId') runId: string) {
        return this.payrollService.debugRunEmployees(runId);
    }


    @Get('runs/:runId/payslips')
    async getRunPayslips(@Param('runId') runId: string) {
        return this.payrollService.getPayslipsForRun(runId);
    }
    // // TEMPORARY: Debug endpoint to see mock data for a run

    //     // Add this to your controller
    //     @Get('debug/all-runs')
    //     async debugAllMockRuns() {
    //         return this.payrollService.debugAllMockRuns();
    //     }


    //     @Get('runs/:runId/debug')
    //     async debugMockData(@Param('runId') runId: string) {
    //         return this.payrollService.debugMockData(runId);
    //     }


    // ==================== MEMBER 2 (CALCULATION) END ====================
    // === MEMBER 3 (APPROVALS) ===

    // 7. Submit Payroll Run for Approval (Anomaly Check)
    @Patch('runs/:id/submit')
    @Roles(SystemRole.PAYROLL_SPECIALIST) // Phase 2: Specialists submit for manager review after validation
    async submitForApproval(@Param('id') runId: string) {
        return this.payrollService.submitForApproval(runId);
    }

    // 8. Manager Review (Approve/Reject)
    @Patch('runs/:id/manager-review')
    @Roles(SystemRole.PAYROLL_MANAGER) // Phase 3: Only Managers can approve/reject payroll runs
    async managerReview(@Param('id') runId: string, @Body() dto: ReviewActionDto) {
        return this.payrollService.managerReview(runId, dto);
    }

    // NEW: Finance Review (Approve/Reject) - REQ-PY-15
    @Patch('runs/:id/finance-review')
    @Roles(SystemRole.FINANCE_STAFF) // Phase 3: Finance Staff final approval before execution
    async financeReview(@Param('id') runId: string, @Body() dto: ReviewActionDto) {
        return this.payrollService.financeReview(runId, dto);
    }

    // NEW: Preview Dashboard - REQ-PY-6
    @Get('runs/:id/preview')
    @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER, SystemRole.FINANCE_STAFF) // REQ-PY-6: Preview dashboard for all payroll roles
    async getPayrollPreview(@Param('id') runId: string) {
        return this.payrollService.getPayrollPreview(runId);
    }

    // 9. Finance Execute & Distribute Payslips (REQ-PY-8)
    // 9. Finance Execute & Distribute Payslips (REQ-PY-8)
    @Patch('runs/:id/execute-and-distribute')
    @Roles(SystemRole.PAYROLL_SPECIALIST) // Phase 5: Only Payroll Specialists can execute final payment and distribution
    async executeAndDistribute(@Param('id') runId: string) {
        return this.payrollService.executeAndDistribute(runId);
    }

    // === MEMBER 3 (LOCK/FREEZE MANAGEMENT) ===

    // 10. Lock/Freeze Payroll Run (REQ-PY-7)
    @Patch('runs/:id/lock')
    @Roles(SystemRole.PAYROLL_MANAGER) // REQ-PY-7: Only Managers can lock/freeze payroll runs
    async lockPayroll(@Param('id') runId: string) {
        return this.payrollService.lockPayroll(runId);
    }

    // 11. Unfreeze Payroll Run (REQ-PY-19)
    @Patch('runs/:id/unfreeze')
    @Roles(SystemRole.PAYROLL_MANAGER) // REQ-PY-19: Only Managers can unfreeze with justification
    async unfreezePayroll(@Param('id') runId: string, @Body() dto: UnfreezePayrollDto) {
        return this.payrollService.unfreezePayroll(runId, dto);
    }

    // 12. Resolve Anomalies (REQ-PY-20)
    @Patch('runs/:id/resolve-anomalies')
    @Roles(SystemRole.PAYROLL_MANAGER) // REQ-PY-20: Only Managers can resolve escalated irregularities
    async resolveAnomalies(@Param('id') runId: string, @Body() dto: any) {
        return this.payrollService.resolveAnomalies(runId, dto);
    }

    // === MEMBER 3 (PAYSLIP DETAILS) ===

    // 13. Get Detailed Payslip with Tax Breakdown (REQ-PY-8)
    @Get('payslips/:employeeId/run/:runId')
    @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER, SystemRole.FINANCE_STAFF, SystemRole.DEPARTMENT_EMPLOYEE) // REQ-PY-8: Payroll staff and employees can view payslips
    async getPayslipDetails(
        @Param('employeeId') employeeId: string,
        @Param('runId') runId: string
    ) {
        return this.payrollService.getPayslipDetails(employeeId, runId);
    }

    // === TEST DATA SEEDING ===

    // Seed test benefits (signing bonuses and termination benefits)
    @Post('seed/benefits')
    async seedTestBenefits() {
        return this.payrollService.seedTestBenefits();
    }

    // Clear all test data
    @Post('seed/clear')
    async clearTestData() {
        return this.payrollService.clearTestData();
    }

    // DEBUG: Manually trigger the Automatic Payroll Scheduler
    // This allows testing the "25th of the month" logic immediately
    @Post('debug/trigger-scheduler')
    @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.PAYROLL_MANAGER, SystemRole.SYSTEM_ADMIN)
    async triggerSchedulerManually(@Body() body: { date?: string }) {
        const dateOverride = body.date ? new Date(body.date) : undefined;
        return this.schedulerService.handleMonthlyPayrollRun(dateOverride);
    }
}
