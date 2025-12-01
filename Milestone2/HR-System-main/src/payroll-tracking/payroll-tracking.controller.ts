import { Controller, Post, Get, Patch, Body, Param, Req, Query, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollTrackingService } from './payroll-tracking.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { PayRefundDto } from './dto/pay-refund.dto'; 
import { claims } from './models/claims.schema';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { ManagerActionClaimDto } from './dto/manager-action-claim.dto';
import { ManagerActionDisputeDto } from './dto/manager-action-dispute.dto';
import { Types } from 'mongoose';
import { AuthenticationGuard } from '../auth/guards/authentication.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SystemRole } from '../employee-profile/enums/employee-profile.enums';








// === FATMA ===

// === MAYA ===

// === ELENA ===
@ApiTags('payroll-tracking')
@Controller('payroll-tracking')
@UseGuards(AuthenticationGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class PayrollTrackingController {
  constructor(private readonly trackingService: PayrollTrackingService) {}

  // Hardcoded IDs for local testing (commented out - using JWT auth now)
  // private readonly DUMMY_EMPLOYEE_ID = '507f1f77bcf86cd799439011'; 
  // private readonly DUMMY_ADMIN_ID = '507f1f77bcf86cd799439099';  // === FATMA START ===
  /**
   * Submit a new reimbursement claim
   * POST /payroll-tracking/claims
   */
  @Post('claims')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit a new reimbursement claim' })
  @ApiResponse({ status: 201, description: 'Claim submitted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  submitClaim(@Req() req, @Body() dto: CreateClaimDto): Promise<claims> {
    const userId = req.user.sub;
    return this.trackingService.submitClaim(userId, dto);
  }

  /**
   * Get all claims submitted by the logged-in employee
   * GET /payroll-tracking/claims/me
   */
  @Get('claims/me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my submitted claims' })
  @ApiResponse({ status: 200, description: 'Claims retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyClaims(@Req() req): Promise<claims[]> {
    const userId = req.user.sub;
    return this.trackingService.getMyClaims(userId);
  }

  /**
   * Review and update a claim (Finance Staff only)
   * PATCH /payroll-tracking/claims/:id/review
   * This moves claim to PENDING_MANAGER_APPROVAL or REJECTED
   */
  @Patch('claims/:id/review')
  @ApiBearerAuth('JWT-auth')
  @Roles(SystemRole.FINANCE_STAFF)
  @ApiOperation({ summary: 'Review and update a claim' })
  @ApiResponse({ status: 200, description: 'Claim reviewed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires FINANCE_STAFF role' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  reviewClaim(
    @Param('id') id: string,
    @Req() req,
    @Body() body: UpdateClaimDto,
  ): Promise<claims> {
    const adminId = req.user.sub;
    return this.trackingService.reviewClaim(id, adminId, body);
  }

  /**
   * Manager confirms or rejects a claim (Payroll Manager only)
   * PATCH /payroll-tracking/claims/:id/manager-action
   */
  @Patch('claims/:id/manager-action')
  @ApiBearerAuth('JWT-auth')
  @Roles(SystemRole.PAYROLL_MANAGER)
  @ApiOperation({ summary: 'Manager action on claim' })
  @ApiResponse({ status: 200, description: 'Claim action completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires PAYROLL_MANAGER role' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  managerActionClaim(
    @Param('id') id: string,
    @Req() req,
    @Body() body: ManagerActionClaimDto,
  ): Promise<claims> {
    const managerId = req.user.sub;
    return this.trackingService.managerActionClaim(id, managerId, body);
  }
  // === FATMA END ===





  // === MAYA START === (Disputes Management)

  /**
   * Employee submits a new payroll dispute.
   * POST /payroll-tracking/disputes
   */
  @Post('disputes')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit a new payroll dispute' })
  @ApiResponse({ status: 201, description: 'Dispute submitted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  submitDispute(@Req() req, @Body() dto: CreateDisputeDto) {
      const userId = req.user.sub;
      return this.trackingService.submitDispute(
          new Types.ObjectId(userId), 
          dto
      );
  }

  /**
   * Employee views their submitted disputes.
   * GET /payroll-tracking/disputes/me
   */
  @Get('disputes/me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my submitted disputes' })
  @ApiResponse({ status: 200, description: 'Disputes retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyDisputes(@Req() req) {
      const userId = req.user.sub;
      return this.trackingService.getMyDisputes(new Types.ObjectId(userId));
  }

  /**
   * Payroll Specialist resolves a dispute.
   * PATCH /payroll-tracking/disputes/:id/resolve
   * This moves dispute to PENDING_MANAGER_APPROVAL or REJECTED
   */
  @Patch('disputes/:id/resolve')
  @ApiBearerAuth('JWT-auth')
  @Roles(SystemRole.PAYROLL_SPECIALIST)
  @ApiOperation({ summary: 'Resolve a payroll dispute' })
  @ApiResponse({ status: 200, description: 'Dispute resolved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires PAYROLL_SPECIALIST role' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  resolveDispute(
      @Param('id') disputeId: string, 
      @Body() dto: ResolveDisputeDto,
      @Req() req,
  ) {
      const specialistId = req.user.sub;
      return this.trackingService.resolveDispute(
          disputeId, 
          new Types.ObjectId(specialistId),
          dto
      );
  }

  /**
   * Manager confirms or rejects a dispute (Payroll Manager only)
   * PATCH /payroll-tracking/disputes/:id/manager-action
   */
  @Patch('disputes/:id/manager-action')
  @ApiBearerAuth('JWT-auth')
  @Roles(SystemRole.PAYROLL_MANAGER)
  @ApiOperation({ summary: 'Manager action on dispute' })
  @ApiResponse({ status: 200, description: 'Dispute action completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires PAYROLL_MANAGER role' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  managerActionDispute(
      @Param('id') disputeId: string, 
      @Body() dto: ManagerActionDisputeDto,
      @Req() req,
  ) {
      const managerId = req.user.sub;
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
   * Includes notification integration for new payslip availability
   */
  @Get('payslips')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my payslips with notification on new payslip availability' })
  @ApiResponse({ status: 200, description: 'Payslips retrieved successfully. Notification sent if new payslip detected.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyPayslips(@Req() req) {
    const userId = req.user.sub;
    return this.trackingService.getMyPayslips(userId); 
  }

  /**
   * REQ-PY-6: View Salary History with Year-over-Year Comparison
   * GET /payroll-tracking/salary-history
   * Query: ?years=3 (default 3 years)
   * Returns historical salary records grouped by year with percentage changes
   */
  @Get('salary-history')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'View salary history with year-over-year comparison' })
  @ApiResponse({ status: 200, description: 'Salary history retrieved successfully with YoY analysis' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSalaryHistory(@Req() req, @Query('years') years?: number) {
    const userId = req.user.sub;
    const yearsToRetrieve = years ? parseInt(years.toString(), 10) : 3;
    return this.trackingService.getSalaryHistory(userId, yearsToRetrieve);
  }

  /**
   * Generate Tax Certificate for Employee
   * POST /payroll-tracking/certificates/tax
   * Body: { taxYear: number }
   */
  @Post('certificates/tax')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Generate tax certificate' })
  @ApiResponse({ status: 201, description: 'Tax certificate generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateTaxCertificate(@Req() req, @Body('taxYear') taxYear: number) {
    const userId = req.user.sub;
    return this.trackingService.generateTaxCertificate(userId, taxYear);
  }

  /**
   * Generate Insurance Certificate for Employee
   * POST /payroll-tracking/certificates/insurance
   * Body: { year: number }
   */
  @Post('certificates/insurance')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Generate insurance certificate' })
  @ApiResponse({ status: 201, description: 'Insurance certificate generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateInsuranceCertificate(@Req() req, @Body('year') year: number) {
    const userId = req.user.sub;
    return this.trackingService.generateInsuranceCertificate(userId, year);
  }

  /**
   * Departmental Report for Payroll Specialists
   * GET /payroll-tracking/reports/departmental
   * Query params: startDate, endDate, department (optional)
   */
  @Get('reports/departmental')
  @ApiBearerAuth('JWT-auth')
  @Roles(SystemRole.PAYROLL_SPECIALIST, SystemRole.FINANCE_STAFF, SystemRole.PAYROLL_MANAGER)
  @ApiOperation({ summary: 'Get departmental payroll report' })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires appropriate role' })
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
  @ApiBearerAuth('JWT-auth')
  @Roles(SystemRole.FINANCE_STAFF, SystemRole.PAYROLL_MANAGER)
  @ApiOperation({ summary: 'Get financial summary report' })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires FINANCE_STAFF or PAYROLL_MANAGER role' })
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
  @ApiBearerAuth('JWT-auth')
  @Roles(SystemRole.FINANCE_STAFF, SystemRole.PAYROLL_MANAGER)
  @ApiOperation({ summary: 'Get tax compliance report' })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires FINANCE_STAFF or PAYROLL_MANAGER role' })
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
  @ApiBearerAuth('JWT-auth')
  @Roles(SystemRole.FINANCE_STAFF, SystemRole.PAYROLL_MANAGER)
  @ApiOperation({ summary: 'Get insurance compliance report' })
  @ApiResponse({ status: 200, description: 'Report generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires FINANCE_STAFF or PAYROLL_MANAGER role' })
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
  @ApiBearerAuth('JWT-auth')
  @Roles(SystemRole.FINANCE_STAFF)
  @ApiOperation({ summary: 'Mark refund as paid' })
  @ApiResponse({ status: 200, description: 'Refund marked as paid successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires FINANCE_STAFF role' })
  @ApiResponse({ status: 404, description: 'Refund not found' })
  async markRefundPaid(
    @Param('id') refundId: string,
    @Body() payRefundDto: PayRefundDto,
  ) {
    return this.trackingService.markRefundPaid(
      refundId,
      payRefundDto.payrollRunId,
    );
  }
    
  // === ELENA END ===
}

