import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollTrackingService } from './payroll-tracking.service';
import { AuthenticationGuard } from '../auth/guards/authentication.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SystemRole } from '../employee-profile/enums/employee-profile.enums';
import { claims } from './models/claims.schema';
import { disputes } from './models/disputes.schema';
import { RejectItemDto } from './dto/reject-item.dto';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ProcessDisputeRefundDto } from './dto/process-dispute-refund.dto';

@ApiTags('finance')
@Controller('finance')
@UseGuards(AuthenticationGuard, RolesGuard)
export class FinanceController {
    constructor(private readonly trackingService: PayrollTrackingService) { }

    // ==================== CLAIMS ====================

    /**
     * Get Manager-Approved Claims for Finance Processing
     * GET /finance/claims/approved
     */
    @Get('claims/approved')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.FINANCE_STAFF)
    @ApiOperation({ summary: 'Get approved claims awaiting refund processing' })
    @ApiResponse({ status: 200, description: 'Claims retrieved successfully' })
    getAllApprovedClaims(): Promise<claims[]> {
        return this.trackingService.getApprovedClaims();
    }

    /**
     * Get Single Claim by ID
     * GET /finance/claims/:id
     */
    @Get('claims/:id')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.FINANCE_STAFF)
    @ApiOperation({ summary: 'Get claim details' })
    @ApiResponse({ status: 200, description: 'Claim retrieved successfully' })
    getClaimById(@Param('id') id: string): Promise<claims> {
        return this.trackingService.getClaimById(id);
    }

    /**
     * Process Refund for Approved Claim
     * POST /finance/claims/:id/process
     */
    @Post('claims/:id/process')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.FINANCE_STAFF)
    @ApiOperation({ summary: 'Process refund for an approved claim' })
    @ApiResponse({ status: 201, description: 'Refund processed successfully' })
    processClaimRefund(@Param('id') id: string, @Req() req): Promise<claims> {
        const financeId = req.user.sub;
        return this.trackingService.processClaimRefund(id, financeId);
    }

    /**
     * Reject Approved Claim (if finance issues found)
     * POST /finance/claims/:id/reject
     */
    @Post('claims/:id/reject')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.FINANCE_STAFF)
    @ApiOperation({ summary: 'Reject an approved claim' })
    @ApiResponse({ status: 201, description: 'Claim rejected successfully' })
    rejectClaim(
        @Param('id') id: string,
        @Body() dto: RejectItemDto,
        @Req() req
    ): Promise<claims> {
        const financeId = req.user.sub;
        return this.trackingService.rejectClaim(id, financeId, dto.reason);
    }


    // ==================== DISPUTES ====================

    /**
     * Get Manager-Approved Disputes for Finance Processing
     * GET /finance/disputes/approved
     */
    @Get('disputes/approved')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.FINANCE_STAFF)
    @ApiOperation({ summary: 'Get approved disputes awaiting refund processing' })
    @ApiResponse({ status: 200, description: 'Disputes retrieved successfully' })
    getAllApprovedDisputes(): Promise<disputes[]> {
        return this.trackingService.getApprovedDisputes();
    }

    /**
     * Get Single Dispute by ID
     * GET /finance/disputes/:id
     */
    @Get('disputes/:id')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.FINANCE_STAFF)
    @ApiOperation({ summary: 'Get dispute details' })
    @ApiResponse({ status: 200, description: 'Dispute retrieved successfully' })
    getDisputeById(@Param('id') id: string): Promise<disputes> {
        return this.trackingService.getDisputeById(id);
    }

    /**
     * Process Refund for Approved Dispute
     * POST /finance/disputes/:id/process
     */
    @Post('disputes/:id/process')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.FINANCE_STAFF)
    @ApiOperation({ summary: 'Process refund for an approved dispute' })
    @ApiResponse({ status: 201, description: 'Refund processed successfully' })
    processDisputeRefund(
        @Param('id') id: string,
        @Body() dto: ProcessDisputeRefundDto,
        @Req() req
    ): Promise<disputes> {
        const financeId = req.user.sub;
        return this.trackingService.processDisputeRefund(id, financeId, dto.refundAmount);
    }

    /**
     * Reject Approved Dispute
     * POST /finance/disputes/:id/reject
     */
    @Post('disputes/:id/reject')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.FINANCE_STAFF)
    @ApiOperation({ summary: 'Reject an approved dispute' })
    @ApiResponse({ status: 201, description: 'Dispute rejected successfully' })
    rejectDispute(
        @Param('id') id: string,
        @Body() dto: RejectItemDto,
        @Req() req
    ): Promise<disputes> {
        const financeId = req.user.sub;
        return this.trackingService.rejectDispute(id, financeId, dto.reason);
    }
    // ==================== COMPLIANCE REPORTS ====================

    /**
     * Generate Tax Compliance Report
     * POST /finance/reports/compliance/tax
     */
    @Post('reports/compliance/tax')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.FINANCE_STAFF)
    @ApiOperation({ summary: 'Generate tax compliance report' })
    @ApiResponse({ status: 200, description: 'Tax compliance report generated' })
    getTaxComplianceReport(@Body() dto: GenerateReportDto): Promise<any> {
        return this.trackingService.getTaxComplianceReport(new Date(dto.startDate), new Date(dto.endDate));
    }

    /**
     * Generate Insurance Compliance Report
     * POST /finance/reports/compliance/insurance
     */
    @Post('reports/compliance/insurance')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.FINANCE_STAFF)
    @ApiOperation({ summary: 'Generate insurance compliance report' })
    @ApiResponse({ status: 200, description: 'Insurance compliance report generated' })
    getInsuranceComplianceReport(@Body() dto: GenerateReportDto): Promise<any> {
        return this.trackingService.getInsuranceComplianceReport(new Date(dto.startDate), new Date(dto.endDate));
    }

    /**
     * Generate Benefits Report
     * POST /finance/reports/compliance/benefits
     */
    @Post('reports/compliance/benefits')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.FINANCE_STAFF)
    @ApiOperation({ summary: 'Generate benefits report' })
    @ApiResponse({ status: 200, description: 'Benefits report generated' })
    getBenefitsReport(@Body() dto: GenerateReportDto): Promise<any> {
        return this.trackingService.getBenefitsReport(new Date(dto.startDate), new Date(dto.endDate));
    }

    // ==================== FINANCIAL SUMMARIES ====================

    /**
     * Generate Financial Summary Report
     * POST /finance/reports/summary/financial
     */
    @Post('reports/summary/financial')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.FINANCE_STAFF)
    @ApiOperation({ summary: 'Generate financial summary report (Payroll Costs)' })
    @ApiResponse({ status: 200, description: 'Financial summary report generated' })
    getFinancialReport(@Body() dto: GenerateReportDto): Promise<any> {
        return this.trackingService.getFinancialReport(new Date(dto.startDate), new Date(dto.endDate));
    }
}
