import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
import { EmployeeProfileService } from '../employee-profile/employee-profile.service';

@Injectable()
export class PayrollTrackingService {
  constructor(
    // === FATMA'S INJECTION ===
    @InjectModel(claims.name) private claimModel: Model<claimsDocument>,
    // === FATMA'S INJECTION END ===

    // === ELENA'S INJECTION ===
    @InjectModel(Refund.name) private refundModel: Model<RefundDocument>,
    @InjectModel(paySlip.name) private payslipModel: Model<PayslipDocument>,
    // === ELENA'S INJECTION END ===

    // === MAYA'S INJECTION ===
    @InjectModel(Dispute.name) private disputeModel: Model<DisputeDocument>,
    // === MAYA'S INJECTION END ===

    // === NOTIFICATION INJECTION ===
    @InjectModel(NotificationLog.name) private notificationLogModel: Model<NotificationLogDocument>,
    // === NOTIFICATION INJECTION END ===

    // === EMPLOYEE PROFILE SERVICE ===
    private readonly employeeProfileService: EmployeeProfileService,
  ) {}

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
    const claim = await this.claimModel.findOne({ claimId }).exec();
    
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
    const claim = await this.claimModel.findOne({ claimId }).exec();
    
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
      // Create refund when manager confirms
      await this.createRefundInternal(
        claim._id as Types.ObjectId,
        'Claim',
        claim.amount,
        claim.employeeId,
      );
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
  const newRefund = new this.refundModel(newRefundData);
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
      const updatedRefund = await this.refundModel.findByIdAndUpdate(
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
          yearRange: `${startDate.getFullYear()}-${endDate.getFullYear()}`,
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
            ? `${((yoyGrossChange / prevAvgGross) * 100).toFixed(2)}%` 
            : 'N/A';
          yoyNetPercentage = prevAvgNet > 0 
            ? `${((yoyNetChange / prevAvgNet) * 100).toFixed(2)}%` 
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
      const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';

      return {
        employeeId: userId,
        employeeName,
        yearRange: `${startDate.getFullYear()}-${endDate.getFullYear()}`,
        totalPayslips: payslips.length,
        yearlyData,
        generatedAt: new Date(),
      };
    }

    /**
     * Generate Tax Certificate on-demand for an employee
     * Returns downloadable URL with tax certificate details
     */
    async generateTaxCertificate(userId: string, taxYear: number): Promise<any> {
      // Find all payslips for the employee in the given tax year
      const startDate = new Date(`${taxYear}-01-01`);
      const endDate = new Date(`${taxYear}-12-31`);

      const payslips = await this.payslipModel
        .find({
          employeeId: new Types.ObjectId(userId),
          createdAt: { $gte: startDate, $lte: endDate },
        })
        .exec();

      if (!payslips || payslips.length === 0) {
        throw new NotFoundException(`No payslips found for tax year ${taxYear}`);
      }

      // Fetch employee details
      const employee = await this.employeeProfileService.getProfileById(userId);
      const employeeName = `${employee.firstName} ${employee.lastName}`;

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

      // Generate certificate data
      const certificate = {
        certificateType: 'Tax Certificate',
        employeeId: userId,
        employeeName,
        taxId: `TAX-${userId}-${taxYear}`, // Generate tax ID
        taxYear,
        totalTaxableIncome,
        totalTaxDeducted,
        generatedDate: new Date(),
        downloadUrl: `https://mock-storage.system/certificates/tax/${userId}-${taxYear}.pdf`,
      };

      return certificate;
    }

    /**
     * Generate Insurance Certificate on-demand for an employee
     * Returns downloadable URL with insurance certificate details
     */
    async generateInsuranceCertificate(userId: string, year: number): Promise<any> {
      // Find all payslips for the employee in the given year
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31`);

      const payslips = await this.payslipModel
        .find({
          employeeId: new Types.ObjectId(userId),
          createdAt: { $gte: startDate, $lte: endDate },
        })
        .exec();

      if (!payslips || payslips.length === 0) {
        throw new NotFoundException(`No payslips found for year ${year}`);
      }

      // Fetch employee details
      const employee = await this.employeeProfileService.getProfileById(userId);
      const employeeName = `${employee.firstName} ${employee.lastName}`;

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

      // Generate certificate data
      const certificate = {
        certificateType: 'Insurance Certificate',
        employeeId: userId,
        employeeName,
        insurancePolicyNumber: `INS-${userId}-${year}`,
        coveragePeriod: {
          startDate,
          endDate,
        },
        totalEmployeeContribution,
        totalEmployerContribution,
        generatedDate: new Date(),
        downloadUrl: `https://mock-storage.system/certificates/insurance/${userId}-${year}.pdf`,
      };

      return certificate;
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
      const refunds = await this.refundModel
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
      const processedRefunds = await this.refundModel
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

    // === MAYA START ===
    /**
     * Employee submits a new payroll dispute. 
     */
    async submitDispute(userId: Types.ObjectId, dto: CreateDisputeDto): Promise<Dispute> {
        // NOTE: We use your schema's property names: employeeId, payslipId, status
        const newDispute = new this.disputeModel({
            disputeId: `DISP-${Date.now()}`, // Generate unique ID
            employeeId: userId, 
            payslipId: new Types.ObjectId(dto.payslipId),
            description: dto.description,
            status: DisputeStatus.UNDER_REVIEW, // Use your enum value
        });
        return newDispute.save();
    }
    
    /**
     * HR/Payroll Specialist resolves an existing dispute.
     * Now moves to PENDING_MANAGER_APPROVAL instead of directly APPROVED
     */
    async resolveDispute(disputeId: string, payrollSpecialistId: Types.ObjectId, dto: ResolveDisputeDto): Promise<Dispute> {
        // Find dispute first
        const dispute = await this.disputeModel.findOne({ disputeId }).exec();
        
        if (!dispute) {
            throw new NotFoundException(`Dispute with ID ${disputeId} not found.`);
        }

        // Specialist can approve (moves to PENDING_MANAGER_APPROVAL) or reject
        let newStatus = dto.status;
        if (dto.status === DisputeStatus.APPROVED) {
            newStatus = DisputeStatus.PENDING_MANAGER_APPROVAL;
        }

        // Use findOneAndUpdate to find by the unique string ID (disputeId)
        const updatedDispute = await this.disputeModel.findOneAndUpdate(
            { disputeId: disputeId },
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
        // Find the dispute first
        const dispute = await this.disputeModel.findOne({ disputeId }).exec();
        
        if (!dispute) {
            throw new NotFoundException(`Dispute with ID ${disputeId} not found`);
        }

        // Verify dispute is in the correct state
        if (dispute.status !== DisputeStatus.PENDING_MANAGER_APPROVAL) {
            throw new BadRequestException(
                `Dispute must be in PENDING_MANAGER_APPROVAL status. Current status: ${dispute.status}`,
            );
        }

        let finalStatus: DisputeStatus;
        let resolutionComment: string | undefined;

        if (dto.action === 'confirm') {
            finalStatus = DisputeStatus.APPROVED;
            // Create refund when manager confirms
            // NOTE: Amount is placeholder (100) - should be fixed in M3
            await this.createRefundInternal(
                dispute._id as Types.ObjectId,
                'Dispute',
                100, // Placeholder amount
                dispute.employeeId,
            );
        } else {
            // reject
            finalStatus = DisputeStatus.REJECTED;
            resolutionComment = dto.rejectionReason || 'Rejected by manager';
        }

        // Update the dispute with manager's decision
        const updatedDispute = await this.disputeModel.findOneAndUpdate(
            { disputeId },
            {
                status: finalStatus,
                resolutionComment,
            },
            { new: true }
        ).exec();

        if (!updatedDispute) {
            throw new NotFoundException(`Failed to update dispute with ID ${disputeId}`);
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
    
    // === MAYA END ===
}
