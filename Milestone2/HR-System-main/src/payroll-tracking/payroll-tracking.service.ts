import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PayGradesService } from '../payroll-configuration/services/pay-grades.service';
import { AllowanceService } from '../payroll-configuration/services/allowance.service';
import { TaxRulesService } from '../payroll-configuration/services/tax-rules.service';
import { InsuranceBracketsService } from '../payroll-configuration/services/insurance-brackets.service';
import { CompanySettingsService } from '../payroll-configuration/services/company-settings.service';
import { claims, claimsDocument } from './models/claims.schema';
import { NotificationLog, NotificationLogDocument } from '../time-management/models/notification-log.schema';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { ClaimStatus } from './enums/payroll-tracking-enum';
import { ManagerActionClaimDto } from './dto/manager-action-claim.dto';
import { ManagerActionDisputeDto } from './dto/manager-action-dispute.dto';
import { refunds as Refund, refundsDocument as RefundDocument } from './models/refunds.schema';
import { paySlip, PayslipDocument } from '../payroll-execution/models/payslip.schema';
import { RefundStatus } from './enums/payroll-tracking-enum';
import { disputes as Dispute, disputesDocument as DisputeDocument } from './models/disputes.schema';
import { DisputeStatus } from './enums/payroll-tracking-enum';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { EmployeeProfile, EmployeeProfileDocument } from '../employee-profile/models/employee-profile.schema';
import { EmployeeProfileService } from '../employee-profile/employee-profile.service';
import { TimeImpactDataDto, PenaltyItemDto, OvertimeItemDto, PermissionItemDto, PenaltyType, TimeItemStatus, OvertimeRateType } from './dto/time-impact.dto';
import PDFDocument = require('pdfkit');

@Injectable()
export class PayrollTrackingService {
  private readonly MINIMUM_WAGE = 3000; // Egyptian minimum wage (BR 60)
  private readonly TIME_MANAGEMENT_BASE_URL = 'http://localhost:3000'; // Same server

  constructor(
    @InjectModel(Refund.name) private refundsModel: Model<RefundDocument>,
    @InjectModel(claims.name) private claimModel: Model<claimsDocument>,
    @InjectModel(Dispute.name) private disputeModel: Model<DisputeDocument>,
    @InjectModel(paySlip.name) private payslipModel: Model<PayslipDocument>,
    @InjectModel(EmployeeProfile.name) private employeeModel: Model<EmployeeProfileDocument>,
    @InjectModel(NotificationLog.name) private notificationLogModel: Model<NotificationLogDocument>,
    private employeeProfileService: EmployeeProfileService,
    private httpService: HttpService,
    // Payroll Configuration Services
    private payGradesService: PayGradesService,
    private allowanceService: AllowanceService,
    private taxRulesService: TaxRulesService,
    private insuranceBracketsService: InsuranceBracketsService,
    private companySettingsService: CompanySettingsService,
  ) { }

  // === FATMA START ===
  /**
   * Submit a new reimbursement claim
   * @param userId - Employee ID from JWT
   * @param dto - Claim creation data
   * @returns The created claim document
   */
  async submitClaim(userId: string, dto: CreateClaimDto): Promise<claims> {
    // Verify employee exists
    const employee = await this.employeeProfileService.getProfileById(userId);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const newClaim = new this.claimModel({
      claimId: `CLM-${Date.now()}`,
      employeeId: new Types.ObjectId(userId),
      description: dto.description,
      claimType: dto.claimType,
      amount: dto.amount,
      status: ClaimStatus.UNDER_REVIEW,
    });

    return await newClaim.save();
  }

  /**
   * Get all claims submitted by the logged-in employee
   * @param userId - Employee ID from JWT
   * @returns Array of claims sorted by newest first
   */
  async getMyClaims(userId: string): Promise<claims[]> {
    return await this.claimModel
      .find({ employeeId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get ALL pending claims for Payroll Specialist/Finance Staff to review
   * Returns claims with status UNDER_REVIEW
   * @returns Array of all pending claims sorted by newest first
   */
  async getAllPendingClaims(): Promise<claims[]> {
    return await this.claimModel
      .find({ status: ClaimStatus.UNDER_REVIEW })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get ALL claims (any status) for reporting purposes
   * @returns Array of all claims sorted by newest first
   */
  async getAllClaims(): Promise<claims[]> {
    return await this.claimModel
      .find({})
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get claims approved by specialist awaiting manager confirmation
   * @returns Array of specialist-approved claims
   */
  async getSpecialistApprovedClaims(): Promise<claims[]> {
    return await this.claimModel
      .find({ status: ClaimStatus.PENDING_MANAGER_APPROVAL })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get a single claim by ID
   * @param claimId - Claim ObjectId
   * @returns Single claim or throws NotFoundException
   */
  async getClaimById(claimId: string): Promise<claims> {
    const claim = await this.claimModel.findById(claimId).exec();
    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }
    return claim;
  }

  /**
   * Review and update a claim (Finance Staff / Admin only)
   * @param claimId - The claim ID to review
   * @param adminId - Finance staff ID from JWT
   * @param dto - Update data (status, rejectionReason)
   * @returns The updated claim document
   */
  async reviewClaim(
    claimId: string,
    adminId: string,
    dto: UpdateClaimDto,
  ): Promise<claims> {
    // Find the claim first to ensure it exists
    const claim = await this.claimModel.findById(claimId).exec();

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }

    // Update the claim - Specialist can only approve (move to PENDING_MANAGER_APPROVAL) or reject
    let newStatus = dto.status;
    if (dto.status === ClaimStatus.APPROVED) {
      // Specialist approval moves to PENDING_MANAGER_APPROVAL instead of APPROVED
      newStatus = ClaimStatus.PENDING_MANAGER_APPROVAL;
    }

    const updatedClaim = await this.claimModel
      .findByIdAndUpdate(
        claim._id,
        {
          status: newStatus,
          rejectionReason: dto.rejectionReason,
          financeStaffId: new Types.ObjectId(adminId),
        },
        { new: true },
      )
      .exec();

    if (!updatedClaim) {
      throw new NotFoundException(`Failed to update claim with ID ${claimId}`);
    }

    // NOTE: Refund is NOT created here anymore. It's created by manager confirmation.

    return updatedClaim;
  }

  /**
   * Manager confirms or rejects a claim that is PENDING_MANAGER_APPROVAL
   * @param claimId - The claim ID to take action on
   * @param managerId - Manager ID from JWT
   * @param dto - Manager action (confirm/reject)
   * @returns The updated claim document
   */
  async managerActionClaim(
    claimId: string,
    managerId: string,
    dto: ManagerActionClaimDto,
  ): Promise<claims> {
    // Find the claim first
    const claim = await this.claimModel.findById(claimId).exec();

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }

    // Verify claim is in the correct state
    if (claim.status !== ClaimStatus.PENDING_MANAGER_APPROVAL) {
      throw new BadRequestException(
        `Claim must be in PENDING_MANAGER_APPROVAL status. Current status: ${claim.status}`,
      );
    }

    let finalStatus: ClaimStatus;
    let rejectionReason: string | undefined;

    if (dto.action === 'confirm') {
      finalStatus = ClaimStatus.APPROVED;
      finalStatus = ClaimStatus.APPROVED;
      // Refund will be created by Finance Staff

    } else {
      // reject
      finalStatus = ClaimStatus.REJECTED;
      rejectionReason = dto.rejectionReason || 'Rejected by manager';
    }

    // Update the claim with manager's decision
    const updatedClaim = await this.claimModel
      .findByIdAndUpdate(
        claim._id,
        {
          status: finalStatus,
          rejectionReason,
        },
        { new: true },
      )
      .exec();

    if (!updatedClaim) {
      throw new NotFoundException(`Failed to update claim with ID ${claimId}`);
    }

    return updatedClaim;
  }

  /**
   * Get claims approved by manager awaiting finance processing
   */
  async getApprovedClaims(): Promise<claims[]> {
    return await this.claimModel
      .find({ status: ClaimStatus.APPROVED })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Finance Staff processes a claim refund
   */
  async processClaimRefund(claimId: string, financeId: string): Promise<claims> {
    const claim = await this.claimModel.findById(claimId).exec();
    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }

    if (claim.status !== ClaimStatus.APPROVED) {
      throw new BadRequestException(`Claim must be in APPROVED status. Current status: ${claim.status}`);
    }

    // Create refund
    await this.createRefundInternal(
      claim._id as Types.ObjectId,
      'Claim',
      claim.amount,
      claim.employeeId,
    );

    // Update claim status to COMPLETED
    const updatedClaim = await this.claimModel.findByIdAndUpdate(
      claim._id,
      {
        status: ClaimStatus.COMPLETED,
        financeStaffId: new Types.ObjectId(financeId),
      },
      { new: true }
    ).exec();

    if (!updatedClaim) throw new NotFoundException('Claim not found after update');
    return updatedClaim;
  }

  /**
   * Finance Staff rejects a claim
   */
  async rejectClaim(claimId: string, financeId: string, reason: string): Promise<claims> {
    const claim = await this.claimModel.findById(claimId).exec();
    if (!claim) {
      throw new NotFoundException(`Claim with ID ${claimId} not found`);
    }

    const updatedClaim = await this.claimModel.findByIdAndUpdate(
      claim._id,
      {
        status: ClaimStatus.REJECTED,
        rejectionReason: reason,
        financeStaffId: new Types.ObjectId(financeId),
      },
      { new: true }
    ).exec();

    if (!updatedClaim) throw new NotFoundException('Claim not found after update');
    return updatedClaim;
  }
  // === FATMA END ===

  // === ELENA START ===

  /** * 1. Creates a Refund document with status PENDING.
   * Called INTERNALLY by the service when a Claim (Fatma) or Dispute (Maya) is approved.
   * NOTE: This method signature matches Fatma's call in reviewClaim.
   */
  private async createRefundInternal(
    sourceId: Types.ObjectId,
    type: 'Claim' | 'Dispute', // Type of the source document
    amount: number,
    empId: Types.ObjectId, // Employee ID
  ): Promise<Refund> {

    let description: string;
    let newRefundData;

    if (type === 'Dispute') {
      description = 'Payroll Dispute Approved';
      newRefundData = {
        employeeId: empId,
        refundDetails: {
          description: description,
          amount: amount,
        },
        status: RefundStatus.PENDING,
        disputeId: sourceId, // Link to the approved Dispute document
      };
    } else if (type === 'Claim') {
      description = 'Expense Claim Approved';
      newRefundData = {
        employeeId: empId,
        refundDetails: {
          description: description,
          amount: amount,
        },
        status: RefundStatus.PENDING,
        claimId: sourceId, // Link to the approved Claim document
      };
    } else {
      // Safety check
      throw new InternalServerErrorException('Invalid refund source type.');
    }
    // This block must be at the end of the function logic
    try {
      const newRefund = new this.refundsModel(newRefundData);
      return newRefund.save(); // <-- THIS LINE fulfills the Promise<Refund> contract
    } catch (error) {
      throw new InternalServerErrorException('Failed to create internal refund document.');
    }
  }

  /** * 2. Used by Finance staff (API endpoint) to update a pending refund to PAID.
   * @param refundId - The ID of the Refund document to update.
   * @param payrollRunId - The payroll run ID used for payment.
   */
  async markRefundPaid(refundId: string, payrollRunId: string): Promise<Refund> {

    // Find and update the refund status and link the payroll run ID
    const updatedRefund = await this.refundsModel.findByIdAndUpdate(
      refundId,
      {
        status: RefundStatus.PAID,
        paidInPayrollRunId: new Types.ObjectId(payrollRunId),
      },
      { new: true } // Returns the updated document
    ).exec();

    if (!updatedRefund) {
      throw new NotFoundException(`Refund with ID ${refundId} not found.`);
    }

    return updatedRefund;
  }

  /** 
   * 3. Returns a list of payslips for the logged-in employee with full breakdown.
   * Returns detailed earnings (base salary, allowances, bonuses, benefits, refunds)
   * and deductions (taxes, insurance, penalties) from payslip schema.
   * 
   * REQ-PY-18: Sends notification when new payslip is detected.
   */
  async getMyPayslips(userId: string): Promise<any[]> {
    // Query payslips for the employee
    const payslips = await this.payslipModel
      .find({ employeeId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();

    // REQ-PY-18: Check for new payslips and send notification
    if (payslips.length > 0) {
      const latestPayslip = payslips[0] as any; // Type cast for timestamp access
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // If payslip was created in the last 24 hours, it's considered "new"
      if (latestPayslip.createdAt && new Date(latestPayslip.createdAt) > oneDayAgo) {
        // Check if notification already sent for this payslip
        const existingNotification = await this.notificationLogModel.findOne({
          to: new Types.ObjectId(userId),
          type: 'PAYSLIP_AVAILABLE',
          message: { $regex: latestPayslip._id.toString() },
        }).exec();

        if (!existingNotification) {
          // Send notification
          await this.notificationLogModel.create({
            to: new Types.ObjectId(userId),
            type: 'PAYSLIP_AVAILABLE',
            message: `Your payslip for ${latestPayslip.createdAt?.toLocaleDateString() || 'the current period'} is now available. Payslip ID: ${latestPayslip._id}`,
          });
        }
      }
    }

    // Transform to include full breakdown as required
    return payslips.map(payslip => ({
      _id: payslip._id,
      employeeId: payslip.employeeId,
      payrollRunId: payslip.payrollRunId,
      createdAt: (payslip as any).createdAt,
      // Earnings breakdown
      earnings: {
        baseSalary: payslip.earningsDetails?.baseSalary || 0,
        allowances: payslip.earningsDetails?.allowances || [],
        bonuses: payslip.earningsDetails?.bonuses || [],
        benefits: payslip.earningsDetails?.benefits || [],
        refunds: payslip.earningsDetails?.refunds || [],
      },
      // Deductions breakdown
      deductions: {
        taxes: payslip.deductionsDetails?.taxes || [],
        insurance: payslip.deductionsDetails?.insurances || [],
        penalties: payslip.deductionsDetails?.penalties || null,
      },
      // Summary totals
      totalGrossSalary: payslip.totalGrossSalary,
      totalDeductions: payslip.totaDeductions || 0,
      netPay: payslip.netPay,
      paymentStatus: payslip.paymentStatus,
    }));
  }

  /**
   * Get a specific payslip by ID for the logged-in employee
   * Ensures the payslip belongs to the requesting user
   */
  async getPayslipById(userId: string, payslipId: string): Promise<any> {
    const payslip = await this.payslipModel
      .findOne({
        _id: new Types.ObjectId(payslipId),
        employeeId: new Types.ObjectId(userId),
      })
      .exec();

    if (!payslip) {
      throw new NotFoundException(`Payslip with ID ${payslipId} not found or access denied`);
    }

    // Transform to match the format expected by frontend
    return {
      _id: payslip._id,
      employeeId: payslip.employeeId,
      payrollRunId: payslip.payrollRunId,
      createdAt: (payslip as any).createdAt,
      // Earnings breakdown
      earnings: {
        baseSalary: payslip.earningsDetails?.baseSalary || 0,
        allowances: payslip.earningsDetails?.allowances || [],
        bonuses: payslip.earningsDetails?.bonuses || [],
        benefits: payslip.earningsDetails?.benefits || [],
        refunds: payslip.earningsDetails?.refunds || [],
      },
      // Deductions breakdown
      deductions: {
        taxes: payslip.deductionsDetails?.taxes || [],
        insurance: payslip.deductionsDetails?.insurances || [],
        penalties: payslip.deductionsDetails?.penalties || null,
      },
      // Summary totals
      totalGrossSalary: payslip.totalGrossSalary,
      totalDeductions: payslip.totaDeductions || 0,
      netPay: payslip.netPay,
      paymentStatus: payslip.paymentStatus,
    };
  }

  /**
   * Generate payslip PDF for download
   * Returns formatted PDF with full payslip details
   */
  async generatePayslipPDF(userId: string, payslipId: string): Promise<Buffer> {
    const payslip = await this.payslipModel
      .findOne({
        _id: new Types.ObjectId(payslipId),
        employeeId: new Types.ObjectId(userId),
      })
      .exec();

    if (!payslip) {
      throw new NotFoundException(`Payslip with ID ${payslipId} not found or access denied`);
    }

    // Fetch employee details
    const employee = await this.employeeProfileService.getProfileById(userId);
    const employeeName = `${employee.firstName} ${employee.lastName}`;

    // Extract data
    const baseSalary = payslip.earningsDetails?.baseSalary || 0;
    const allowances = payslip.earningsDetails?.allowances || [];
    const bonuses = payslip.earningsDetails?.bonuses || [];
    const benefits = payslip.earningsDetails?.benefits || [];
    const refunds = payslip.earningsDetails?.refunds || [];
    const taxes = payslip.deductionsDetails?.taxes || [];
    const insurances = payslip.deductionsDetails?.insurances || [];
    const penalties = payslip.deductionsDetails?.penalties || null;

    // Generate PDF
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(22).text('PAYSLIP', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Pay Period: ${new Date((payslip as any).createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`, {
        align: 'center',
      });
      doc.moveDown(0.3);
      doc.fontSize(10).text(`Status: ${payslip.paymentStatus}`, { align: 'center' });
      doc.moveDown(2);

      // Employee Information
      doc.fontSize(12).text('Employee Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Name: ${employeeName}`);
      doc.text(`Employee ID: ${userId}`);
      doc.text(`Payslip ID: ${payslipId}`);
      doc.moveDown(1.5);

      // Summary Box
      doc.fontSize(12).text('Payment Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      doc.text(`Gross Salary: EGP ${payslip.totalGrossSalary.toFixed(2)}`);
      doc.text(`Total Deductions: EGP ${(payslip.totaDeductions || 0).toFixed(2)}`);
      doc.fontSize(14).fillColor('blue').text(`Net Pay: EGP ${payslip.netPay.toFixed(2)} `);
      doc.fillColor('black').fontSize(10);
      doc.moveDown(1.5);

      // Earnings Breakdown
      doc.fontSize(12).text('Earnings Breakdown', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Base Salary: EGP ${baseSalary.toFixed(2)} `);

      if (refunds.length > 0) {
        doc.moveDown(0.3);
        doc.fontSize(11).text('Leave Compensation & Refunds:', { underline: true });
        doc.fontSize(9);
        refunds.forEach((refund: any) => {
          doc.text(`  • ${refund.description}: EGP ${refund.amount.toFixed(2)} `);
        });
      }

      if (allowances.length > 0) {
        doc.moveDown(0.3);
        doc.fontSize(11).text('Allowances:', { underline: true });
        doc.fontSize(9);
        allowances.forEach((allowance: any) => {
          doc.text(`  • ${allowance.name}: EGP ${allowance.amount.toFixed(2)} `);
        });
      }

      if (bonuses.length > 0) {
        doc.moveDown(0.3);
        doc.fontSize(11).text('Bonuses:', { underline: true });
        doc.fontSize(9);
        bonuses.forEach((bonus: any) => {
          doc.text(`  • ${bonus.name}: EGP ${bonus.amount.toFixed(2)} `);
        });
      }

      if (benefits.length > 0) {
        doc.moveDown(0.3);
        doc.fontSize(11).text('Benefits:', { underline: true });
        doc.fontSize(9);
        benefits.forEach((benefit: any) => {
          doc.text(`  • ${benefit.name}: EGP ${benefit.amount.toFixed(2)} `);
        });
      }

      doc.moveDown(1.5);

      // Deductions Breakdown
      doc.fontSize(12).text('Deductions Breakdown', { underline: true });
      doc.moveDown(0.5);

      if (taxes.length > 0) {
        doc.fontSize(11).text('Tax Deductions:', { underline: true });
        doc.fontSize(9);
        taxes.forEach((tax: any) => {
          const taxAmount = (baseSalary * tax.rate) / 100;
          doc.text(`  • ${tax.name} (${tax.rate}%): EGP ${taxAmount.toFixed(2)} `);
          if (tax.description) {
            doc.fontSize(8).fillColor('gray').text(`    ${tax.description} `);
            doc.fillColor('black').fontSize(9);
          }
        });
        doc.moveDown(0.3);
      }

      if (insurances.length > 0) {
        doc.fontSize(11).text('Insurance Deductions:', { underline: true });
        doc.fontSize(9);
        insurances.forEach((ins: any) => {
          const empAmount = (baseSalary * ins.employeeRate) / 100;
          doc.text(`  • ${ins.name}: EGP ${empAmount.toFixed(2)} (Employee: ${ins.employeeRate}%, Employer: ${ins.employerRate}%)`);
        });
        doc.moveDown(0.3);
      }

      if (penalties && penalties.penalties && penalties.penalties.length > 0) {
        doc.fontSize(11).fillColor('red').text('Penalties & Deductions:', { underline: true });
        doc.fontSize(9);
        penalties.penalties.forEach((penalty: any) => {
          doc.text(`  • ${penalty.reason}: EGP ${penalty.amount.toFixed(2)} `);
        });
        doc.fillColor('black');
        doc.moveDown(0.3);
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).fillColor('gray');
      doc.text(`Generated on: ${new Date().toLocaleDateString()} `, { align: 'center' });
      doc.text('This is an automatically generated document.', { align: 'center' });

      doc.end();
    });
  }

  /**
   * REQ-PY-6: Get salary history with year-over-year comparison
   * Returns historical salary records grouped by year with percentage changes
   * @param userId - Employee ID from JWT
   * @param years - Number of years to include (default 3)
   * @returns Salary history with year-over-year analysis
   */
  async getSalaryHistory(userId: string, years: number = 3): Promise<any> {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - years);

    // Get all payslips for the period
    const payslips = await this.payslipModel
      .find({
        employeeId: new Types.ObjectId(userId),
        createdAt: { $gte: startDate, $lte: endDate },
      })
      .sort({ createdAt: 1 })
      .exec();

    if (!payslips || payslips.length === 0) {
      return {
        employeeId: userId,
        yearRange: `${startDate.getFullYear()} -${endDate.getFullYear()} `,
        totalPayslips: 0,
        yearlyData: [],
        message: 'No salary history found for the specified period',
      };
    }

    // Group payslips by year
    const yearlyData: any[] = [];
    const yearMap = new Map<number, any[]>();

    payslips.forEach(payslip => {
      const year = new Date((payslip as any).createdAt).getFullYear();
      if (!yearMap.has(year)) {
        yearMap.set(year, []);
      }
      yearMap.get(year)!.push(payslip);
    });

    // Sort years in descending order
    const sortedYears = Array.from(yearMap.keys()).sort((a, b) => b - a);

    // Calculate yearly statistics
    for (let i = 0; i < sortedYears.length; i++) {
      const year = sortedYears[i];
      const yearPayslips = yearMap.get(year)!;

      const totalGross = yearPayslips.reduce((sum, p) => sum + (p.totalGrossSalary || 0), 0);
      const totalDeductions = yearPayslips.reduce((sum, p) => sum + (p.totaDeductions || 0), 0);
      const totalNet = yearPayslips.reduce((sum, p) => sum + (p.netPay || 0), 0);
      const avgGross = totalGross / yearPayslips.length;
      const avgNet = totalNet / yearPayslips.length;

      // Calculate year-over-year change
      let yoyGrossChange: number | null = null;
      let yoyNetChange: number | null = null;
      let yoyGrossPercentage: string | null = null;
      let yoyNetPercentage: string | null = null;

      if (i < sortedYears.length - 1) {
        const previousYear = sortedYears[i + 1];
        const previousYearPayslips = yearMap.get(previousYear)!;
        const prevTotalGross = previousYearPayslips.reduce((sum, p) => sum + (p.totalGrossSalary || 0), 0);
        const prevTotalNet = previousYearPayslips.reduce((sum, p) => sum + (p.netPay || 0), 0);
        const prevAvgGross = prevTotalGross / previousYearPayslips.length;
        const prevAvgNet = prevTotalNet / previousYearPayslips.length;

        yoyGrossChange = avgGross - prevAvgGross;
        yoyNetChange = avgNet - prevAvgNet;
        yoyGrossPercentage = prevAvgGross > 0
          ? `${((yoyGrossChange / prevAvgGross) * 100).toFixed(2)}% `
          : 'N/A';
        yoyNetPercentage = prevAvgNet > 0
          ? `${((yoyNetChange / prevAvgNet) * 100).toFixed(2)}% `
          : 'N/A';
      }

      yearlyData.push({
        year,
        totalPayslips: yearPayslips.length,
        totalGrossSalary: totalGross,
        totalDeductions,
        totalNetPay: totalNet,
        averageGrossSalary: avgGross,
        averageNetPay: avgNet,
        yearOverYearChange: {
          grossSalaryChange: yoyGrossChange,
          grossSalaryPercentage: yoyGrossPercentage,
          netPayChange: yoyNetChange,
          netPayPercentage: yoyNetPercentage,
        },
      });
    }

    // Get employee details for display
    const employee = await this.employeeProfileService.getProfileById(userId);
    const employeeName = employee ? `${employee.firstName} ${employee.lastName} ` : 'Unknown';

    return {
      employeeId: userId,
      employeeName,
      yearRange: `${startDate.getFullYear()} -${endDate.getFullYear()} `,
      totalPayslips: payslips.length,
      yearlyData,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate Tax Certificate PDF for an employee
   * Returns PDF buffer for download
   */
  async generateTaxCertificate(userId: string, taxYear: number): Promise<Buffer> {
    // Use current year if not provided
    const year = taxYear || new Date().getFullYear();

    // Find all payslips for the employee in the given tax year
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year} -12 - 31`);

    const payslips = await this.payslipModel
      .find({
        employeeId: new Types.ObjectId(userId),
        createdAt: { $gte: startDate, $lte: endDate },
      })
      .exec();

    if (!payslips || payslips.length === 0) {
      throw new NotFoundException(`No payslips found for tax year ${year} `);
    }

    // Fetch employee details
    const employee = await this.employeeProfileService.getProfileById(userId);
    const employeeName = `${employee.firstName} ${employee.lastName} `;

    // Calculate total taxable income and tax deducted
    let totalTaxableIncome = 0;
    let totalTaxDeducted = 0;

    payslips.forEach(payslip => {
      totalTaxableIncome += payslip.totalGrossSalary || 0;

      // Sum all tax deductions
      if (payslip.deductionsDetails?.taxes) {
        payslip.deductionsDetails.taxes.forEach(tax => {
          totalTaxDeducted += (tax as any).amount || 0;
        });
      }
    });

    // Generate PDF
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('TAX CERTIFICATE', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Tax Year: ${year} `, { align: 'center' });
      doc.moveDown(2);

      // Employee Information
      doc.fontSize(14).text('Employee Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      doc.text(`Name: ${employeeName} `);
      doc.text(`Employee ID: ${userId} `);
      doc.text(`Tax ID: TAX - ${userId} -${year} `);
      doc.moveDown(1.5);

      // Tax Summary
      doc.fontSize(14).text('Tax Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      doc.text(`Total Taxable Income: EGP ${totalTaxableIncome.toFixed(2)} `);
      doc.text(`Total Tax Deducted: EGP ${totalTaxDeducted.toFixed(2)} `);
      doc.text(`Number of Payslips: ${payslips.length} `);
      doc.moveDown(1.5);

      // Legal Notice
      doc.fontSize(10);
      doc.text('This certificate is generated according to Egyptian Tax Law and shows all income tax deductions for the specified fiscal year.', {
        align: 'justify',
      });
      doc.moveDown();

      // Footer
      doc.fontSize(9);
      doc.text(`Generated on: ${new Date().toLocaleDateString()} `, { align: 'center' });
      doc.text('This is an automatically generated document.', { align: 'center' });

      doc.end();
    });
  }

  /**
   * Generate Insurance Certificate PDF for an employee
   * Returns PDF buffer for download
   */
  async generateInsuranceCertificate(userId: string, year: number): Promise<Buffer> {
    // Use current year if not provided
    const certificateYear = year || new Date().getFullYear();

    // Find all payslips for the employee in the given year
    const startDate = new Date(`${certificateYear}-01-01`);
    const endDate = new Date(`${certificateYear} -12 - 31`);

    const payslips = await this.payslipModel
      .find({
        employeeId: new Types.ObjectId(userId),
        createdAt: { $gte: startDate, $lte: endDate },
      })
      .exec();

    if (!payslips || payslips.length === 0) {
      throw new NotFoundException(`No payslips found for year ${certificateYear}`);
    }

    // Fetch employee details
    const employee = await this.employeeProfileService.getProfileById(userId);
    const employeeName = `${employee.firstName} ${employee.lastName} `;

    // Calculate total employee and employer contributions
    let totalEmployeeContribution = 0;
    let totalEmployerContribution = 0;

    payslips.forEach(payslip => {
      if (payslip.deductionsDetails?.insurances) {
        payslip.deductionsDetails.insurances.forEach(insurance => {
          totalEmployeeContribution += (insurance as any).employeeContribution || 0;
          totalEmployerContribution += (insurance as any).employerContribution || 0;
        });
      }
    });

    // Generate PDF
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('INSURANCE CERTIFICATE', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Coverage Period: ${certificateYear} `, { align: 'center' });
      doc.moveDown(2);

      // Employee Information
      doc.fontSize(14).text('Employee Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      doc.text(`Name: ${employeeName} `);
      doc.text(`Employee ID: ${userId} `);
      doc.text(`Policy Number: INS - ${userId} -${certificateYear} `);
      doc.moveDown(1.5);

      // Coverage Period
      doc.fontSize(14).text('Coverage Period', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      doc.text(`Start Date: ${startDate.toLocaleDateString()} `);
      doc.text(`End Date: ${endDate.toLocaleDateString()} `);
      doc.moveDown(1.5);

      // Contribution Summary
      doc.fontSize(14).text('Contribution Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      doc.text(`Employee Contributions: EGP ${totalEmployeeContribution.toFixed(2)} `);
      doc.text(`Employer Contributions: EGP ${totalEmployerContribution.toFixed(2)} `);
      doc.text(`Total Contributions: EGP ${(totalEmployeeContribution + totalEmployerContribution).toFixed(2)} `);
      doc.text(`Number of Payslips: ${payslips.length} `);
      doc.moveDown(1.5);

      // Insurance Details
      doc.fontSize(10);
      doc.text('This certificate shows all social insurance, health insurance, and pension contributions made during the coverage period.', {
        align: 'justify',
      });
      doc.moveDown();
      doc.text('Employee Rate: 11% (Social Insurance) + 1% (Health Insurance)', { align: 'justify' });
      doc.text('Employer Rate: 18.75% (Social Insurance) + 4% (Health Insurance)', { align: 'justify' });
      doc.moveDown(1.5);

      // Footer
      doc.fontSize(9);
      doc.text(`Generated on: ${new Date().toLocaleDateString()} `, { align: 'center' });
      doc.text('This is an automatically generated document.', { align: 'center' });

      doc.end();
    });
  }

  /**
   * Generate Departmental Report for Payroll Specialists
   * Aggregates claims, disputes, and pending refunds by department
   */
  async getDepartmentalReport(startDate: Date, endDate: Date, department?: string): Promise<any> {
    // Build query filter
    const dateFilter = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    // Count claims
    const claimsQuery = this.claimModel.find(dateFilter);
    const totalClaims = await claimsQuery.countDocuments();

    // Count disputes
    const disputesQuery = this.disputeModel.find(dateFilter);
    const totalDisputes = await disputesQuery.countDocuments();

    // Get pending refunds and calculate total value
    const refunds = await this.refundsModel
      .find({
        ...dateFilter,
        status: RefundStatus.PENDING,
      })
      .exec();

    const totalPendingRefundsValue = refunds.reduce((sum, refund) => {
      return sum + (refund.refundDetails?.amount || 0);
    }, 0);

    return {
      reportType: 'Departmental Report',
      department: department || 'All Departments',
      period: {
        startDate,
        endDate,
      },
      metrics: {
        totalClaims,
        totalDisputes,
        pendingRefundsCount: refunds.length,
        totalPendingRefundsValue,
      },
      generatedAt: new Date(),
    };
  }

  /**
   * Generate Month-end/Year-end Financial Report for Finance Staff
   * Aggregates payroll costs, deductions, and refunds
   */
  async getFinancialReport(startDate: Date, endDate: Date): Promise<any> {
    // Get all payslips in the period
    const payslips = await this.payslipModel
      .find({
        createdAt: { $gte: startDate, $lte: endDate },
      })
      .exec();

    // Calculate totals
    let totalPayrollCost = 0;
    let totalDeductions = 0;

    payslips.forEach(payslip => {
      totalPayrollCost += payslip.totalGrossSalary || 0;
      totalDeductions += payslip.totaDeductions || 0;
    });

    // Get refunds processed (PAID) in the period
    const processedRefunds = await this.refundsModel
      .find({
        updatedAt: { $gte: startDate, $lte: endDate },
        status: RefundStatus.PAID,
      })
      .exec();

    const totalRefundsProcessed = processedRefunds.reduce((sum, refund) => {
      return sum + (refund.refundDetails?.amount || 0);
    }, 0);

    return {
      reportType: 'Financial Summary Report',
      period: {
        startDate,
        endDate,
      },
      summary: {
        totalPayrollCost,
        totalDeductions,
        totalRefundsProcessed,
        refundsCount: processedRefunds.length,
        netPayrollCost: totalPayrollCost - totalDeductions + totalRefundsProcessed,
      },
      generatedAt: new Date(),
    };
  }

  /**
   * Generate Tax Compliance Report
   * Aggregates tax data from payslips for compliance purposes
   */
  async getTaxComplianceReport(startDate: Date, endDate: Date): Promise<any> {
    const payslips = await this.payslipModel
      .find({
        createdAt: { $gte: startDate, $lte: endDate },
      })
      .exec();

    let totalTaxableIncome = 0;
    let totalTaxDeducted = 0;
    const taxBreakdown: any[] = [];

    payslips.forEach(payslip => {
      totalTaxableIncome += payslip.totalGrossSalary || 0;

      if (payslip.deductionsDetails?.taxes) {
        payslip.deductionsDetails.taxes.forEach(tax => {
          const taxAmount = (tax as any).amount || 0;
          totalTaxDeducted += taxAmount;

          // Track by tax type
          const taxType = (tax as any).taxType || 'Standard';
          const existing = taxBreakdown.find(t => t.taxType === taxType);
          if (existing) {
            existing.amount += taxAmount;
            existing.count += 1;
          } else {
            taxBreakdown.push({
              taxType,
              amount: taxAmount,
              count: 1,
            });
          }
        });
      }
    });

    return {
      reportType: 'Tax Compliance Report',
      period: {
        startDate,
        endDate,
      },
      summary: {
        totalEmployees: payslips.length,
        totalTaxableIncome,
        totalTaxDeducted,
        effectiveTaxRate: totalTaxableIncome > 0
          ? ((totalTaxDeducted / totalTaxableIncome) * 100).toFixed(2) + '%'
          : '0%',
      },
      taxBreakdown,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate Insurance Compliance Report
   * Aggregates insurance contribution data from payslips
   */
  async getInsuranceComplianceReport(startDate: Date, endDate: Date): Promise<any> {
    const payslips = await this.payslipModel
      .find({
        createdAt: { $gte: startDate, $lte: endDate },
      })
      .exec();

    let totalEmployeeContributions = 0;
    let totalEmployerContributions = 0;
    const insuranceBreakdown: any[] = [];

    payslips.forEach(payslip => {
      if (payslip.deductionsDetails?.insurances) {
        payslip.deductionsDetails.insurances.forEach(insurance => {
          const empContribution = (insurance as any).employeeContribution || 0;
          const empRContribution = (insurance as any).employerContribution || 0;

          totalEmployeeContributions += empContribution;
          totalEmployerContributions += empRContribution;

          // Track by insurance type
          const insuranceType = (insurance as any).insuranceType || 'Standard';
          const existing = insuranceBreakdown.find(i => i.insuranceType === insuranceType);
          if (existing) {
            existing.employeeContribution += empContribution;
            existing.employerContribution += empRContribution;
            existing.count += 1;
          } else {
            insuranceBreakdown.push({
              insuranceType,
              employeeContribution: empContribution,
              employerContribution: empRContribution,
              count: 1,
            });
          }
        });
      }
    });

    return {
      reportType: 'Insurance Compliance Report',
      period: {
        startDate,
        endDate,
      },
      summary: {
        totalEmployees: payslips.length,
        totalEmployeeContributions,
        totalEmployerContributions,
        totalContributions: totalEmployeeContributions + totalEmployerContributions,
      },
      insuranceBreakdown,
      generatedAt: new Date(),
    };
  }

  // === ELENA END ===

  /**
   * Generate Benefits Report
   * Aggregates benefits (allowances, bonuses, etc.) from payslips
   */
  async getBenefitsReport(startDate: Date, endDate: Date): Promise<any> {
    const payslips = await this.payslipModel
      .find({
        createdAt: { $gte: startDate, $lte: endDate },
      })
      .exec();

    let totalBenefitsValue = 0;
    const benefitsBreakdown: any[] = [];

    payslips.forEach(payslip => {
      // 1. Allowances
      if (payslip.earningsDetails?.allowances) {
        payslip.earningsDetails.allowances.forEach(allowance => {
          const amount = (allowance as any).amount || 0;
          totalBenefitsValue += amount;

          const name = (allowance as any).name || 'General Allowance';
          const existing = benefitsBreakdown.find(b => b.benefitType === 'Allowance' && b.name === name);
          if (existing) {
            existing.totalAmount += amount;
            existing.count += 1;
          } else {
            benefitsBreakdown.push({
              benefitType: 'Allowance',
              name,
              totalAmount: amount,
              count: 1
            });
          }
        });
      }

      // 2. Bonuses
      if (payslip.earningsDetails?.bonuses) {
        payslip.earningsDetails.bonuses.forEach(bonus => {
          const amount = (bonus as any).amount || 0;
          totalBenefitsValue += amount;

          const name = (bonus as any).name || 'Performance Bonus';
          const existing = benefitsBreakdown.find(b => b.benefitType === 'Bonus' && b.name === name);
          if (existing) {
            existing.totalAmount += amount;
            existing.count += 1;
          } else {
            benefitsBreakdown.push({
              benefitType: 'Bonus',
              name,
              totalAmount: amount,
              count: 1
            });
          }
        });
      }

      // 3. Other Benefits
      if (payslip.earningsDetails?.benefits) {
        payslip.earningsDetails.benefits.forEach(benefit => {
          const amount = (benefit as any).amount || 0;
          totalBenefitsValue += amount;

          const name = (benefit as any).name || 'Other Benefit';
          const existing = benefitsBreakdown.find(b => b.benefitType === 'Benefit' && b.name === name);
          if (existing) {
            existing.totalAmount += amount;
            existing.count += 1;
          } else {
            benefitsBreakdown.push({
              benefitType: 'Benefit',
              name,
              totalAmount: amount,
              count: 1
            });
          }
        });
      }
    });

    return {
      reportType: 'Benefits Report',
      period: {
        startDate,
        endDate,
      },
      summary: {
        totalEmployees: payslips.length,
        totalBenefitsValue,
        averageBenefitPerEmployee: payslips.length > 0 ? (totalBenefitsValue / payslips.length).toFixed(2) : 0
      },
      benefitsBreakdown,
      generatedAt: new Date(),
    };
  }

  // === MAYA START ===
  /**
   * Employee submits a new payroll dispute. 
   */
  async submitDispute(userId: Types.ObjectId, dto: CreateDisputeDto): Promise<Dispute> {
    // NOTE: We use your schema's property names: employeeId, payslipId, status
    const newDispute = new this.disputeModel({
      disputeId: `DISP-${Date.now()}`, // Generate unique ID without spaces
      employeeId: userId,
      payslipId: new Types.ObjectId(dto.payslipId),
      description: dto.description,
      status: DisputeStatus.UNDER_REVIEW, // Use correct enum value
    });
    return newDispute.save();
  }

  /**
   * HR/Payroll Specialist resolves an existing dispute.
   * Now moves to PENDING_MANAGER_APPROVAL instead of directly APPROVED
   */
  async resolveDispute(disputeId: string, payrollSpecialistId: Types.ObjectId, dto: ResolveDisputeDto): Promise<Dispute> {
    // Find dispute - try by MongoDB _id first, then by disputeId field
    let dispute: Dispute | null = null;

    if (Types.ObjectId.isValid(disputeId)) {
      dispute = await this.disputeModel.findById(disputeId).exec();
    }

    if (!dispute) {
      dispute = await this.disputeModel.findOne({ disputeId }).exec();
    }

    if (!dispute) {
      throw new NotFoundException(`Dispute with ID ${disputeId} not found.`);
    }

    // Specialist can approve (moves to PENDING_MANAGER_APPROVAL) or reject
    let newStatus = dto.status;
    if (dto.status === DisputeStatus.APPROVED) {
      newStatus = DisputeStatus.PENDING_MANAGER_APPROVAL;
    }

    // Update the dispute using its _id
    const updatedDispute = await this.disputeModel.findByIdAndUpdate(
      dispute,
      {
        status: newStatus,
        resolutionComment: dto.resolutionComment,
        payrollSpecialistId: payrollSpecialistId,
      },
      { new: true }
    ).exec();

    if (!updatedDispute) {
      throw new NotFoundException(`Dispute with ID ${disputeId} not found.`);
    }

    // NOTE: Refund is NOT created here anymore. It's created by manager confirmation.

    return updatedDispute;
  }

  /**
   * Manager confirms or rejects a dispute that is PENDING_MANAGER_APPROVAL
   */
  async managerActionDispute(
    disputeId: string,
    managerId: Types.ObjectId,
    dto: ManagerActionDisputeDto,
  ): Promise<Dispute> {
    // Find dispute - try by MongoDB _id first, then by disputeId field
    let dispute: Dispute | null = null;

    if (Types.ObjectId.isValid(disputeId)) {
      dispute = await this.disputeModel.findById(disputeId).exec();
    }

    if (!dispute) {
      dispute = await this.disputeModel.findOne({ disputeId }).exec();
    }

    if (!dispute) {
      throw new NotFoundException(`Dispute with ID ${disputeId} not found`);
    }

    // Verify dispute is in the correct state
    if (dispute.status !== DisputeStatus.PENDING_MANAGER_APPROVAL) {
      throw new BadRequestException(
        `Dispute must be in PENDING_MANAGER_APPROVAL status.Current status: ${dispute.status} `,
      );
    }

    let finalStatus: DisputeStatus;
    let resolutionComment: string | undefined;

    if (dto.action === 'confirm') {
      finalStatus = DisputeStatus.APPROVED;
      // Refund will be created by Finance Staff
    } else {
      // reject
      finalStatus = DisputeStatus.REJECTED;
      resolutionComment = dto.rejectionReason || 'Rejected by manager';
    }

    // Update the dispute using its document
    const updatedDispute = await this.disputeModel.findByIdAndUpdate(
      dispute,
      {
        status: finalStatus,
        resolutionComment,
      },
      { new: true }
    ).exec();

    if (!updatedDispute) {
      throw new NotFoundException(`Failed to update dispute with ID ${disputeId} `);
    }

    return updatedDispute;
  }

  /**
   * Employee views their submitted disputes.
   */
  async getMyDisputes(userId: Types.ObjectId): Promise<Dispute[]> {
    return this.disputeModel
      .find({ employeeId: userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get ALL pending disputes for Payroll Specialist to review
   * Returns disputes with status UNDER_REVIEW
   * @returns Array of all pending disputes sorted by newest first
   */
  async getAllPendingDisputes(): Promise<Dispute[]> {
    return this.disputeModel
      .find({ status: DisputeStatus.UNDER_REVIEW })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get ALL disputes (any status) for reporting purposes
   * @returns Array of all disputes sorted by newest first
   */
  async getAllDisputes(): Promise<Dispute[]> {
    return this.disputeModel
      .find({})
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get disputes approved by specialist awaiting manager confirmation
   * @returns Array of specialist-approved disputes
   */
  async getSpecialistApprovedDisputes(): Promise<Dispute[]> {
    return this.disputeModel
      .find({ status: DisputeStatus.PENDING_MANAGER_APPROVAL })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get disputes approved by manager awaiting finance processing
   */
  async getApprovedDisputes(): Promise<Dispute[]> {
    return await this.disputeModel
      .find({ status: DisputeStatus.APPROVED })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get a single dispute by ID
   */
  async getDisputeById(disputeId: string): Promise<Dispute> {
    let dispute: Dispute | null = null;

    if (Types.ObjectId.isValid(disputeId)) {
      dispute = await this.disputeModel.findById(disputeId).exec();
    }

    if (!dispute) {
      dispute = await this.disputeModel.findOne({ disputeId }).exec();
    }

    if (!dispute) {
      throw new NotFoundException(`Dispute with ID ${disputeId} not found`);
    }

    return dispute;
  }

  /**
   * Finance Staff processes a dispute refund
   */
  async processDisputeRefund(disputeId: string, financeId: string, refundAmount: number): Promise<Dispute> {
    const dispute = await this.disputeModel.findById(disputeId).exec();
    if (!dispute) {
      throw new NotFoundException(`Dispute with ID ${disputeId} not found`);
    }

    if (dispute.status !== DisputeStatus.APPROVED) {
      throw new BadRequestException(`Dispute must be in APPROVED status.Current status: ${dispute.status} `);
    }

    // Validate refund amount
    if (!refundAmount || refundAmount <= 0) {
      throw new BadRequestException('Refund amount must be a positive number');
    }

    // Create refund with finance-provided amount
    await this.createRefundInternal(
      dispute._id as Types.ObjectId,
      'Dispute',
      refundAmount,
      dispute.employeeId,
    );

    // Update dispute status to COMPLETED
    // Update dispute status to COMPLETED
    const updatedDispute = await this.disputeModel.findByIdAndUpdate(
      dispute._id,
      {
        status: DisputeStatus.COMPLETED,
        financeStaffId: new Types.ObjectId(financeId),
      },
      { new: true }
    ).exec();

    if (!updatedDispute) throw new NotFoundException('Dispute not found after update');
    return updatedDispute;
  }

  /**
   * Finance Staff rejects a dispute
   */
  async rejectDispute(disputeId: string, financeId: string, reason: string): Promise<Dispute> {
    const dispute = await this.disputeModel.findById(disputeId).exec();
    if (!dispute) {
      throw new NotFoundException(`Dispute with ID ${disputeId} not found`);
    }

    const updatedDispute = await this.disputeModel.findByIdAndUpdate(
      dispute._id,
      {
        status: DisputeStatus.REJECTED,
        resolutionComment: reason, // Reusing resolutionComment for rejection reason
        financeStaffId: new Types.ObjectId(financeId),
      },
      { new: true }
    ).exec();

    if (!updatedDispute) throw new NotFoundException('Dispute not found after update');
    return updatedDispute;
  }

  // === MAYA END ===

  // ===========================
  // TIME MANAGEMENT INTEGRATION
  // ===========================
  /**
   * Get time-related financial impact for a specific pay period
   * Calls Time Management APIs and processes data for payroll display
   * @param userId - Employee ID
   * @param month - Month (1-12)
   * @param year - Year
   * @returns Time impact data with penalties, overtime, and compliance checks
   */
  async getTimeImpactData(userId: string, month: number, year: number): Promise<TimeImpactDataDto> {
    try {
      // Calculate date range for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Fetch employee profile for calculations
      const employee = await this.employeeProfileService.getProfileById(userId);
      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      const baseSalary = employee.baseSalary || 0;
      const workingDaysPerMonth = 26;
      const hoursPerDay = 8;
      const dailySalary = baseSalary / workingDaysPerMonth;
      const hourlyRate = baseSalary / (workingDaysPerMonth * hoursPerDay);

      // === CALL TIME MANAGEMENT APIs (READ-ONLY) ===
      const [timeExceptions, correctionRequests, holidays] = await Promise.all([
        this.fetchTimeExceptions(userId, startDate, endDate),
        this.fetchCorrectionRequests(userId, startDate, endDate),
        this.fetchHolidays(startDate, endDate),
      ]);

      // === CALCULATE PENALTIES ===
      const penalties = await this.calculatePenalties(
        timeExceptions,
        correctionRequests,
        dailySalary,
      );

      // === CALCULATE OVERTIME ===
      const overtime = await this.calculateOvertime(
        timeExceptions,
        hourlyRate,
        holidays,
      );

      // === CALCULATE PERMISSIONS (PLACEHOLDER) ===
      const permissions: PermissionItemDto[] = [];
      const paidPermissions = 0;
      const unpaidPermissions = 0;

      // === CALCULATE TOTALS ===
      const totalPenalties = penalties.reduce((sum, p) => sum + p.amount, 0);
      const totalOvertimeCompensation = overtime.reduce((sum, o) => sum + o.compensation, 0);

      // === MINIMUM WAGE COMPLIANCE CHECK ===
      const projectedNetPay = baseSalary + totalOvertimeCompensation - totalPenalties;
      const minimumWageAlert = projectedNetPay < this.MINIMUM_WAGE;

      if (minimumWageAlert) {
        await this.sendMinimumWageAlert(userId, projectedNetPay, this.MINIMUM_WAGE);
      }

      // === CHECK FOR DISPUTES ===
      const disputedItemIds = penalties
        .filter(p => p.status === TimeItemStatus.DISPUTED)
        .map(p => p.id);
      const hasDisputedItems = disputedItemIds.length > 0;

      return {
        employeeId: userId,
        month,
        year,
        penalties,
        totalPenalties,
        overtime,
        totalOvertimeCompensation,
        permissions,
        paidPermissions,
        unpaidPermissions,
        minimumWageAlert,
        projectedNetPay,
        minimumWage: this.MINIMUM_WAGE,
        hasDisputedItems,
        disputedItemIds,
      };
    } catch (error) {
      console.error('Error calculating time impact:', error);
      throw new InternalServerErrorException('Failed to calculate time impact data');
    }
  }

  private async fetchTimeExceptions(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const url = `${this.TIME_MANAGEMENT_BASE_URL} /time-management/time - exceptions`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { employeeId: userId, startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        })
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching time exceptions:', error.message);
      return [];
    }
  }

  private async fetchCorrectionRequests(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const url = `${this.TIME_MANAGEMENT_BASE_URL} /time-management/attendance - correction - requests`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { employeeId: userId, startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        })
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching correction requests:', error.message);
      return [];
    }
  }

  private async fetchHolidays(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const url = `${this.TIME_MANAGEMENT_BASE_URL} /time-management/holidays`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        })
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching holidays:', error.message);
      return [];
    }
  }

  private async calculatePenalties(
    timeExceptions: any[],
    correctionRequests: any[],
    dailySalary: number,
  ): Promise<PenaltyItemDto[]> {
    const penalties: PenaltyItemDto[] = [];
    const DEDUCTION_PER_MINUTE = 1; // EGP per minute late
    const GRACE_PERIOD_MINUTES = 15;

    for (const exception of timeExceptions) {
      const penalty: Partial<PenaltyItemDto> = {
        id: exception._id || exception.id,
        date: exception.date || (exception.createdAt ? new Date(exception.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
        attendanceRecordId: exception.attendanceRecordId,
        exceptionId: exception._id || exception.id,
      };

      const relatedCorrection = correctionRequests.find(
        cr => cr.attendanceRecordId?.toString() === exception.attendanceRecordId?.toString()
      );

      if (relatedCorrection && ['SUBMITTED', 'IN_REVIEW', 'ESCALATED'].includes(relatedCorrection.status)) {
        penalty.status = TimeItemStatus.DISPUTED;
      } else if (exception.status === 'RESOLVED') {
        penalty.status = TimeItemStatus.FINALIZED;
      } else {
        penalty.status = TimeItemStatus.PENDING_CORRECTION;
      }

      switch (exception.type) {
        case 'LATE':
          const minutesLate = exception.minutesLate || 45;
          if (minutesLate > GRACE_PERIOD_MINUTES) {
            const deductibleMinutes = minutesLate - GRACE_PERIOD_MINUTES;
            penalty.type = PenaltyType.LATE;
            penalty.minutesLate = minutesLate;
            penalty.amount = deductibleMinutes * DEDUCTION_PER_MINUTE;
            const penaltyDate = penalty.date || new Date().toISOString().split('T')[0];
            penalty.reason = `Late arrival by ${minutesLate} minutes on ${new Date(penaltyDate).toLocaleDateString()} `;
            penalties.push(penalty as PenaltyItemDto);
          }
          break;

        case 'EARLY_LEAVE':
          const minutesEarly = exception.minutesEarly || 30;
          penalty.type = PenaltyType.EARLY_LEAVE;
          penalty.amount = minutesEarly * DEDUCTION_PER_MINUTE;
          const earlyDate = penalty.date || new Date().toISOString().split('T')[0];
          penalty.reason = `Early departure by ${minutesEarly} minutes on ${new Date(earlyDate).toLocaleDateString()} `;
          penalties.push(penalty as PenaltyItemDto);
          break;

        case 'MISSED_PUNCH':
          if (!exception.finalisedForPayroll) {
            penalty.type = PenaltyType.UNAPPROVED_ABSENCE;
            penalty.amount = dailySalary;
            const absenceDate = penalty.date || new Date().toISOString().split('T')[0];
            penalty.reason = `Unapproved absence due to missed punch on ${new Date(absenceDate).toLocaleDateString()} `;
            penalties.push(penalty as PenaltyItemDto);
          }
          break;
      }
    }

    return penalties;
  }

  private async calculateOvertime(
    timeExceptions: any[],
    hourlyRate: number,
    holidays: any[],
  ): Promise<OvertimeItemDto[]> {
    const overtimeItems: OvertimeItemDto[] = [];

    const isHoliday = (date: Date): boolean => {
      return holidays.some(h => {
        const holidayDate = new Date(h.date);
        return holidayDate.toDateString() === date.toString() && h.type === 'OFFICIAL';
      });
    };

    const isWeeklyRest = (date: Date): boolean => {
      return holidays.some(h => {
        const holidayDate = new Date(h.date);
        return holidayDate.toDateString() === date.toDateString() && h.type === 'WEEKLY_REST';
      });
    };

    const isNighttime = (time: Date): boolean => {
      const hour = time.getHours();
      return hour >= 21 || hour < 6;
    };

    for (const exception of timeExceptions) {
      if (exception.type === 'OVERTIME_REQUEST' && exception.status === 'APPROVED') {
        const overtimeDate = new Date(exception.date || exception.createdAt);
        const hoursWorked = exception.hoursWorked || 2;

        const overtime: OvertimeItemDto = {
          id: exception._id || exception.id,
          date: overtimeDate.toISOString().split('T')[0],
          hoursWorked,
          rate: 1.35,
          rateType: OvertimeRateType.DAYTIME,
          compensation: 0,
          status: 'APPROVED',
        };

        // Egyptian Labor Law 2025 rates
        if (isHoliday(overtimeDate)) {
          overtime.rate = 3.00;
          overtime.rateType = OvertimeRateType.OFFICIAL_HOLIDAY;
        } else if (isWeeklyRest(overtimeDate)) {
          overtime.rate = 2.00;
          overtime.rateType = OvertimeRateType.WEEKLY_REST;
        } else if (isNighttime(overtimeDate)) {
          overtime.rate = 1.70;
          overtime.rateType = OvertimeRateType.NIGHTTIME;
        }

        overtime.compensation = hoursWorked * hourlyRate * overtime.rate;
        overtimeItems.push(overtime);
      }
    }

    return overtimeItems;
  }

  private async sendMinimumWageAlert(employeeId: string, projectedNetPay: number, minimumWage: number): Promise<void> {
    try {
      const employee = await this.employeeProfileService.getProfileById(employeeId);
      const employeeName = `${employee.firstName} ${employee.lastName} `;

      const notification = new this.notificationLogModel({
        recipientId: 'HR_ADMIN',
        message: `MINIMUM WAGE ALERT: ${employeeName} (${employeeId}) projected net pay(${projectedNetPay.toFixed(2)} EGP) is below minimum wage(${minimumWage} EGP).Shortfall: ${(minimumWage - projectedNetPay).toFixed(2)} EGP.`,
        type: 'ALERT',
        relatedEntityId: employeeId,
        createdAt: new Date(),
      });

      await notification.save();
    } catch (error) {
      console.error('Error sending minimum wage alert:', error);
    }
  }

  // ==================== PAYROLL CONFIGURATION INTEGRATION ====================

  /**
   * Get approved allowances as itemized line items
   */
  private async getAllowanceLineItems(): Promise<any[]> {
    try {
      const allowances = await this.allowanceService.findAll();
      const approvedAllowances = allowances.filter((a: any) => a.status === 'approved');

      return approvedAllowances.map((a: any) => ({
        id: a._id.toString(),
        name: a.name,
        amount: a.amount,
      }));
    } catch (error) {
      console.error('Error fetching allowances:', error);
      return [];
    }
  }

  /**
   * Calculate tax with law references using progressive brackets
   */
  private async calculateTaxWithLawReference(grossIncome: number): Promise<any[]> {
    try {
      const taxRules = await this.taxRulesService.findAll();
      const activeTaxRule = taxRules.find((r: any) => r.status === 'approved');

      if (!activeTaxRule) {
        return [];
      }

      const taxItems: any[] = [];

      if (activeTaxRule.taxType === 'Progressive Brackets' && activeTaxRule.brackets) {
        let remainingIncome = grossIncome;

        for (const bracket of activeTaxRule.brackets) {
          if (remainingIncome <= 0) break;

          const bracketRange = bracket.maxIncome - bracket.minIncome;
          const taxableAmount = Math.min(remainingIncome, bracketRange);
          const taxAmount = (taxableAmount * bracket.rate) / 100;

          if (taxAmount > 0) {
            taxItems.push({
              id: `tax - ${activeTaxRule._id} -${bracket.rate} `,
              name: `${activeTaxRule.name} (${bracket.rate}%)`,
              amount: taxAmount,
              lawReference: `${activeTaxRule.name} - Bracket ${bracket.rate}% (${bracket.minIncome.toLocaleString()} -${bracket.maxIncome.toLocaleString()} EGP)`,
              bracket: {
                minIncome: bracket.minIncome,
                maxIncome: bracket.maxIncome,
                rate: bracket.rate,
              },
            });
          }

          remainingIncome -= taxableAmount;
        }
      } else if (activeTaxRule.taxType === 'Single Rate') {
        const taxAmount = (grossIncome * activeTaxRule.rate) / 100;
        taxItems.push({
          id: `tax - ${activeTaxRule._id} `,
          name: activeTaxRule.name,
          amount: taxAmount,
          lawReference: `${activeTaxRule.name} - ${activeTaxRule.rate}% flat rate`,
          bracket: null,
        });
      }

      return taxItems;
    } catch (error) {
      console.error('Error calculating tax:', error);
      return [];
    }
  }

  /**
   * Calculate insurance breakdown (employee + employer contributions)
   */
  private async calculateInsuranceBreakdown(salary: number): Promise<{ employee: any[]; employer: any[] }> {
    try {
      const brackets = await this.insuranceBracketsService.findAll();
      const applicableBrackets = brackets.filter(
        (b: any) =>
          b.status === 'approved' &&
          salary >= b.minSalary &&
          salary <= b.maxSalary
      );

      const employeeContributions = applicableBrackets.map((b: any) => ({
        id: b._id.toString(),
        name: b.name,
        employeeContribution: (salary * b.employeeRate) / 100,
        employerContribution: (salary * b.employerRate) / 100,
        totalContribution: (salary * (b.employeeRate + b.employerRate)) / 100,
      }));

      const employerContributions = applicableBrackets.map((b: any) => ({
        id: `employer - ${b._id} `,
        name: `Employer ${b.name} `,
        employeeContribution: 0,
        employerContribution: (salary * b.employerRate) / 100,
        totalContribution: (salary * b.employerRate) / 100,
      }));

      return {
        employee: employeeContributions,
        employer: employerContributions,
      };
    } catch (error) {
      console.error('Error calculating insurance:', error);
      return { employee: [], employer: [] };
    }
  }

  /**
   * Mock: Get unpaid leave deduction (placeholder for Leaves subsystem)
   */
  private async getUnpaidLeaveDeduction(userId: string, month: number, year: number): Promise<any | null> {
    // TODO: Replace with actual Leaves API call when ready
    return null;
  }

  /**
   * Mock: Get leave encashment (placeholder for Leaves subsystem)
   */
  private async getLeaveEncashment(userId: string, month: number, year: number): Promise<number | null> {
    // TODO: Replace with actual Leaves API call when ready
    return null;
  }

  /**
   * Get enhanced payslip data with itemized allowances, tax, insurance
   */
  async getEnhancedPayslipData(userId: string, payslipId: string): Promise<any> {
    try {
      // 1. Fetch original payslip
      const payslip = await this.payslipModel.findById(payslipId).exec();
      if (!payslip) {
        throw new NotFoundException('Payslip not found');
      }

      // 2. Fetch employee profile
      const employee = await this.employeeProfileService.getProfileById(userId);
      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      // 3. Extract data from payslip document
      const payslipData = payslip as any;

      // Get base salary from payslip earnings or fall back to employee salary
      let baseSalary = payslipData.earningsDetails?.baseSalary || employee.salary || payslipData.totalGrossSalary || 0;

      // Get allowances from payslip only (do NOT fallback to global config)
      // Allowances should be employee-specific and stored in payslip
      let allowances = (payslipData.earningsDetails?.allowances || []).map((a: any) => ({
        id: a._id?.toString() || `allowance-${Math.random()}`,
        name: a.name || 'Allowance',
        amount: a.amount || 0,
      }));

      const totalAllowances = allowances.reduce((sum: number, a: any) => sum + a.amount, 0);

      // Get bonuses from payslip
      const bonuses = (payslipData.earningsDetails?.bonuses || []).map((b: any) => ({
        id: b._id?.toString() || `bonus-${Math.random()}`,
        name: b.name || 'Bonus',
        amount: b.amount || 0,
      }));

      // Get benefits from payslip
      const benefits = (payslipData.earningsDetails?.benefits || []).map((b: any) => ({
        id: b._id?.toString() || `benefit-${Math.random()}`,
        name: b.name || 'Benefit',
        amount: b.amount || 0,
      }));

      // Get refunds from payslip
      const refunds = (payslipData.earningsDetails?.refunds || []).map((r: any) => ({
        id: r._id?.toString() || `refund-${Math.random()}`,
        description: r.description || 'Refund',
        amount: r.amount || 0,
      }));

      // 4. Get date information
      const payslipDate = new Date(payslipData.createdAt || Date.now());
      const month = payslipDate.getMonth() + 1;
      const year = payslipDate.getFullYear();

      // 5. Get time impact data (overtime and penalties)
      let overtimeCompensation = 0;
      let timeBasedPenalties = 0;
      try {
        const timeImpact = await this.getTimeImpactData(userId, month, year);
        overtimeCompensation = timeImpact.totalOvertimeCompensation || 0;
        timeBasedPenalties = timeImpact.totalPenalties || 0;
      } catch (error) {
        console.error('Error fetching time impact:', error);
      }

      // 6. Get leave data
      const leaveEncashment = await this.getLeaveEncashment(userId, month, year);
      const leaveDeductions = await this.getUnpaidLeaveDeduction(userId, month, year);

      // 7. Get tax deductions from payslip (or calculate on-the-fly)
      let taxDeductions = (payslipData.deductionsDetails?.taxes || []).map((tax: any) => ({
        id: tax._id?.toString() || `tax-${Math.random()}`,
        name: tax.name || 'Tax',
        amount: tax.amount || 0,
        lawReference: tax.description || tax.lawReference || 'Tax deduction',
        bracket: tax.bracket,
      }));

      // If no tax deductions in payslip and we have a salary, calculate based on BASE SALARY only
      if ((taxDeductions.length === 0 || taxDeductions.every((t: any) => t.amount === 0)) && baseSalary > 0) {
        // Tax should be calculated on base salary, not including allowances
        taxDeductions = await this.calculateTaxWithLawReference(baseSalary);
      }

      const totalTax = taxDeductions.reduce((sum: number, t: any) => sum + t.amount, 0);

      // 8. Get insurance deductions from payslip (or calculate on-the-fly)
      let insuranceDeductions = (payslipData.deductionsDetails?.insurances || []).map((ins: any) => ({
        id: ins._id?.toString() || `insurance-${Math.random()}`,
        name: ins.name || 'Insurance',
        employeeContribution: ins.employeeContribution || 0,
        employerContribution: ins.employerContribution || 0,
        totalContribution: (ins.employeeContribution || 0) + (ins.employerContribution || 0),
      }));

      // If no insurance deductions in payslip and we have a salary, calculate based on BASE SALARY only
      if ((insuranceDeductions.length === 0 || insuranceDeductions.every((i: any) => i.employeeContribution === 0)) && baseSalary > 0) {
        // Insurance should be calculated on base salary
        const insurance = await this.calculateInsuranceBreakdown(baseSalary);
        insuranceDeductions = insurance.employee;
      }

      const totalInsurance = insuranceDeductions.reduce((sum: number, i: any) => sum + i.employeeContribution, 0);

      // Employer contributions (for display purposes)
      const employerContributions = insuranceDeductions.map((ins: any) => ({
        id: ins.id,
        name: ins.name,
        employeeContribution: ins.employeeContribution,
        employerContribution: ins.employerContribution,
        totalContribution: ins.totalContribution,
      }));
      const totalEmployerContributions = employerContributions.reduce((sum: number, i: any) => sum + i.employerContribution, 0);

      // 9. Calculate gross pay
      const grossPay = baseSalary + totalAllowances;

      // 10. Calculate total deductions
      const totalDeductions = totalTax + totalInsurance + timeBasedPenalties + (leaveDeductions?.deductionAmount || 0);

      // 11. Calculate net pay
      const netPay = grossPay + overtimeCompensation + (leaveEncashment || 0) - totalDeductions;

      // 12. Check minimum wage compliance
      const minimumWageAlert = netPay < this.MINIMUM_WAGE;
      if (minimumWageAlert) {
        await this.sendMinimumWageAlert(userId, netPay, this.MINIMUM_WAGE);
      }

      // 13. Compile dispute-eligible item IDs
      const disputeEligibleItems = [
        ...allowances.map((a: any) => a.id),
        ...taxDeductions.map((t: any) => t.id),
        ...insuranceDeductions.map((i: any) => i.id),
      ];

      // 14. Return enhanced payslip data
      return {
        payslipId: payslip._id.toString(),
        month: payslipDate.toLocaleDateString('en-US', { month: 'long' }),
        year,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        payGrade: employee.payGrade || 'N/A',

        // Earnings
        baseSalary,
        allowances,
        totalAllowances,
        overtimeCompensation,
        leaveEncashment,
        grossPay,

        // Deductions
        taxDeductions,
        totalTax,
        insuranceDeductions,
        totalInsurance,
        leaveDeductions,
        timeBasedPenalties,
        totalDeductions,

        // Net Pay
        netPay,

        // Compliance
        minimumWage: this.MINIMUM_WAGE,
        minimumWageAlert,

        // Employer Contributions
        employerContributions,
        totalEmployerContributions,

        // Dispute Support
        disputeEligibleItems,
      };
    } catch (error) {
      console.error('Error generating enhanced payslip:', error);
      throw new InternalServerErrorException('Failed to generate enhanced payslip data');
    }
  }
}
