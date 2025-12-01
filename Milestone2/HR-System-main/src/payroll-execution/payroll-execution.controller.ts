import { Controller, Post, Patch, Body, Get, Param, Req, UseGuards } from '@nestjs/common';
import { PayrollExecutionService } from './payroll-execution.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// DTOs
import { InitiateRunDto } from './dto/initiate-run.dto';
import { ReviewBenefitDto } from './dto/review-benefit.dto';
import { PeriodReviewDto } from './dto/period-review.dto';
import { HrEventCheckDto } from './dto/hr-event-check.dto';
import { ManualAdjustmentDto } from './dto/manual-adjustment.dto';
import { ReviewActionDto } from './dto/review-action.dto';
import { UnfreezePayrollDto } from './dto/unfreeze-payroll.dto';

@Controller('payroll-execution')
@UseGuards(AuthGuard('jwt'), RolesGuard) // Apply authentication and role-based authorization to all routes
export class PayrollExecutionController {
    constructor(private readonly payrollService: PayrollExecutionService) { }

    // GANNAH: INITIATION & DRAFT GENERATION

    // 1. Pre-Run: List Pending Benefits (Bonuses/Terminations)
    @Get('benefits/pending')
    @Roles('Payroll Specialist', 'Payroll Manager') // Phase 0: Specialists review benefits before run
    async getPendingBenefits() {
        return this.payrollService.getPendingBenefits();
    }

    // 2. Pre-Run: Review a Benefit (Approve/Reject)
    @Patch('benefits/review')
    @Roles('Payroll Specialist') // Phase 0: Only Specialists can approve/reject benefits
    async reviewBenefit(@Body() dto: ReviewBenefitDto) {
        return this.payrollService.reviewBenefit(dto);
    }

    // 3. Manual Check for HR Events (New Hire / Termination Status)
    @Post('events/check')
    @Roles('Payroll Specialist', 'Payroll Manager') // Phase 0: Check employee HR events
    async checkEmployeeEvent(@Body() dto: HrEventCheckDto) {
        return this.payrollService.checkHrEvent(dto);
    }

    // 4. Initiate Period (Creates Draft Run)
    @Post('period')
    @Roles('Payroll Specialist') // Phase 1: Only Specialists can initiate payroll runs
    async initiatePeriod(@Body() dto: InitiateRunDto, @Req() req: any) {
        // Use authenticated user if present; otherwise a fixed test ObjectId
        const specialistId = (req && req.user && req.user.userId);
           // ? req.user.userId;
            //: '64f1b2b3e4b0a1a2b3c4d999';
        return this.payrollService.initiatePeriod(dto, specialistId);
    }

    // 5. Review Period -> Triggers "Fetch Eligible Employees"
    @Patch('period/review')
    @Roles('Payroll Specialist') // Phase 1: Specialists approve/reject payroll period
    async reviewPeriod(@Body() dto: PeriodReviewDto) {
        return this.payrollService.reviewPeriod(dto);
    }

    // 6. Get Eligible Employees for a Draft Run
    @Get('drafts/:runId/employees')
    @Roles('Payroll Specialist', 'Payroll Manager', 'Finance Staff') // Phase 1.1: All payroll roles can view draft
    async getDraftEmployees(@Param('runId') runId: string) {
        return this.payrollService.fetchEligibleEmployees(runId);
    }

    // ==================== MEMBER 2 (CALCULATION) START ====================

    // 7. Run Calculations for a Payroll Run
    @Post('runs/:runId/calculate')
    @Roles('Payroll Specialist') // Phase 1.1.B: Only Specialists can trigger salary calculations
    async processRunCalculations(@Param('runId') runId: string) {
        return this.payrollService.processRunCalculations(runId);
    }

    // 8. Add Manual Adjustment to a Payslip
    @Patch('payslips/:id/adjust')
    @Roles('Payroll Specialist', 'Payroll Manager') // Manual adjustments require Specialist or Manager authority
    async addManualAdjustment(
        @Param('id') payslipId: string,
        @Body() manualAdjustmentDto: ManualAdjustmentDto
    ) {
        return this.payrollService.addManualAdjustment(payslipId, manualAdjustmentDto);
    }


// Add to PayrollExecutionController
@Get('test/db-status')
@Roles('Payroll Manager', 'Finance Staff') // Debug: Only senior staff can check database status
async testDatabaseStatus() {
    return this.payrollService.debugDatabaseStatus();
}

@Get('debug/employees-data')
@Roles('Payroll Manager', 'Finance Staff') // Debug: Only senior staff can view raw employee data
async debugEmployeesData() {
    return this.payrollService.debugEmployeesCollection();
}


@Get('debug/run/:runId/employees')
@Roles('Payroll Specialist', 'Payroll Manager', 'Finance Staff') // Debug: All payroll roles can debug run data
async debugRunEmployees(@Param('runId') runId: string) {
    return this.payrollService.debugRunEmployees(runId);
}


@Get('runs/:runId/payslips')
@Roles('Payroll Specialist', 'Payroll Manager', 'Finance Staff') // All payroll roles can view run payslips
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
    @Roles('Payroll Specialist') // Phase 2: Specialists submit for manager review after validation
    async submitForApproval(@Param('id') runId: string) {
        return this.payrollService.submitForApproval(runId);
    }

    // 8. Manager Review (Approve/Reject)
    @Patch('runs/:id/manager-review')
    @Roles('Payroll Manager') // Phase 3: Only Managers can approve/reject payroll runs
    async managerReview(@Param('id') runId: string, @Body() dto: ReviewActionDto) {
        return this.payrollService.managerReview(runId, dto);
    }

    // NEW: Finance Review (Approve/Reject) - REQ-PY-15
    @Patch('runs/:id/finance-review')
    @Roles('Finance Staff') // Phase 3: Finance Staff final approval before execution
    async financeReview(@Param('id') runId: string, @Body() dto: ReviewActionDto) {
        return this.payrollService.financeReview(runId, dto);
    }

    // NEW: Preview Dashboard - REQ-PY-6
    @Get('runs/:id/preview')
    @Roles('Payroll Specialist', 'Payroll Manager', 'Finance Staff') // REQ-PY-6: Preview dashboard for all payroll roles
    async getPayrollPreview(@Param('id') runId: string) {
        return this.payrollService.getPayrollPreview(runId);
    }

    // 9. Finance Execute & Distribute Payslips (REQ-PY-8)
    @Patch('runs/:id/execute-and-distribute')
    @Roles('Finance Staff') // Phase 5: Only Finance Staff can execute final payment and distribution
    async executeAndDistribute(@Param('id') runId: string) {
        return this.payrollService.executeAndDistribute(runId);
    }

    // === MEMBER 3 (LOCK/FREEZE MANAGEMENT) ===

    // 10. Lock/Freeze Payroll Run (REQ-PY-7)
    @Patch('runs/:id/lock')
    @Roles('Payroll Manager') // REQ-PY-7: Only Managers can lock/freeze payroll runs
    async lockPayroll(@Param('id') runId: string) {
        return this.payrollService.lockPayroll(runId);
    }

    // 11. Unfreeze Payroll Run (REQ-PY-19)
    @Patch('runs/:id/unfreeze')
    @Roles('Payroll Manager') // REQ-PY-19: Only Managers can unfreeze with justification
    async unfreezePayroll(@Param('id') runId: string, @Body() dto: UnfreezePayrollDto) {
        return this.payrollService.unfreezePayroll(runId, dto);
    }

    // === MEMBER 3 (PAYSLIP DETAILS) ===

    // 12. Get Detailed Payslip with Tax Breakdown (REQ-PY-8)
    @Get('payslips/:employeeId/run/:runId')
    @Roles('Payroll Specialist', 'Payroll Manager', 'Finance Staff', 'Employee') // REQ-PY-8: Payroll staff and employees can view payslips
    async getPayslipDetails(
        @Param('employeeId') employeeId: string,
        @Param('runId') runId: string
    ) {
        return this.payrollService.getPayslipDetails(employeeId, runId);
    }
}