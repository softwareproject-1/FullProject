import { Controller, Post, Get, Patch, Body, Param, Req, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { PayrollTrackingService } from './payroll-tracking.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { PayRefundDto } from './dto/pay-refund.dto'; 
import { claims } from './models/claims.schema';
import { CreateDisputeDto } from './dto/create-dispute.dto'; // Your new DTO
import { ResolveDisputeDto } from './dto/resolve-dispute.dto'; // Your new DTO
import { ManagerActionClaimDto } from './dto/manager-action-claim.dto';
import { ManagerActionDisputeDto } from './dto/manager-action-dispute.dto';
import { Types } from 'mongoose'; // Needed to convert hardcoded ID








// === FATMA ===

// === MAYA ===

// === ELENA ===
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('payroll-tracking')
export class PayrollTrackingController {
  constructor(private readonly trackingService: PayrollTrackingService) {}





  // 🛑 CHANGE THIS: Use the single Employee ID from Fatma's section
  private readonly DUMMY_EMPLOYEE_ID = '507f1f77bcf86cd799439011'; 
  private readonly DUMMY_ADMIN_ID = '507f1f77bcf86cd799439099';

  // === FATMA START ===
  /**
   * Submit a new reimbursement claim
   * POST /payroll-tracking/claims
   */
  @Post('claims')
  submitClaim(@Req() req, @Body() dto: CreateClaimDto): Promise<claims> {
    // const userId = req.user.userId; // TODO: Uncomment when Auth is ready
    const userId = '507f1f77bcf86cd799439011'; // Hardcoded for M2 testing
    return this.trackingService.submitClaim(userId, dto);
  }

  /**
   * Get all claims submitted by the logged-in employee
   * GET /payroll-tracking/claims/me
   */
  @Get('claims/me')
  getMyClaims(@Req() req): Promise<claims[]> {
    // const userId = req.user.userId; // TODO: Uncomment when Auth is ready
    const userId = '507f1f77bcf86cd799439011'; // Hardcoded for M2 testing
    return this.trackingService.getMyClaims(userId);
  }

  /**
   * Review and update a claim (Finance Specialist only)
   * PATCH /payroll-tracking/claims/:id/review
   * This moves claim to PENDING_MANAGER_APPROVAL or REJECTED
   */
  @Patch('claims/:id/review')
  reviewClaim(
    @Param('id') id: string,
    @Req() req,
    @Body() body: UpdateClaimDto,
  ): Promise<claims> {
    // const adminId = req.user.userId; // TODO: Uncomment when Auth is ready
    const adminId = '507f1f77bcf86cd799439099'; // Hardcoded admin ID for M2 testing
    return this.trackingService.reviewClaim(id, adminId, body);
  }

  /**
   * Manager confirms or rejects a claim (Payroll Manager only)
   * PATCH /payroll-tracking/claims/:id/manager-action
   */
  @Patch('claims/:id/manager-action')
  managerActionClaim(
    @Param('id') id: string,
    @Req() req,
    @Body() body: ManagerActionClaimDto,
  ): Promise<claims> {
    // const managerId = req.user.userId; // TODO: Uncomment when Auth is ready
    const managerId = '507f1f77bcf86cd799439088'; // Hardcoded manager ID for M2 testing
    return this.trackingService.managerActionClaim(id, managerId, body);
  }
  // === FATMA END ===





  // === MAYA START === (Disputes Management)

/**
 * Employee submits a new payroll dispute.
 * POST /payroll-tracking/disputes
 */
@Post('disputes')
submitDispute(@Body() dto: CreateDisputeDto) {
    // Use the hardcoded user ID
    return this.trackingService.submitDispute(
        new Types.ObjectId(this.DUMMY_EMPLOYEE_ID), 
        dto
    );
}

/**
 * Employee views their submitted disputes.
 * GET /payroll-tracking/disputes/me
 */
@Get('disputes/me')
getMyDisputes() {
    // Use the hardcoded user ID
    return this.trackingService.getMyDisputes(new Types.ObjectId(this.DUMMY_EMPLOYEE_ID));
}

/**
 * Payroll Specialist resolves a dispute.
 * PATCH /payroll-tracking/disputes/:id/resolve
 * This moves dispute to PENDING_MANAGER_APPROVAL or REJECTED
 */
@Patch('disputes/:id/resolve')
resolveDispute(
    @Param('id') disputeId: string, 
    @Body() dto: ResolveDisputeDto,
    @Req() req,
) {
    // Use the hardcoded admin ID for the specialist ID
    return this.trackingService.resolveDispute(
        disputeId, 
        new Types.ObjectId(this.DUMMY_ADMIN_ID), // The ID of the Payroll Specialist who resolves it
        dto
    );
}

/**
 * Manager confirms or rejects a dispute (Payroll Manager only)
 * PATCH /payroll-tracking/disputes/:id/manager-action
 */
@Patch('disputes/:id/manager-action')
managerActionDispute(
    @Param('id') disputeId: string, 
    @Body() dto: ManagerActionDisputeDto,
    @Req() req,
) {
    // const managerId = req.user.userId; // TODO: Uncomment when Auth is ready
    const managerId = '507f1f77bcf86cd799439088'; // Hardcoded manager ID for M2 testing
    return this.trackingService.managerActionDispute(
        disputeId, 
        new Types.ObjectId(managerId),
        dto
    );
}

// === MAYA END ===


  // === ELENA START ===
    
    /**
     * REQ-PY-18: Employee Self-Service - View Payslips with Full Breakdown
     * GET /payroll-tracking/payslips
     * Returns detailed earnings and deductions
     */
    @Get('payslips')
    async getMyPayslips(@Req() req) {
      // const userId = req.user.userId; // TODO: Uncomment when Auth is ready
      const userId = this.DUMMY_EMPLOYEE_ID; // Using consistent employee ID
      return this.trackingService.getMyPayslips(userId); 
    }

    /**
     * Generate Tax Certificate for Employee
     * POST /payroll-tracking/certificates/tax
     * Body: { taxYear: number }
     */
    @Post('certificates/tax')
    async generateTaxCertificate(@Req() req, @Body('taxYear') taxYear: number) {
      // const userId = req.user.userId; // TODO: Uncomment when Auth is ready
      const userId = this.DUMMY_EMPLOYEE_ID;
      return this.trackingService.generateTaxCertificate(userId, taxYear);
    }

    /**
     * Generate Insurance Certificate for Employee
     * POST /payroll-tracking/certificates/insurance
     * Body: { year: number }
     */
    @Post('certificates/insurance')
    async generateInsuranceCertificate(@Req() req, @Body('year') year: number) {
      // const userId = req.user.userId; // TODO: Uncomment when Auth is ready
      const userId = this.DUMMY_EMPLOYEE_ID;
      return this.trackingService.generateInsuranceCertificate(userId, year);
    }

    /**
     * Departmental Report for Payroll Specialists
     * GET /payroll-tracking/reports/departmental
     * Query params: startDate, endDate, department (optional)
     */
    @Get('reports/departmental')
    async getDepartmentalReport(
      @Query('startDate') startDate: string,
      @Query('endDate') endDate: string,
      @Query('department') department?: string,
    ) {
      return this.trackingService.getDepartmentalReport(
        new Date(startDate),
        new Date(endDate),
        department,
      );
    }

    /**
     * Financial Summary Report for Finance Staff
     * GET /payroll-tracking/reports/financial
     * Query params: startDate, endDate
     */
    @Get('reports/financial')
    async getFinancialReport(
      @Query('startDate') startDate: string,
      @Query('endDate') endDate: string,
    ) {
      return this.trackingService.getFinancialReport(
        new Date(startDate),
        new Date(endDate),
      );
    }

    /**
     * Tax Compliance Report
     * GET /payroll-tracking/reports/tax-compliance
     * Query params: startDate, endDate
     */
    @Get('reports/tax-compliance')
    async getTaxComplianceReport(
      @Query('startDate') startDate: string,
      @Query('endDate') endDate: string,
    ) {
      return this.trackingService.getTaxComplianceReport(
        new Date(startDate),
        new Date(endDate),
      );
    }

    /**
     * Insurance Compliance Report
     * GET /payroll-tracking/reports/insurance-compliance
     * Query params: startDate, endDate
     */
    @Get('reports/insurance-compliance')
    async getInsuranceComplianceReport(
      @Query('startDate') startDate: string,
      @Query('endDate') endDate: string,
    ) {
      return this.trackingService.getInsuranceComplianceReport(
        new Date(startDate),
        new Date(endDate),
      );
    }

    /**
     * REQ-PY-20: Finance Staff - Mark Refund as Paid
     * PATCH /payroll-tracking/refunds/:id/pay
     * Requires a valid payrollRunId in the body for audit tracking.
     */
    @Patch('refunds/:id/pay')
    async markRefundPaid(
      @Param('id') refundId: string,
      @Body() payRefundDto: PayRefundDto, // Validates payrollRunId via DTO
    ) {
      return this.trackingService.markRefundPaid(
        refundId,
        payRefundDto.payrollRunId,
      );
    }
    
  // === ELENA END ===
}

