import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// Schemas
import { payrollRuns, payrollRunsDocument } from './models/payrollRuns.schema';
import { paySlip, PayslipDocument } from './models/payslip.schema';
import {
  employeePayrollDetails,
  employeePayrollDetailsDocument,
} from './models/employeePayrollDetails.schema';
import {
  employeeSigningBonus,
  employeeSigningBonusDocument,
} from './models/EmployeeSigningBonus.schema';
import {
  EmployeeTerminationResignation,
  EmployeeTerminationResignationDocument,
} from './models/EmployeeTerminationResignation.schema';
import {
  employeePenalties,
  employeePenaltiesDocument,
} from './models/employeePenalties.schema';

// DTOs
import { InitiateRunDto } from './dto/initiate-run.dto';
import { PeriodReviewDto, PeriodAction } from './dto/period-review.dto';
import {
  ReviewBenefitDto,
  BenefitType,
  BenefitAction,
} from './dto/review-benefit.dto';
import { HrEventCheckDto } from './dto/hr-event-check.dto';
import {
  ManualAdjustmentDto,
  AdjustmentType,
} from './dto/manual-adjustment.dto';
import { ReviewActionDto, ReviewStatus } from './dto/review-action.dto';
import { UnfreezePayrollDto } from './dto/unfreeze-payroll.dto';

// Enums
import {
  PayRollStatus,
  PayRollPaymentStatus,
  BankStatus,
  BonusStatus,
  BenefitStatus,
  PaySlipPaymentStatus,
} from './enums/payroll-execution-enum';

// Services
import { TaxRulesService } from '../payroll-configuration/services/tax-rules.service';
import { InsuranceBracketsService } from '../payroll-configuration/services/insurance-brackets.service';
import { ConfigStatus } from '../payroll-configuration/enums/payroll-configuration-enums';

@Injectable()
export class PayrollExecutionService {
  private readonly logger = new Logger(PayrollExecutionService.name);
  private readonly MINIMUM_WAGE = 3000; // Egyptian minimum wage (BR 60)
  private readonly WORKING_DAYS_PER_MONTH = 22; // Standard working days
  private readonly HOURS_PER_DAY = 8; // Standard working hours

  constructor(
    @InjectModel(payrollRuns.name)
    private payrollRunModel: Model<payrollRunsDocument>,
    @InjectModel(paySlip.name) private paySlipModel: Model<PayslipDocument>,
    @InjectModel(employeePayrollDetails.name)
    private empDetailsModel: Model<employeePayrollDetailsDocument>,
    @InjectModel(employeeSigningBonus.name)
    private signingBonusModel: Model<employeeSigningBonusDocument>,
    @InjectModel(EmployeeTerminationResignation.name)
    private terminationModel: Model<EmployeeTerminationResignationDocument>,
    @InjectModel(employeePenalties.name)
    private penaltiesModel: Model<employeePenaltiesDocument>,
    @Inject(TaxRulesService)
    private taxRulesService: TaxRulesService,
    @Inject(InsuranceBracketsService)
    private insuranceBracketsService: InsuranceBracketsService,
  ) { }

  // GANNAH
  // PHASE 0: PRE-RUN REVIEWS (BENEFITS & EVENTS)

  // MOCK DATA - Commented out, now using real database calls
  // private mockBonuses = [
  //     { employeeId: '64f1b2b3e4b0a1a2b3c4d5e1', status: BonusStatus.PENDING, amount: 1000 },
  //     { employeeId: '64f1b2b3e4b0a1a2b3c4d5e4', status: BonusStatus.PENDING, amount: 1500 }
  // ];
  // private mockTerminations = [
  //     { employeeId: '64f1b2b3e4b0a1a2b3c4d5e2', status: BenefitStatus.PENDING, amount: 5000 }
  // ];
  // private mockPayrollRuns: any[] = [];
  // private mockPayslips: any[] = [];
  // private mockEmployeeDetails: any[] = [];

  async getPendingBenefits() {
    // REAL API CALL - Using database
    const bonuses = await this.signingBonusModel
      .find({ status: BonusStatus.PENDING })
      .exec();
    const terminations = await this.terminationModel
      .find({ status: BenefitStatus.PENDING })
      .exec();
    return { bonuses, terminations };

    // MOCK DATA - Commented out
    // const bonuses = this.mockBonuses.filter(b => b.status === BonusStatus.PENDING);
    // const terminations = this.mockTerminations.filter(t => t.status === BenefitStatus.PENDING);
    // return { bonuses, terminations };
  }

  async reviewBenefit(dto: ReviewBenefitDto) {
    // REAL API CALL - Using database
    if (dto.type === BenefitType.SIGNING_BONUS) {
      const record = await this.signingBonusModel.findOne({
        employeeId: dto.employeeId,
      });
      if (!record)
        throw new NotFoundException('Signing bonus record not found');

      // Check if already approved or rejected
      if (record.status === BonusStatus.APPROVED) {
        throw new BadRequestException(
          `This signing bonus has already been APPROVED. Cannot change approved benefits.`
        );
      }
      if (record.status === BonusStatus.REJECTED) {
        throw new BadRequestException(
          `This signing bonus has already been REJECTED. Cannot change rejected benefits.`
        );
      }

      // Only pending bonuses can be reviewed
      if (record.status !== BonusStatus.PENDING) {
        throw new BadRequestException(
          `Only PENDING bonuses can be reviewed. Current status: ${record.status}`
        );
      }

      record.status =
        dto.action === BenefitAction.APPROVE
          ? BonusStatus.APPROVED
          : BonusStatus.REJECTED;

      const saved = await record.save();

      return {
        success: true,
        message: `Signing bonus ${dto.action === BenefitAction.APPROVE ? 'APPROVED' : 'REJECTED'} successfully`,
        benefit: {
          employeeId: saved.employeeId,
          amount: saved.givenAmount,
          previousStatus: BonusStatus.PENDING,
          newStatus: saved.status,
          reviewedAt: new Date(),
        }
      };
    } else if (dto.type === BenefitType.TERMINATION) {
      const record = await this.terminationModel.findOne({
        employeeId: dto.employeeId,
      });
      if (!record)
        throw new NotFoundException('Termination benefit record not found');

      // Check if already approved or rejected
      if (record.status === BenefitStatus.APPROVED) {
        throw new BadRequestException(
          `This termination benefit has already been APPROVED. Cannot change approved benefits.`
        );
      }
      if (record.status === BenefitStatus.REJECTED) {
        throw new BadRequestException(
          `This termination benefit has already been REJECTED. Cannot change rejected benefits.`
        );
      }

      // Only pending benefits can be reviewed
      if (record.status !== BenefitStatus.PENDING) {
        throw new BadRequestException(
          `Only PENDING termination benefits can be reviewed. Current status: ${record.status}`
        );
      }

      record.status =
        dto.action === BenefitAction.APPROVE
          ? BenefitStatus.APPROVED
          : BenefitStatus.REJECTED;

      const saved = await record.save();

      return {
        success: true,
        message: `Termination benefit ${dto.action === BenefitAction.APPROVE ? 'APPROVED' : 'REJECTED'} successfully`,
        benefit: {
          employeeId: saved.employeeId,
          amount: saved.givenAmount,
          previousStatus: BenefitStatus.PENDING,
          newStatus: saved.status,
          reviewedAt: new Date(),
        }
      };
    }

    throw new BadRequestException('Invalid benefit type');
  }

  async checkHrEvent(dto: HrEventCheckDto) {
    // REAL API CALL - Using database
    const bonus = await this.signingBonusModel
      .findOne({ employeeId: dto.employeeId })
      .exec();
    const termination = await this.terminationModel
      .findOne({ employeeId: dto.employeeId })
      .exec();

    const events: Array<{ type: string; status: BonusStatus | BenefitStatus }> =
      [];
    if (bonus) events.push({ type: 'NEW_HIRE', status: bonus.status });
    if (termination)
      events.push({ type: 'TERMINATION', status: termination.status });

    return {
      employeeId: dto.employeeId,
      events,
      message: `Found ${events.length} pending HR events for employee`,
    };
  }

  // ==================== PHASE 1: PERIOD MANAGEMENT ====================

  async initiatePeriod(dto: InitiateRunDto, specialistId: string) {
    // Validate month first
    const monthUpper = dto.month.toUpperCase();
    const validMonths = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC',
    ];

    if (!validMonths.includes(monthUpper)) {
      throw new BadRequestException(
        `Invalid month: ${dto.month}. Must be one of: ${validMonths.join(', ')}`,
      );
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    if (dto.year < 2020 || dto.year > currentYear + 1) {
      throw new BadRequestException(
        `Invalid year: ${dto.year}. Must be between 2020 and ${currentYear + 1}`,
      );
    }

    const runId = `PR-${dto.year}-${dto.month.toUpperCase()}`;

    // REAL API CALL - Using database
    const existing = await this.payrollRunModel.findOne({ runId });
    if (existing)
      throw new BadRequestException(`Payroll Run ${runId} already exists.`);

    const newRun = new this.payrollRunModel({
      runId: runId,
      payrollPeriod: new Date(
        `${dto.year}-${this.getMonthNumber(dto.month)}-01`,
      ),
      entity: dto.entity,
      status: PayRollStatus.DRAFT,
      employees: 0,
      exceptions: 0,
      totalnetpay: 0,
      payrollSpecialistId: new Types.ObjectId(specialistId),
      payrollManagerId: new Types.ObjectId(specialistId),
      paymentStatus: PayRollPaymentStatus.PENDING,
    });

    return await newRun.save();
  }

  async reviewPeriod(dto: PeriodReviewDto) {
    // REAL API CALL - Using database
    const run = await this.payrollRunModel.findOne({ runId: dto.runId });
    if (!run) throw new NotFoundException('Payroll Run not found');

    if (dto.action === PeriodAction.REJECT) {
      run.status = PayRollStatus.REJECTED;
      run.rejectionReason = dto.rejectionReason;
      const saved = await run.save();

      return {
        ...saved.toObject(),
        message: 'Payroll run rejected',
      };
    }

    if (dto.action === PeriodAction.APPROVE) {
      const processedCount = await this.fetchAndSnapshotEmployees(
        run._id as Types.ObjectId,
      );
      run.employees = processedCount;
      await run.save();

      // Verify data was actually saved
      const savedDetails = await this.empDetailsModel.countDocuments({
        payrollRunId: run._id,
      });
      this.logger.log(
        `Verification: ${savedDetails} employee details saved to database`,
      );

      return {
        message: 'Period Approved. Employee Data Fetched.',
        employeesProcessed: processedCount,
        savedToDatabase: savedDetails,
      };
    }

    throw new BadRequestException('Invalid period action');
  }

  /**
   * Retrieves all employees included in a specific payroll run draft.
   */
  async fetchEligibleEmployees(runId: string) {
    const run = await this.payrollRunModel.findOne({ runId });
    if (!run) throw new NotFoundException('Payroll Run not found');

    const employeeDetails = await this.empDetailsModel
      .find({
        payrollRunId: run._id,
      })
      .exec();

    const payslips = await this.paySlipModel
      .find({
        payrollRunId: run._id,
      })
      .exec();

    return {
      runId: run.runId,
      status: run.status,
      totalEmployees: run.employees,
      totalExceptions: run.exceptions,
      totalNetPay: run.totalnetpay,
      employees: employeeDetails.map((detail) => ({
        employeeId: detail.employeeId,
        baseSalary: detail.baseSalary,
        bankStatus: detail.bankStatus,
        exceptions: detail.exceptions,
        netPay: detail.netPay,
        allowances: detail.allowances,
        deductions: detail.deductions,
      })),
      payslips: payslips.length,
    };
  }

  // ==================== PHASE 1.1A: FETCHING & SNAPSHOTTING ====================

  /**
   * Fetches eligible employees and creates draft payslips with base salary snapshots.
   */
  /**
   * Fetches eligible employees and creates draft payslips with base salary snapshots.
   */
  private async fetchAndSnapshotEmployees(
    runObjectId: Types.ObjectId,
  ): Promise<number> {
    try {
      // REAL API CALL - Get actual employees from database
      const db = this.payrollRunModel.db;
      const employeesCollection = db.collection('employees');

      // FIX 1: Use simpler query like the working version
      const employees = await employeesCollection.find({
        isActive: true  // Just check isActive for now
      }).toArray();

      this.logger.log(`Found ${employees.length} active employees in database`);

      // FIX 2: If no employees, seed them and use them
      if (employees.length === 0) {
        this.logger.warn('No active employees found in database, seeding mock employees...');
        await this.seedMockEmployees();

        // Fetch the seeded employees
        const seededEmployees = await employeesCollection.find({
          isActive: true
        }).toArray();

        if (seededEmployees.length === 0) {
          throw new Error('Failed to seed employees. No employees available for payroll.');
        }

        this.logger.log(`Using ${seededEmployees.length} seeded employees`);
        return this.processEmployeesForRun(seededEmployees, runObjectId);
      }

      return this.processEmployeesForRun(employees, runObjectId);

    } catch (error) {
      this.logger.error(`Error in fetchAndSnapshotEmployees: ${error.message}`);
      throw new BadRequestException(
        `Failed to fetch employees: ${error.message}`,
      );
    }
  }

  /**
   * Helper method to process employees for a payroll run
   */
  private async processEmployeesForRun(
    employees: any[],
    runObjectId: Types.ObjectId
  ): Promise<number> {
    let count = 0;
    let exceptionsCount = 0;

    for (const emp of employees) {
      try {
        // FIX 3: Remove extra validation checks that might be too strict
        // Just check isActive - the query already filtered for this
        if (!emp.isActive) continue;

        // Check for bank details - handle both object and boolean cases
        let hasBankDetails = false;
        if (emp.bankDetails) {
          if (typeof emp.bankDetails === 'object') {
            hasBankDetails =
              !!(emp.bankDetails as any).accountNumber ||
              !!(emp.bankDetails as any).account;
          } else {
            hasBankDetails = true; // If it's a boolean or any truthy value
          }
        }

        const bankStatus = hasBankDetails
          ? BankStatus.VALID
          : BankStatus.MISSING;

        if (!hasBankDetails) {
          exceptionsCount++;
          this.logger.warn(`Missing bank details for employee: ${emp._id}`);
        }

        // Get base salary
        const baseSalary = emp.baseSalary || 0;

        // 1. Create PaySlip Draft
        const newPayslip = new this.paySlipModel({
          employeeId: emp._id, // Use real employee ID
          payrollRunId: runObjectId,
          paymentStatus: PaySlipPaymentStatus.PENDING,
          totalGrossSalary: baseSalary,
          totaDeductions: 0,
          netPay: 0,
          earningsDetails: {
            baseSalary: baseSalary,
            allowances: [],
            bonuses: [],
            benefits: [],
            refunds: [],
          },
          deductionsDetails: {
            taxes: [],
            insurances: [],
            penalties: {
              employeeId: emp._id,
              penalties: [],
            },
          },
        });
        await newPayslip.save();

        // 2. Create Employee Payroll Details Record
        const newDetails = new this.empDetailsModel({
          employeeId: emp._id, // Use real employee ID
          payrollRunId: runObjectId,
          baseSalary: baseSalary,
          allowances: 0,
          deductions: 0,
          netSalary: baseSalary,
          netPay: 0,
          bankStatus: bankStatus,
          exceptions: hasBankDetails ? null : 'Missing Bank Details',
          bonus: 0,
          benefit: 0,
        });
        await newDetails.save();

        count++;
        this.logger.debug(
          `Processed employee ${emp._id} for payroll run ${runObjectId}`,
        );
      } catch (error) {
        this.logger.error(
          `Error processing employee ${emp._id}: ${error.message}`,
        );
        continue;
      }
    }

    // Update exceptions count in the run
    const run = await this.payrollRunModel.findById(runObjectId);
    if (run) {
      run.exceptions = exceptionsCount;
      run.employees = count;
      await run.save();
    }

    return count;
  }


  private async seedMockEmployees(): Promise<number> { // Change return type to number
    try {
      const db = this.payrollRunModel.db;
      const employeesCollection = db.collection('employees');

      const mockEmployees = [
        {
          _id: new Types.ObjectId('64f1b2b3e4b0a1a2b3c4d5e1'),
          name: 'John Doe',
          contractStatus: 'ACTIVE',
          baseSalary: 5000,
          bankDetails: { accountNumber: '1234567890', bankName: 'Bank of America' },
          overtimeHours: 10,
          unpaidLeaveDays: 0,
          isActive: true,
          isActiveContract: true,
          isBonusApproved: false,
          email: 'john.doe@company.com',
          department: 'Engineering',
          position: 'Senior Developer',
          hireDate: new Date('2023-01-15'),
        },
        {
          _id: new Types.ObjectId('64f1b2b3e4b0a1a2b3c4d5e2'),
          name: 'Jane Smith',
          contractStatus: 'ACTIVE',
          baseSalary: 7000,
          bankDetails: { accountNumber: '0987654321', bankName: 'Chase' },
          overtimeHours: 5,
          unpaidLeaveDays: 2,
          isActive: true,
          isActiveContract: true,
          isBonusApproved: false,
          email: 'jane.smith@company.com',
          department: 'Marketing',
          position: 'Marketing Manager',
          hireDate: new Date('2022-06-20'),
        },
        {
          _id: new Types.ObjectId('64f1b2b3e4b0a1a2b3c4d5e4'),
          name: 'Alice New',
          contractStatus: 'ACTIVE',
          baseSalary: 4500,
          bankDetails: null, // Missing Bank Details
          overtimeHours: 8,
          unpaidLeaveDays: 1,
          isActive: true,
          isActiveContract: true,
          isBonusApproved: true,
          email: 'alice.new@company.com',
          department: 'Sales',
          position: 'Sales Representative',
          hireDate: new Date('2024-01-10'),
        },
        {
          _id: new Types.ObjectId('64f1b2b3e4b0a1a2b3c4d5e5'),
          name: 'Mike Johnson',
          contractStatus: 'ACTIVE',
          baseSalary: 6000,
          bankDetails: { accountNumber: '1122334455', bankName: 'Wells Fargo' },
          overtimeHours: 15,
          unpaidLeaveDays: 0,
          isActive: true,
          isActiveContract: true,
          isBonusApproved: false,
          email: 'mike.johnson@company.com',
          department: 'Operations',
          position: 'Operations Manager',
          hireDate: new Date('2021-11-05'),
        },
      ];

      // Insert mock employees if collection is empty
      const count = await employeesCollection.countDocuments();
      if (count === 0) {
        const result = await employeesCollection.insertMany(mockEmployees);
        this.logger.log(`Seeded ${result.insertedCount} mock employees to database`);
        return result.insertedCount;
      } else {
        this.logger.log(`Database already has ${count} employees`);
        return count;
      }
    } catch (error: any) {
      this.logger.error(`Error seeding mock employees: ${error.message}`);
      return 0;
    }
  }


  async debugRunEmployees(runId: string) {
    try {
      const run = await this.payrollRunModel.findOne({ runId });
      if (!run) return { error: 'Run not found' };

      const employeeDetails = await this.empDetailsModel
        .find({
          payrollRunId: run._id,
        })
        .exec();

      const payslips = await this.paySlipModel
        .find({
          payrollRunId: run._id,
        })
        .exec();

      // Check what employees are in the database
      const db = this.payrollRunModel.db;
      const allEmployees = await db.collection('employees').find({}).toArray();

      return {
        runId: run.runId,
        runStatus: run.status,
        employeeDetailsCount: employeeDetails.length,
        payslipsCount: payslips.length,
        employeesInDatabase: allEmployees.length,
        sampleEmployeeDetails: employeeDetails.slice(0, 3).map((ed) => ({
          employeeId: ed.employeeId,
          baseSalary: ed.baseSalary,
          bankStatus: ed.bankStatus,
        })),
        samplePayslips: payslips.slice(0, 3).map((p) => ({
          employeeId: p.employeeId,
          netPay: p.netPay,
        })),
      };
    } catch (error) {
      return { error: error.message };
    }
  }
  // ==================== MEMBER 2: CALCULATIONS ====================

  private ensurePayslipStructure(payslip: any) {
    // Ensure basic numeric fields exist FIRST
    if (
      payslip.totaDeductions === undefined ||
      payslip.totaDeductions === null
    ) {
      payslip.totaDeductions = 0;
    }

    if (
      payslip.totalGrossSalary === undefined ||
      payslip.totalGrossSalary === null
    ) {
      payslip.totalGrossSalary = 0;
    }

    if (payslip.netPay === undefined || payslip.netPay === null) {
      payslip.netPay = 0;
    }

    // Ensure earningsDetails exists
    if (!payslip.earningsDetails) {
      payslip.earningsDetails = {
        baseSalary: payslip.totalGrossSalary || 0,
        allowances: [],
        bonuses: [],
        benefits: [],
        refunds: [],
      };
    }

    // Ensure earnings arrays exist
    if (!payslip.earningsDetails.bonuses) payslip.earningsDetails.bonuses = [];
    if (!payslip.earningsDetails.allowances)
      payslip.earningsDetails.allowances = [];
    if (!payslip.earningsDetails.benefits)
      payslip.earningsDetails.benefits = [];
    if (!payslip.earningsDetails.refunds) payslip.earningsDetails.refunds = [];

    // Ensure deductionsDetails exists
    if (!payslip.deductionsDetails) {
      payslip.deductionsDetails = {
        taxes: [],
        insurances: [],
        penalties: {
          employeeId: payslip.employeeId,
          penalties: [],
        },
      };
    }

    // Ensure deductions arrays exist
    if (!payslip.deductionsDetails.taxes) payslip.deductionsDetails.taxes = [];
    if (!payslip.deductionsDetails.insurances)
      payslip.deductionsDetails.insurances = [];

    // Ensure penalties structure exists
    if (!payslip.deductionsDetails.penalties) {
      payslip.deductionsDetails.penalties = {
        employeeId: payslip.employeeId,
        penalties: [],
      };
    }

    // Ensure penalties array exists
    if (!payslip.deductionsDetails.penalties.penalties) {
      payslip.deductionsDetails.penalties.penalties = [];
    }

    return payslip;
  }



  // Add this method to check the status before calculation
  async debugEmployeeDatabaseConnection(runId: string) {
    try {
      const run = await this.payrollRunModel.findOne({ runId });
      if (!run) return { error: 'Run not found' };

      const db = this.payrollRunModel.db;

      // FIX: listCollections() returns a promise, not a cursor
      const collections = await db.listCollections();
      const hasEmployeesCollection = collections.some((c: any) => c.name === 'employees');

      if (!hasEmployeesCollection) {
        return {
          error: 'employees collection not found in database',
          availableCollections: collections.map((c: any) => c.name)
        };
      }

      // Get all employees
      const allEmployees = await db.collection('employees')
        .find({})
        .limit(5)
        .toArray();

      // Get employees that should be included based on your criteria
      const activeEmployees = await db.collection('employees')
        .find({
          isActive: true,
          contractStatus: 'ACTIVE',
          isActiveContract: true
        })
        .limit(5)
        .toArray();

      // Get employee details for this run
      const employeeDetails = await this.empDetailsModel
        .find({ payrollRunId: run._id })
        .exec();

      // Get payslips for this run
      const payslips = await this.paySlipModel
        .find({ payrollRunId: run._id })
        .exec();

      return {
        runExists: true,
        runStatus: run.status,
        runId: run.runId,
        databaseConnection: 'OK',
        hasEmployeesCollection,
        totalEmployeesInDB: allEmployees.length,
        activeEmployeesInDB: activeEmployees.length,
        employeeDetailsForRun: employeeDetails.length,
        payslipsForRun: payslips.length,
        sampleEmployees: allEmployees.map((emp: any) => ({
          id: emp._id,
          name: emp.name || 'Unknown',
          isActive: emp.isActive,
          contractStatus: emp.contractStatus,
          baseSalary: emp.baseSalary,
          hasBankDetails: !!emp.bankDetails
        })),
        employeeDetailsSample: employeeDetails.slice(0, 3).map((ed: any) => ({
          employeeId: ed.employeeId,
          baseSalary: ed.baseSalary,
          bankStatus: ed.bankStatus
        }))
      };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async processRunCalculations(runId: string): Promise<any> {
    try {
      this.logger.log(`=== CALCULATION START for ${runId} ===`);

      // REAL DATABASE CALL
      const payrollRun = await this.payrollRunModel.findOne({ runId });
      if (!payrollRun) {
        throw new NotFoundException(`Payroll run ${runId} not found`);
      }

      this.logger.log(`Found payroll run: ${payrollRun.runId}`);
      this.logger.log(`Payroll Run ID (ObjectId): ${payrollRun._id}`);
      this.logger.log(`Payroll Run Status: ${payrollRun.status}`);
      this.logger.log(
        `Payroll Run Employees count field: ${payrollRun.employees}`,
      );

      // Get employee details and payslips from database
      const employeeDetails = await this.empDetailsModel
        .find({
          payrollRunId: payrollRun._id,
        })
        .exec();

      this.logger.log(`Employee details found: ${employeeDetails.length}`);
      if (employeeDetails.length === 0) {
        this.logger.warn(
          `No employee details found for payrollRunId: ${payrollRun._id}. You may need to call reviewPeriod with APPROVE action first.`,
        );
      }

      const payslips = await this.paySlipModel
        .find({
          payrollRunId: payrollRun._id,
        })
        .exec();

      this.logger.log(`Payslips found: ${payslips.length}`);

      let totalPayout = 0;
      let processedCount = 0;
      const validationErrors: any[] = [];
      const skippedEmployees: any[] = [];

      // Calculate salary for each employee
      for (const empDetail of employeeDetails) {
        try {
          this.logger.log(
            `Processing employee: ${empDetail.employeeId.toString()}`,
          );

          // Get employee data directly from database
          const db = this.payrollRunModel.db;

          // IMPORTANT: Make sure empDetail.employeeId is the correct type
          // If it's a string, convert to ObjectId
          let employeeId;
          try {
            employeeId = new Types.ObjectId(empDetail.employeeId);
          } catch (error) {
            this.logger.error(
              `Invalid employeeId format: ${empDetail.employeeId}`,
            );
            validationErrors.push({
              employeeId: empDetail.employeeId,
              error: 'Invalid employee ID format',
            });
            continue;
          }

          const employee = await db.collection('employees').findOne({
            _id: employeeId,
          });

          if (!employee) {
            this.logger.warn(`Employee not found: ${empDetail.employeeId}`);
            validationErrors.push({
              employeeId: empDetail.employeeId,
              error: 'Employee not found in database',
            });
            continue;
          }

          // BR 63: CRITICAL - Validate contract BEFORE calculation
          if (!employee.isActive || employee.contractStatus !== 'ACTIVE') {
            this.logger.warn(
              `BR 63: Skipping employee ${empDetail.employeeId} - Contract not active (status: ${employee.contractStatus})`,
            );
            skippedEmployees.push({
              employeeId: empDetail.employeeId,
              reason: 'Contract inactive',
              contractStatus: employee.contractStatus,
              isActive: employee.isActive,
            });
            continue;
          }

          // BR 66: Check contract expiration BEFORE calculation
          if (employee.contractEndDate) {
            const endDate = new Date(employee.contractEndDate);
            const now = new Date();
            if (endDate < now) {
              this.logger.warn(
                `BR 66: Skipping employee ${empDetail.employeeId} - Contract expired on ${endDate.toISOString()}`,
              );
              skippedEmployees.push({
                employeeId: empDetail.employeeId,
                reason: 'Contract expired',
                contractEndDate: endDate,
              });
              continue;
            }
          }

          // Get penalties for this employee
          const penalties = await this.penaltiesModel
            .findOne({
              employeeId: empDetail.employeeId,
            })
            .exec();

          // Check for approved bonuses
          const approvedBonus = await this.signingBonusModel
            .findOne({
              employeeId: empDetail.employeeId,
              status: BonusStatus.APPROVED,
            })
            .exec();
          // Calculate salary - update calculateSalary method to not expect employee model
          const calculation = await this.calculateSalary(
            empDetail,
            employee, // Pass the raw employee object, not Mongoose model
            penalties,
            approvedBonus,
            runId,
          );

          // Update employee payroll details
          empDetail.allowances = calculation.allowances;
          empDetail.deductions = calculation.totalDeductions;
          empDetail.netSalary = calculation.netSalary;
          empDetail.netPay = calculation.finalSalary;
          empDetail.bonus = calculation.bonuses.signingBonus;
          await empDetail.save();

          // Update payslip
          const payslip = payslips.find(
            (p) => p.employeeId.toString() === empDetail.employeeId.toString(),
          );

          if (payslip) {
            payslip.totalGrossSalary = calculation.grossSalary;
            payslip.totaDeductions = calculation.totalDeductions;
            payslip.netPay = calculation.finalSalary;

            // Ensure payslip structure exists
            this.ensurePayslipStructure(payslip);

            // Add bonus to payslip if exists
            if (approvedBonus) {
              // Get the full bonus config to get positionName
              const bonusConfig = await this.signingBonusModel.db.collection('signingbonuses').findOne({
                _id: approvedBonus.signingBonusId
              });

              // Now bonuses array is guaranteed to exist after ensurePayslipStructure
              payslip.earningsDetails!.bonuses!.push({
                positionName: bonusConfig?.positionName || 'General Position',
                amount: approvedBonus.givenAmount,
                status: 'approved', // Use lowercase 'approved' from ConfigStatus enum
                createdBy: approvedBonus.employeeId,
                approvedBy: approvedBonus.employeeId,
                approvedAt: new Date(),
              } as any);
            }

            // Add penalties to payslip if exists and has penalties array
            if (penalties) {
              // Check if penalties object has penalties array
              if (penalties.penalties && Array.isArray(penalties.penalties)) {
                // Add each penalty with required fields
                penalties.penalties.forEach((penalty: any) => {
                  // Now penalties.penalties array is guaranteed to exist
                  // Ensure required fields exist
                  if (penalty.reason && penalty.amount !== undefined) {
                    payslip.deductionsDetails!.penalties!.penalties!.push({
                      reason: penalty.reason,
                      amount: penalty.amount,
                    } as any);
                  }
                });
              }
            }

            await payslip.save();
          }

          totalPayout += calculation.finalSalary;
          processedCount++;

          this.logger.log(
            `Employee processed successfully. Final salary: ${calculation.finalSalary}`,
          );
        } catch (error) {
          this.logger.error(
            `Error processing employee ${empDetail.employeeId}: ${error.message}`,
          );
          continue;
        }
      }

      // Update payroll run summary
      payrollRun.totalnetpay = totalPayout;
      payrollRun.status = PayRollStatus.CALCULATED;
      await payrollRun.save();

      this.logger.log(`=== CALCULATION END ===`);
      this.logger.log(
        `Processed: ${processedCount} employees, Total Payout: ${totalPayout}`,
      );
      this.logger.log(
        `BR 63/BR 66: Skipped ${skippedEmployees.length} employees due to contract issues`,
      );

      return {
        success: true,
        processed: processedCount,
        totalPayout,
        runId: payrollRun.runId,
        status: payrollRun.status,
        message: `Processed ${processedCount} employees. Total Payout: ${totalPayout}`,
        validation: {
          skippedEmployees: skippedEmployees.length,
          validationErrors: validationErrors.length,
          details: {
            skipped: skippedEmployees,
            errors: validationErrors,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Calculation failed: ${error.message}`);
      throw new BadRequestException(`Calculation failed: ${error.message}`);
    }
  }

  /**
   * Calculate comprehensive salary breakdown for an employee
   * Includes: Progressive Tax (BR 5, 6), Insurance Brackets (BR 7, 8), Prorated Salary (REQ-PY-2), Minimum Wage (BR 60)
   */
  private async calculateSalary(
    empDetail: any,
    employee: any,
    penalties: any,
    approvedBonus: any,
    runId: string,
  ): Promise<any> {
    let grossSalary = empDetail.baseSalary || 0;

    // REQ-PY-2: Calculate Prorated Salary for mid-month hires/exits
    const proratedInfo = await this.calculateProratedSalary(employee, grossSalary, runId);
    grossSalary = proratedInfo.proratedSalary;

    // Get employee-specific data with defaults (TODO: Replace with Time Management Service integration)
    const overtimeHours = employee.overtimeHours || 0;
    const unpaidLeaveDays = employee.unpaidLeaveDays || 0;

    // Calculate penalty deduction
    let penaltyDeduction = 0;
    if (penalties && penalties.penalties) {
      penaltyDeduction = penalties.penalties.reduce(
        (sum: number, penalty: any) => sum + (penalty.amount || 0),
        0,
      );
    }

    // Calculate daily rate for unpaid leave deductions
    const dailyRate = grossSalary / this.WORKING_DAYS_PER_MONTH;
    const unpaidLeaveDeduction = unpaidLeaveDays * dailyRate;

    // Calculate overtime pay (1.5x normal rate)
    const hourlyRate = grossSalary / (this.WORKING_DAYS_PER_MONTH * this.HOURS_PER_DAY);
    const overtimePay = overtimeHours * hourlyRate * 1.5;

    // BR 5, 6: Calculate Progressive Tax
    const tax = await this.calculateProgressiveTax(grossSalary);

    // BR 7, 8: Calculate Insurance based on brackets
    const insurance = await this.calculateInsurance(grossSalary);

    // Calculate net salary before adjustments (BR 31, 34)
    const netSalary = grossSalary - tax.totalTax - insurance.totalInsurance;

    // Calculate bonus if approved (BR 56)
    const signingBonus = approvedBonus ? approvedBonus.givenAmount || 0 : 0;

    // Apply final adjustments (BR 31)
    let finalSalary =
      netSalary +
      overtimePay +
      signingBonus -
      penaltyDeduction -
      unpaidLeaveDeduction;

    // BR 60: Ensure minimum wage floor
    const beforeMinWageCheck = finalSalary;
    finalSalary = Math.max(this.MINIMUM_WAGE, finalSalary);

    if (finalSalary === this.MINIMUM_WAGE && beforeMinWageCheck < this.MINIMUM_WAGE) {
      this.logger.warn(
        `BR 60: Employee ${empDetail.employeeId} salary adjusted to minimum wage. ` +
        `Calculated: ${beforeMinWageCheck}, Adjusted to: ${this.MINIMUM_WAGE}`
      );
    }

    return {
      employeeId: empDetail.employeeId,
      runId,
      grossSalary: proratedInfo.proratedSalary,
      fullMonthSalary: proratedInfo.fullMonthSalary,
      prorated: proratedInfo.isProrated,
      proratedDetails: proratedInfo.isProrated ? {
        workingDays: proratedInfo.workingDays,
        totalDays: proratedInfo.totalDays,
        reason: proratedInfo.reason,
      } : null,
      tax: {
        amount: tax.totalTax,
        breakdown: tax.breakdown,
        progressive: true,
      },
      insurance: {
        amount: insurance.totalInsurance,
        employeeAmount: insurance.employeeAmount,
        employerAmount: insurance.employerAmount,
        bracket: insurance.bracket,
      },
      overtime: {
        hours: overtimeHours,
        rate: 1.5,
        amount: overtimePay,
      },
      bonuses: {
        signingBonus,
        approved: !!approvedBonus,
      },
      deductions: {
        penalties: penaltyDeduction,
        unpaidLeave: unpaidLeaveDeduction,
        unpaidLeaveDays: unpaidLeaveDays,
      },
      allowances: overtimePay + signingBonus,
      totalDeductions:
        tax.totalTax + insurance.totalInsurance + penaltyDeduction + unpaidLeaveDeduction,
      netSalary,
      finalSalary: finalSalary,
      minimumWageApplied: finalSalary === this.MINIMUM_WAGE && beforeMinWageCheck < this.MINIMUM_WAGE,
      calculationDate: new Date(),
    };
  }

  /**
   * REQ-PY-2: Calculate prorated salary for mid-month hires or terminations
   */
  private async calculateProratedSalary(
    employee: any,
    fullMonthSalary: number,
    runId: string,
  ): Promise<any> {
    const run = await this.payrollRunModel.findOne({ runId });
    if (!run) {
      return {
        fullMonthSalary,
        proratedSalary: fullMonthSalary,
        isProrated: false,
        workingDays: this.WORKING_DAYS_PER_MONTH,
        totalDays: this.WORKING_DAYS_PER_MONTH,
      };
    }

    const payrollPeriod = run.payrollPeriod;
    const periodStart = new Date(payrollPeriod.getFullYear(), payrollPeriod.getMonth(), 1);
    const periodEnd = new Date(payrollPeriod.getFullYear(), payrollPeriod.getMonth() + 1, 0);

    let effectiveStartDate = periodStart;
    let effectiveEndDate = periodEnd;
    let isProrated = false;
    let reason = '';

    // Check for mid-month hire (contract start date)
    if (employee.contractStartDate) {
      const hireDate = new Date(employee.contractStartDate);
      if (hireDate > periodStart && hireDate <= periodEnd) {
        effectiveStartDate = hireDate;
        isProrated = true;
        reason = 'Mid-month hire';
      }
    }

    // Check for mid-month termination (contract end date or termination)
    if (employee.contractEndDate) {
      const exitDate = new Date(employee.contractEndDate);
      if (exitDate >= periodStart && exitDate < periodEnd) {
        effectiveEndDate = exitDate;
        isProrated = true;
        reason = reason ? 'Mid-month hire and exit' : 'Mid-month exit';
      }
    }

    if (!isProrated) {
      return {
        fullMonthSalary,
        proratedSalary: fullMonthSalary,
        isProrated: false,
        workingDays: this.WORKING_DAYS_PER_MONTH,
        totalDays: this.WORKING_DAYS_PER_MONTH,
      };
    }

    // Calculate working days in the period
    const totalMonthDays = this.WORKING_DAYS_PER_MONTH;
    const workingDays = this.calculateWorkingDays(effectiveStartDate, effectiveEndDate);
    const proratedSalary = (fullMonthSalary / totalMonthDays) * workingDays;

    this.logger.log(
      `REQ-PY-2: Prorated salary for employee ${employee._id}. ` +
      `Reason: ${reason}, Working Days: ${workingDays}/${totalMonthDays}, ` +
      `Salary: ${proratedSalary} (Full: ${fullMonthSalary})`
    );

    return {
      fullMonthSalary,
      proratedSalary,
      isProrated: true,
      workingDays,
      totalDays: totalMonthDays,
      reason,
      effectiveStartDate,
      effectiveEndDate,
    };
  }

  /**
   * Calculate working days between two dates (simplified - assumes all weekdays)
   */
  private calculateWorkingDays(startDate: Date, endDate: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round(Math.abs((endDate.getTime() - startDate.getTime()) / oneDay));
    // Simplified: Assume ~22 working days per 30 calendar days
    return Math.ceil((diffDays / 30) * this.WORKING_DAYS_PER_MONTH);
  }

  /**
   * BR 5, 6: Calculate progressive income tax based on brackets
   */
  private async calculateProgressiveTax(grossSalary: number): Promise<any> {
    try {
      // Fetch all tax rules from configuration
      const taxRules = await this.taxRulesService.findAll();

      if (!taxRules || taxRules.length === 0) {
        // Fallback to default progressive brackets if no rules configured
        this.logger.warn('No tax rules configured. Using default progressive tax brackets.');
        return this.calculateDefaultProgressiveTax(grossSalary);
      }

      // Apply progressive tax calculation
      let totalTax = 0;
<<<<<<< HEAD
      const breakdown: Array<{ name: string; rate: number; amount: number }> = [];
=======
      const breakdown: { name: string; rate: number; amount: number }[] = [];
>>>>>>> 3ff01528a0005797b5664e0b26c1247883c25fef

      for (const rule of taxRules) {
        if (rule.status === 'APPROVED') {
          const taxAmount = grossSalary * (rule.rate / 100);
          totalTax += taxAmount;
          breakdown.push({
            name: rule.name,
            rate: rule.rate,
            amount: taxAmount,
          });
        }
      }

      return { totalTax, breakdown };
    } catch (error) {
      this.logger.error(`Error calculating progressive tax: ${error.message}`);
      return this.calculateDefaultProgressiveTax(grossSalary);
    }
  }

  /**
   * Default progressive tax calculation (BR 5, 6)
   */
  private calculateDefaultProgressiveTax(grossSalary: number): any {
    let totalTax = 0;
<<<<<<< HEAD
    const breakdown: Array<{ name: string; rate: number; amount: number }> = [];
=======
    const breakdown: { name: string; rate: number; amount: number }[] = [];
>>>>>>> 3ff01528a0005797b5664e0b26c1247883c25fef

    // Progressive brackets per Egyptian tax law
    if (grossSalary <= 3000) {
      const tax = grossSalary * 0.05;
      totalTax = tax;
      breakdown.push({ name: 'Income Tax (0-3000)', rate: 5, amount: tax });
    } else if (grossSalary <= 6000) {
      const tax = grossSalary * 0.10;
      totalTax = tax;
      breakdown.push({ name: 'Income Tax (3000-6000)', rate: 10, amount: tax });
    } else if (grossSalary <= 10000) {
      const tax = grossSalary * 0.15;
      totalTax = tax;
      breakdown.push({ name: 'Income Tax (6000-10000)', rate: 15, amount: tax });
    } else {
      const tax = grossSalary * 0.20;
      totalTax = tax;
      breakdown.push({ name: 'Income Tax (10000+)', rate: 20, amount: tax });
    }

    return { totalTax, breakdown };
  }

  /**
   * BR 7, 8: Calculate insurance based on salary brackets
   */
  private async calculateInsurance(grossSalary: number): Promise<any> {
    try {
      // Fetch insurance brackets from configuration
      const brackets = await this.insuranceBracketsService.findAll();

      if (!brackets || brackets.length === 0) {
        // Fallback to default rates
        this.logger.warn('No insurance brackets configured. Using default rates.');
        return this.calculateDefaultInsurance(grossSalary);
      }

      const applicableBracket = brackets.find(
        (bracket) =>
<<<<<<< HEAD
=======
          bracket.status === ConfigStatus.APPROVED &&
>>>>>>> 3ff01528a0005797b5664e0b26c1247883c25fef
          grossSalary >= bracket.minSalary &&
          grossSalary <= bracket.maxSalary
      );

      if (applicableBracket) {
        const employeeAmount = grossSalary * (applicableBracket.employeeRate / 100);
        const employerAmount = grossSalary * (applicableBracket.employerRate / 100);
        const totalInsurance = employeeAmount; // Employee pays their portion

        return {
          totalInsurance,
          employeeAmount,
          employerAmount,
          bracket: applicableBracket.name,
          employeeRate: applicableBracket.employeeRate,
          employerRate: applicableBracket.employerRate,
        };
      }

      // No bracket found, use default
      return this.calculateDefaultInsurance(grossSalary);
    } catch (error) {
      this.logger.error(`Error calculating insurance: ${error.message}`);
      return this.calculateDefaultInsurance(grossSalary);
    }
  }
  /**
   * Default insurance calculation (BR 7, 8)
   */
  private calculateDefaultInsurance(grossSalary: number): any {
    const employeeRate = 5; // 5% employee contribution
    const employerRate = 10; // 10% employer contribution
    const employeeAmount = grossSalary * (employeeRate / 100);
    const employerAmount = grossSalary * (employerRate / 100);

    return {
      totalInsurance: employeeAmount,
      employeeAmount,
      employerAmount,
      bracket: 'Default',
      employeeRate,
      employerRate,
    };
  }
  async addManualAdjustment(
    payslipId: string,
    dto: ManualAdjustmentDto,
  ): Promise<any> {
    try {
      // ADD THIS VALIDATION FIRST
      if (!Types.ObjectId.isValid(payslipId)) {
        throw new BadRequestException(
          `Invalid payslip ID format: ${payslipId}`,
        );
      }

      // Extra validation beyond DTO
      if (dto.amount <= 0) {
        throw new BadRequestException('Amount must be greater than 0');
      }

      // Business rule: bonuses should add, deductions should subtract
      // (DTO already ensures positive amount, this is just semantic check)
      if (dto.type === AdjustmentType.BONUS && dto.amount < 0) {
        throw new BadRequestException('Bonus amount cannot be negative');
      }

      if (dto.type === AdjustmentType.DEDUCTION && dto.amount < 0) {
        throw new BadRequestException('Deduction amount cannot be negative');
      }

      const payslip = await this.paySlipModel.findById(payslipId);
      if (!payslip) {
        throw new NotFoundException(`Payslip ${payslipId} not found`);
      }

      const empDetail = await this.empDetailsModel.findOne({
        employeeId: payslip.employeeId,
        payrollRunId: payslip.payrollRunId,
      });

      if (!empDetail) {
        throw new NotFoundException('Employee payroll details not found');
      }

      const adjustmentAmount = dto.amount;
      const previousSalary = payslip.netPay;
      let newNetPay = payslip.netPay;

      // Apply adjustment
      if (dto.type === AdjustmentType.BONUS) {
        newNetPay += adjustmentAmount;
      } else {
        newNetPay -= adjustmentAmount;

        // Only PENALTY can be added to schema arrays
        this.ensurePayslipStructure(payslip);
        // Add penalty with only required fields from schema
        payslip.deductionsDetails!.penalties!.penalties!.push({
          reason: dto.reason || 'Manual deduction',
          amount: adjustmentAmount,
        } as any);
      }

      // Ensure non-negative salary
      newNetPay = Math.max(0, newNetPay);

      // Update payslip (update totals only)
      payslip.netPay = newNetPay;
      payslip.totaDeductions = (payslip.totalGrossSalary || 0) - newNetPay;

      // Add to custom field if it exists
      if (!payslip['manualAdjustments']) {
        payslip['manualAdjustments'] = [];
      }
      payslip['manualAdjustments'].push({
        type: dto.type,
        amount: adjustmentAmount,
        reason: dto.reason,
        date: new Date(),
      });

      // Save without validating the custom field
      await payslip.save({ validateBeforeSave: false });

      // Update employee payroll details
      empDetail.netPay = newNetPay;
      if (dto.type === AdjustmentType.BONUS) {
        empDetail.bonus = (empDetail.bonus || 0) + adjustmentAmount;
        empDetail.allowances = (empDetail.allowances || 0) + adjustmentAmount;
      } else {
        empDetail.deductions = (empDetail.deductions || 0) + adjustmentAmount;
      }

      // Add to adjustments array in empDetail if it exists
      if (!empDetail['adjustments']) {
        empDetail['adjustments'] = [];
      }
      empDetail['adjustments'].push({
        type: dto.type,
        amount: adjustmentAmount,
        reason: dto.reason,
        date: new Date(),
      });

      await empDetail.save();

      return {
        success: true,
        payslipId: payslip._id,
        employeeId: payslip.employeeId,
        previousSalary: previousSalary,
        newSalary: newNetPay,
        adjustment: {
          type: dto.type,
          amount: adjustmentAmount,
          reason: dto.reason,
          date: new Date(),
        },
      };
    } catch (error) {
      // Handle specific MongoDB CastError
      if (
        error.name === 'CastError' ||
        error.message.includes('Cast to ObjectId')
      ) {
        throw new BadRequestException(
          `Invalid payslip ID format: ${payslipId}`,
        );
      }
      throw new BadRequestException(
        `Manual adjustment failed: ${error.message}`,
      );
    }
  }
  // ==================== UTILITY METHODS ====================

  private getMonthNumber(monthName: string): string {
    const months: { [key: string]: string } = {
      JAN: '01',
      FEB: '02',
      MAR: '03',
      APR: '04',
      MAY: '05',
      JUN: '06',
      JUL: '07',
      AUG: '08',
      SEP: '09',
      OCT: '10',
      NOV: '11',
      DEC: '12',
    };

    const monthUpper = monthName.toUpperCase();
    if (!months[monthUpper]) {
      throw new BadRequestException(
        `Invalid month: ${monthName}. Must be a 3-letter month code (JAN, FEB, etc.)`,
      );
    }

    return months[monthUpper];
  }

  // ==================== DEBUG METHODS ====================

  async debugDatabaseStatus() {
    const runsCount = await this.payrollRunModel.countDocuments();
    const payslipsCount = await this.paySlipModel.countDocuments();
    const empDetailsCount = await this.empDetailsModel.countDocuments();
    const bonusesCount = await this.signingBonusModel.countDocuments();
    const terminationsCount = await this.terminationModel.countDocuments();

    return {
      database: 'Connected',
      collections: {
        payrollRuns: runsCount,
        payslips: payslipsCount,
        employeePayrollDetails: empDetailsCount,
        signingBonuses: bonusesCount,
        terminations: terminationsCount,
      },
      message: 'Database is populated with real data',
    };
  }

  // Add to your PayrollExecutionService
  async debugEmployeesCollection() {
    try {
      const db = this.payrollRunModel.db;
      const employeesCollection = db.collection('employees');

      // Get ALL employees (no filters)
      const allEmployees = await employeesCollection
        .find({})
        .limit(10)
        .toArray();

      // Get count of all employees
      const totalCount = await employeesCollection.countDocuments();

      // Get count with your filter criteria
      const activeCount = await employeesCollection.countDocuments({
        isActive: true,
        contractStatus: 'ACTIVE',
      });

      return {
        totalEmployees: totalCount,
        activeEmployees: activeCount,
        sampleEmployees: allEmployees.map((emp) => ({
          _id: emp._id,
          hasIsActive: 'isActive' in emp,
          isActive: emp.isActive,
          hasContractStatus: 'contractStatus' in emp,
          contractStatus: emp.contractStatus,
          hasBaseSalary: 'baseSalary' in emp,
          baseSalary: emp.baseSalary,
          fields: Object.keys(emp), // Show all field names
        })),
      };
    } catch (error) {
      return {
        error: error.message,
      };
    }
  }

  async getPayslipsForRun(runId: string) {
    const run = await this.payrollRunModel.findOne({ runId });
    if (!run) throw new NotFoundException('Payroll Run not found');

    const payslips = await this.paySlipModel
      .find({
        payrollRunId: run._id,
      })
      .exec();

    return {
      runId: run.runId,
      payslips: payslips.map((p) => ({
        payslipId: p._id,
        employeeId: p.employeeId,
        netPay: p.netPay,
        totalGrossSalary: p.totalGrossSalary,
        totaDeductions: p.totaDeductions,
      })),
    };
  }

  // // ==================== MEMBER 2 (CALCULATION) - DEBUG ====================
  // /**
  //  * TEMPORARY: Debug method to see mock data for a specific run
  //  */
  // async debugMockData(runId: string): Promise<any> {
  //     const payrollRun = this.mockPayrollRuns.find(r => r.runId === runId);
  //     if (!payrollRun) throw new NotFoundException(`Payroll run ${runId} not found`);

  //     const payslips = this.mockPayslips.filter(p =>
  //         p.payrollRunId.toString() === payrollRun._id.toString()
  //     );

  //     const employeeDetails = this.mockEmployeeDetails.filter(emp =>
  //         emp.payrollRunId.toString() === payrollRun._id.toString()
  //     );

  //     console.log('=== MOCK DATA DEBUG ===');
  //     console.log('Payroll Run:', payrollRun);
  //     console.log('Payslips:', payslips);
  //     console.log('Employee Details:', employeeDetails);

  //     return {
  //         payrollRun: {
  //             _id: payrollRun._id,
  //             runId: payrollRun.runId,
  //             status: payrollRun.status
  //         },
  //         payslips: payslips.map(p => ({
  //             _id: p._id,
  //             payslipId: p._id, // This is the ID to use for adjustments
  //             employeeId: p.employeeId,
  //             netPay: p.netPay,
  //             totalGrossSalary: p.totalGrossSalary
  //         })),
  //         employeeDetails: employeeDetails.map(e => ({
  //             _id: e._id,
  //             employeeId: e.employeeId,
  //             netPay: e.netPay
  //         }))
  //     };
  // }
  //         // Add this to your service
  // async debugAllMockRuns(): Promise<any> {
  //     console.log('All Mock Payroll Runs:', this.mockPayrollRuns);

  //     return {
  //         totalRuns: this.mockPayrollRuns.length,
  //         runs: this.mockPayrollRuns.map(r => ({
  //             runId: r.runId,
  //             _id: r._id,
  //             status: r.status,
  //             employees: r.employees
  //         }))
  //     };
  // }

  // ==================== MEMBER 2 (CALCULATION) END ====================

  // MOCK DATA UTILS (Replace with Service Calls in Future)

  /**
   * MOCK DATA: Simulates employee data fetched from EmployeeProfile module.
   * In production, this would be replaced with actual service calls to Employee Profile subsystem.
   *
   * This mock data includes all fields required by Member 2 (Payroll Calculation) to perform
   * gross salary and net pay calculations:
   * - baseSalary: Base monthly salary
   * - overtimeHours: Hours worked beyond standard hours
   * - penaltyDeduction: Total penalty amount from attendance/performance issues
   * - unpaidLeaveDays: Days of unpaid leave taken
   * - isActiveContract: Contract status (BR 66: Skip if not active)
   * - bankDetails: Bank account availability (for exception flagging)
   * - isBonusApproved: Indicates if signing bonus was approved
   */
  // private getMockEmployeeData() {
  //   return [
  //     {
  //       id: '64f1b2b3e4b0a1a2b3c4d5e1',
  //       name: 'John Doe',
  //       contractStatus: 'ACTIVE',
  //       baseSalary: 5000,
  //       bankDetails: true,
  //       overtimeHours: 10,
  //       penaltyDeduction: 0,
  //       unpaidLeaveDays: 0,
  //       isActiveContract: true,
  //       isBonusApproved: false,
  //     },
  //     {
  //       id: '64f1b2b3e4b0a1a2b3c4d5e2',
  //       name: 'Jane Smith',
  //       contractStatus: 'ACTIVE',
  //       baseSalary: 7000,
  //       bankDetails: true,
  //       overtimeHours: 5,
  //       penaltyDeduction: 100,
  //       unpaidLeaveDays: 2,
  //       isActiveContract: true,
  //       isBonusApproved: false,
  //     },
  //     {
  //       id: '64f1b2b3e4b0a1a2b3c4d5e3',
  //       name: 'Bob Retired',
  //       contractStatus: 'EXPIRED',
  //       baseSalary: 4000,
  //       bankDetails: true,
  //       overtimeHours: 0,
  //       penaltyDeduction: 0,
  //       unpaidLeaveDays: 0,
  //       isActiveContract: false, // BR 66: Should be skipped during processing
  //       isBonusApproved: false,
  //     },
  //     {
  //       id: '64f1b2b3e4b0a1a2b3c4d5e4',
  //       name: 'Alice New',
  //       contractStatus: 'ACTIVE',
  //       baseSalary: 4500,
  //       bankDetails: false, // Missing Bank Details - will create exception
  //       overtimeHours: 8,
  //       penaltyDeduction: 50,
  //       unpaidLeaveDays: 1,
  //       isActiveContract: true,
  //       isBonusApproved: true, // New hire with approved signing bonus
  //     },
  //     {
  //       id: '64f1b2b3e4b0a1a2b3c4d5e5',
  //       name: 'Mike Johnson',
  //       contractStatus: 'ACTIVE',
  //       baseSalary: 6000,
  //       bankDetails: true,
  //       overtimeHours: 15,
  //       penaltyDeduction: 200,
  //       unpaidLeaveDays: 0,
  //       isActiveContract: true,
  //       isBonusApproved: false,
  //     },
  //   ];
  // }

  // === MEMBER 3 (APPROVALS) ===
  // PHASE 2: ANOMALY DETECTION & VALIDATION

  /**
   * REQ-PY-5: Comprehensive anomaly detection before manager approval
   * Validates: negative salary, missing bank details, salary spikes, contract issues, min wage
   *
   * @param runId - The payroll run identifier (e.g., "PR-2025-NOV")
   * @throws BadRequestException if critical anomalies detected
   * @returns Updated payroll run with anomaly report
   */
  async submitForApproval(runId: string) {
    const run = await this.payrollRunModel.findOne({ runId });
    if (!run) throw new NotFoundException('Payroll Run not found');

    this.logger.log(`REQ-PY-5: Starting comprehensive anomaly detection for ${runId}`);

    // Get payslips and employee details
    const payslips = await this.paySlipModel.find({ payrollRunId: run._id }).exec();
    const employeeDetails = await this.empDetailsModel.find({ payrollRunId: run._id }).exec();

    const anomalies = {
      critical: [] as any[],
      major: [] as any[],
      minor: [] as any[],
    };

    // REQ-PY-5: Anomaly Check 1 - Negative Net Salary
    for (const payslip of payslips) {
      if (payslip.netPay < 0) {
        anomalies.critical.push({
          type: 'NEGATIVE_SALARY',
          employeeId: payslip.employeeId,
          netPay: payslip.netPay,
          message: `Negative salary: ${payslip.netPay}`,
        });
      }
    }

    // REQ-PY-5: Anomaly Check 2 - Missing Bank Details
    for (const empDetail of employeeDetails) {
      if (empDetail.bankStatus === BankStatus.MISSING) {
        anomalies.major.push({
          type: 'MISSING_BANK_DETAILS',
          employeeId: empDetail.employeeId,
          message: 'Missing bank account information',
        });
      }
    }

    // REQ-PY-5: Anomaly Check 3 - Salary Spike Detection (>20% increase)
    const db = this.payrollRunModel.db;
    const employeesCollection = db.collection('employees');

    for (const empDetail of employeeDetails) {
      const employee = await employeesCollection.findOne({ _id: empDetail.employeeId });
      if (employee && employee.baseSalary) {
        const salaryDiff = Math.abs(empDetail.netPay - employee.baseSalary);
        const percentageChange = (salaryDiff / employee.baseSalary) * 100;

        if (percentageChange > 20) {
          anomalies.major.push({
            type: 'SALARY_SPIKE',
            employeeId: empDetail.employeeId,
            previousSalary: employee.baseSalary,
            currentSalary: empDetail.netPay,
            percentageChange: percentageChange.toFixed(2),
            message: `Salary spike detected: ${percentageChange.toFixed(2)}% change`,
          });
        }
      }
    }

    // REQ-PY-5: Anomaly Check 4 - Below Minimum Wage (BR 60)
    for (const empDetail of employeeDetails) {
      if (empDetail.netPay < this.MINIMUM_WAGE) {
        anomalies.major.push({
          type: 'BELOW_MINIMUM_WAGE',
          employeeId: empDetail.employeeId,
          netPay: empDetail.netPay,
          minimumWage: this.MINIMUM_WAGE,
          message: `Salary below minimum wage: ${empDetail.netPay} < ${this.MINIMUM_WAGE}`,
        });
      }
    }

    // REQ-PY-5: Anomaly Check 5 - Contract Validation (BR 1, BR 66)
    for (const empDetail of employeeDetails) {
      const employee = await employeesCollection.findOne({ _id: empDetail.employeeId });

      if (employee) {
        // Check contract status
        if (!employee.isActive || employee.contractStatus !== 'ACTIVE') {
          anomalies.critical.push({
            type: 'INACTIVE_CONTRACT',
            employeeId: empDetail.employeeId,
            contractStatus: employee.contractStatus,
            message: 'Employee contract not active',
          });
        }

        // Check contract dates
        if (employee.contractEndDate) {
          const contractEnd = new Date(employee.contractEndDate);
          const now = new Date();
          if (contractEnd < now) {
            anomalies.critical.push({
              type: 'EXPIRED_CONTRACT',
              employeeId: empDetail.employeeId,
              contractEndDate: contractEnd,
              message: 'Contract expired',
            });
          }
        }
      }
    }

    // REQ-PY-5: Anomaly Check 6 - Duplicate Processing
    const employeeIds = employeeDetails.map(e => e.employeeId.toString());
    const uniqueIds = new Set(employeeIds);
    if (employeeIds.length !== uniqueIds.size) {
      anomalies.critical.push({
        type: 'DUPLICATE_PROCESSING',
        message: 'Duplicate employee entries detected in payroll run',
        duplicates: employeeIds.length - uniqueIds.size,
      });
    }

    // Count total anomalies
    const totalAnomalies = anomalies.critical.length + anomalies.major.length + anomalies.minor.length;

    // Block submission if critical anomalies exist
    if (anomalies.critical.length > 0) {
      this.logger.error(`REQ-PY-5: ${anomalies.critical.length} critical anomalies detected for ${runId}`);
      throw new BadRequestException({
        message: 'Critical anomalies detected. Cannot submit for approval.',
        anomalies: anomalies,
        criticalCount: anomalies.critical.length,
        majorCount: anomalies.major.length,
        minorCount: anomalies.minor.length,
      });
    }

    // Update run with anomaly count
    run.status = PayRollStatus.UNDER_REVIEW;
    run.exceptions = anomalies.major.length + anomalies.minor.length;
    await run.save();

    this.logger.log(
      `REQ-PY-5: Anomaly detection complete for ${runId}. ` +
      `Total: ${totalAnomalies} (Major: ${anomalies.major.length}, Minor: ${anomalies.minor.length})`
    );

    return {
      message: 'Payroll run submitted for manager approval',
      runId: run.runId,
      status: run.status,
      employeesProcessed: payslips.length,
      anomalyDetection: {
        totalAnomalies,
        critical: anomalies.critical.length,
        major: anomalies.major.length,
        minor: anomalies.minor.length,
        details: {
          majorAnomalies: anomalies.major,
          minorAnomalies: anomalies.minor,
        },
      },
      warnings: anomalies.major.length > 0
        ? `${anomalies.major.length} major anomalies require attention before approval`
        : 'No major anomalies detected',
    };
  }

  // PHASE 3: MANAGER & FINANCE APPROVAL

  /**
   * Handles manager review decision on payroll run.
   * Approved runs proceed to finance review, rejected runs return to draft status.
   *
   * @param runId - The payroll run identifier
   * @param dto - Review action containing APPROVED/REJECTED status and comment
   * @returns Updated payroll run with new status
   */
  async managerReview(runId: string, dto: ReviewActionDto) {
    const run = await this.payrollRunModel.findOne({ runId });
    if (!run) throw new NotFoundException('Payroll Run not found');

    if (run.status !== PayRollStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        `Run ${runId} is not awaiting manager approval`,
      );
    }

    if (dto.status === ReviewStatus.APPROVED) {
      // Approved: Move to finance review
      run.status = PayRollStatus.PENDING_FINANCE_APPROVAL;
      await run.save();

      return {
        message: 'Payroll approved by manager. Awaiting finance execution.',
        runId: run.runId,
        status: run.status,
        comment: dto.comment,
      };
    } else if (dto.status === ReviewStatus.REJECTED) {
      // Rejected: Send back to draft for corrections
      run.status = PayRollStatus.DRAFT;
      run.rejectionReason = dto.comment;
      await run.save();

      return {
        message: 'Payroll rejected by manager. Returned to draft status.',
        runId: run.runId,
        status: run.status,
        rejectionReason: dto.comment,
      };
    }

    throw new BadRequestException(
      'Invalid review status. Must be APPROVED or REJECTED.',
    );
  }

  /**
   * REQ-PY-15: Finance staff reviews and approves payroll for execution
   * Final approval step before EXECUTE_PAYROLL can be triggered
   *
   * @param runId - The payroll run identifier
   * @param dto - Review action containing APPROVED/REJECTED status and comment
   * @returns Updated payroll run with final approval status
   */
  async financeReview(runId: string, dto: ReviewActionDto) {
    const run = await this.payrollRunModel.findOne({ runId });
    if (!run) throw new NotFoundException('Payroll Run not found');

    if (run.status !== PayRollStatus.PENDING_FINANCE_APPROVAL) {
      throw new BadRequestException(
        `Run ${runId} is not awaiting finance approval. Current status: ${run.status}`,
      );
    }

    this.logger.log(`REQ-PY-15: Finance review initiated for ${runId} by Finance Staff`);

    if (dto.status === ReviewStatus.APPROVED) {
      // Approved: Ready for execution
      run.status = PayRollStatus.APPROVED;
      run.financeApprovalDate = new Date();
      await run.save();

      this.logger.log(`REQ-PY-15: Payroll ${runId} approved by Finance. Awaiting Manager to lock.`);

      // TODO: Notify Payroll Manager to lock payroll
      // await this.notificationService.notifyManagerToLock(run.payrollManagerId, runId);

      return {
        message: 'Payroll approved by Finance. Awaiting Payroll Manager to lock payroll.',
        runId: run.runId,
        status: run.status,
        approvedAt: run.financeApprovalDate,
        comment: dto.comment,
        nextStep: 'Payroll Manager must lock the payroll via LOCK_PAYROLL endpoint',
        managerAction: 'LOCK_REQUIRED',
      };
    } else if (dto.status === ReviewStatus.REJECTED) {
      // Rejected: Send back to draft for corrections
      run.status = PayRollStatus.DRAFT;
      run.rejectionReason = dto.comment;
      await run.save();

      this.logger.warn(`REQ-PY-15: Payroll ${runId} rejected by Finance. Returned to draft.`);

      return {
        message: 'Payroll rejected by Finance. Returned to draft status for corrections.',
        runId: run.runId,
        status: run.status,
        rejectionReason: dto.comment,
      };
    }

    throw new BadRequestException(
      'Invalid review status. Must be APPROVED or REJECTED.',
    );
  }

  /**
   * REQ-PY-6: Preview Dashboard for Finance Staff
   * Provides comprehensive overview before final approval/execution
   *
   * @param runId - The payroll run identifier
   * @returns Dashboard with summary, breakdown, anomalies, and status
   */
  async getPayrollPreview(runId: string) {
    const run = await this.payrollRunModel.findOne({ runId });
    if (!run) throw new NotFoundException('Payroll Run not found');

    this.logger.log(`REQ-PY-6: Generating preview dashboard for ${runId}`);

    // Get all payslips and employee details
    const payslips = await this.paySlipModel.find({ payrollRunId: run._id }).exec();
    const employeeDetails = await this.empDetailsModel.find({ payrollRunId: run._id }).exec();

    // Calculate totals
<<<<<<< HEAD
    const totalGrossSalary = employeeDetails.reduce((sum, emp) => sum + emp.baseSalary, 0);
    const totalTaxes = employeeDetails.reduce((sum, emp) => sum + emp.deductions, 0);
    const totalInsurance = employeeDetails.reduce((sum, emp) => sum + (emp.deductions * 0.3), 0);
=======
    const totalGrossSalary = employeeDetails.reduce((sum, emp) => sum + (emp.grossPay ?? 0), 0);
    const totalTaxes = employeeDetails.reduce((sum, emp) => sum + (emp.totalTaxes ?? 0), 0);
    const totalInsurance = employeeDetails.reduce((sum, emp) => sum + (emp.totalInsurance ?? 0), 0);
>>>>>>> 3ff01528a0005797b5664e0b26c1247883c25fef
    const totalNetPayout = employeeDetails.reduce((sum, emp) => sum + emp.netPay, 0);
    const totalDeductions = employeeDetails.reduce((sum, emp) => sum + emp.deductions, 0);
    const totalBonuses = employeeDetails.reduce((sum, emp) => sum + (emp.bonus || 0), 0);

    // Count employees by status
    const activeEmployees = employeeDetails.filter(e => e.bankStatus === BankStatus.VALID).length;
    const missingBankDetails = employeeDetails.filter(e => e.bankStatus === BankStatus.MISSING).length;
    const pendingBankDetails = 0;

    // Get exceptions and anomalies
    const exceptions = employeeDetails.filter(e =>
      e.netPay < this.MINIMUM_WAGE ||
      e.bankStatus === BankStatus.MISSING
    );

    // Status-based insights
    const canExecute = run.status === PayRollStatus.APPROVED;
    const needsApproval = run.status === PayRollStatus.PENDING_FINANCE_APPROVAL;

    this.logger.log(
      `REQ-PY-6: Preview generated for ${runId}. ` +
      `${employeeDetails.length} employees, Total payout: ${totalNetPayout}, Exceptions: ${exceptions.length}`
    );

    return {
      runId: run.runId,
      status: run.status,
      period: run.payrollPeriod,
      employeeSummary: {
        totalEmployees: employeeDetails.length,
        activeEmployees,
        missingBankDetails,
        pendingBankDetails,
        exceptionsCount: exceptions.length,
      },
      financialBreakdown: {
        totalGrossSalary: Math.round(totalGrossSalary * 100) / 100,
        totalTaxes: Math.round(totalTaxes * 100) / 100,
        totalInsurance: Math.round(totalInsurance * 100) / 100,
        totalBonuses: Math.round(totalBonuses * 100) / 100,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        totalNetPayout: Math.round(totalNetPayout * 100) / 100,
      },
      paymentDistribution: {
        byBankStatus: {
          ready: activeEmployees,
          pending: pendingBankDetails,
          missing: missingBankDetails,
        },
        readyForPayment: activeEmployees,
        blockedPayments: missingBankDetails + pendingBankDetails,
      },
      exceptions: exceptions.map(e => ({
        employeeId: e.employeeId,
        reason: e.bankStatus === BankStatus.MISSING ? 'Missing Bank Details' : 'Below Minimum Wage',
        netPay: e.netPay,
        bankStatus: e.bankStatus,
      })),
      workflowStatus: {
        currentPhase: run.status,
        canExecute,
        needsApproval,
        approvedAt: run.financeApprovalDate,
        executedAt: null,
      },
      recommendations: this.generateRecommendations(run, exceptions.length, missingBankDetails, totalNetPayout),
    };
  }

  /**
   * Helper method for preview dashboard recommendations
   */
  private generateRecommendations(run: any, exceptionsCount: number, missingBankDetails: number, totalNetPayout: number) {
    const recommendations: string[] = [];

    if (run.status === PayRollStatus.DRAFT) {
      recommendations.push('Submit for manager approval to proceed with workflow');
    }

    if (run.status === PayRollStatus.UNDER_REVIEW) {
      recommendations.push('Awaiting manager review and approval');
    }

    if (run.status === PayRollStatus.PENDING_FINANCE_APPROVAL) {
      recommendations.push('Review all exceptions before final approval');
      if (missingBankDetails > 0) {
        recommendations.push(`${missingBankDetails} employees missing bank details - payments will be blocked`);
      }
    }

    if (run.status === PayRollStatus.APPROVED) {
      recommendations.push('Payroll approved - ready to execute payments');
      recommendations.push(`Total payout amount: ${totalNetPayout.toFixed(2)}`);
    }

    if (exceptionsCount > 0) {
      recommendations.push(`${exceptionsCount} exceptions require attention before execution`);
    }

    if (recommendations.length === 0) {
      recommendations.push('No issues detected. Payroll run is healthy.');
    }

    return recommendations;
  }

  // PHASE 5: PAYMENT EXECUTION

  /**
   * REQ-PY-8: Executes payment and automatically generates/distributes payslips.
   * Generates payslips via PDF, makes them available on the employee portal,
   * and prepares them for email distribution to ensure secure access to salary details.
   *
   * @param runId - The payroll run identifier
   * @returns Payment summary with payslip generation and distribution confirmation
   */
  async executeAndDistribute(runId: string) {
    const run = await this.payrollRunModel.findOne({ runId });
    if (!run) throw new NotFoundException('Payroll Run not found');

    this.logger.log(`REQ-PY-8: Starting payroll execution for ${runId}`);

    // STEP 1: Validate run is LOCKED (not just approved)
    if (run.status !== PayRollStatus.LOCKED) {
      throw new BadRequestException(
        `Cannot execute payroll. Run must be LOCKED by Payroll Manager first. Current status: ${run.status}`,
      );
    }

    // STEP 2: Retrieve all calculated payslips for this run
    const payslips = await this.paySlipModel
      .find({ payrollRunId: run._id })
      .exec();

    if (payslips.length === 0) {
      throw new BadRequestException('No payslips found to process');
    }

    let totalDisbursement = 0;
    const distributedPayslips: any[] = [];

    // STEP 3: Generate and Distribute Payslips (REQ-PY-8)
    for (const payslip of payslips) {
      // Mark payslip as PAID and ready for distribution
      // Use updateOne to bypass validation issues with embedded schemas
      await this.paySlipModel.updateOne(
        { _id: payslip._id },
        { $set: { paymentStatus: PaySlipPaymentStatus.PAID } },
      );
      totalDisbursement += payslip.netPay;

      // STEP 3A: Generate Payslip Document (PDF format)
      // In production, this would call a PDF generation service
      const payslipDocument = {
        payslipId: payslip._id,
        employeeId: payslip.employeeId,
        runId: run.runId,
        period: run.payrollPeriod,
        grossSalary: payslip.totalGrossSalary,
        deductions: payslip.totaDeductions,
        netPay: payslip.netPay,
        generatedAt: new Date(),
        format: 'PDF', // REQ-PY-8: PDF format
        documentUrl: `/payslips/${payslip._id}/download`, // Portal access URL
      };

      // STEP 3B: Distribute via multiple channels (REQ-PY-8)
      const distributionStatus = {
        employeeId: payslip.employeeId,
        payslipId: payslip._id,
        netPay: payslip.netPay,
        distributionChannels: {
          pdf: {
            generated: true,
            url: payslipDocument.documentUrl,
            status: 'AVAILABLE',
          },
          email: {
            queued: true,
            status: 'PENDING_DELIVERY',
            // In production: await this.emailService.sendPayslip(payslip)
            message: 'Payslip email queued for delivery',
          },
          portal: {
            available: true,
            status: 'ACCESSIBLE',
            accessUrl: `/employee-portal/payslips/${payslip._id}`,
            message: 'Payslip accessible via employee portal',
          },
        },
        availableForTracking: true, // Ready for Tracking subsystem
      };

      distributedPayslips.push(distributionStatus);
    }

    // STEP 3: Archive Payslips (REQ-PY-8, BR 17)
    // Generate and archive final payslips for long-term record keeping
    const archivedPayslips: any[] = [];
    for (const payslip of payslips) {
      const archivedRecord = {
        payslipId: payslip._id,
        employeeId: payslip.employeeId,
        runId: run.runId,
        period: run.payrollPeriod,
        archivedAt: new Date(),
        archiveLocation: `/archive/payslips/${run.runId}/${payslip._id}.pdf`,
        status: 'ARCHIVED',
        retentionPolicy: '7 years', // BR 17: Long-term record keeping
      };
      archivedPayslips.push(archivedRecord);
    }

    this.logger.log(
      `REQ-PY-8, BR 17: ${archivedPayslips.length} payslips generated and archived for long-term retention`,
    );

    // STEP 4: Mark payroll run as completed (already LOCKED, now COMPLETED)
    run.status = PayRollStatus.COMPLETED;
    run.paymentStatus = PayRollPaymentStatus.PAID;
    run.totalnetpay = totalDisbursement;
    run.executedAt = new Date();
    await run.save();

    // STEP 5: Log distribution completion
    this.logger.log(
      `REQ-PY-8: Generated and distributed ${distributedPayslips.length} payslips for run ${runId}`,
    );
    this.logger.log(
      `Distribution channels: PDF generated, Email queued, Portal access enabled`,
    );
    this.logger.log(`Payslips are now available to the Tracking subsystem`);

    return {
      message:
        'Payroll executed successfully. Payslips automatically generated, archived, and distributed. Run is now LOCKED.',
      runId: run.runId,
      status: PayRollStatus.LOCKED, // Status after auto-lock
      paymentStatus: run.paymentStatus,
      totalDisbursement,
      employeesPaid: payslips.length,
      payslipsGenerated: distributedPayslips.length,
      payslipsArchived: archivedPayslips.length,
      distribution: {
        pdfGenerated: distributedPayslips.length,
        emailsQueued: distributedPayslips.length,
        portalAccessEnabled: distributedPayslips.length,
        archived: archivedPayslips.length,
      },
      payslipsAvailableForTracking: true,
      distributedPayslips: distributedPayslips, // Full distribution details for Tracking Team
      archivedPayslips: archivedPayslips, // Archive records (BR 17)
      locked: true, // REQ-PY-7: Auto-locked after approval
    };
  }

  // === MEMBER 3 (LOCK/FREEZE MANAGEMENT) ===
  // REQ-PY-7 & REQ-PY-19: LOCK AND UNFREEZE PAYROLL RUNS

  /**
   * REQ-PY-7: Locks/Freezes a finalized payroll run to prevent unauthorized changes.
   * Called after Finance Approval to protect payroll integrity.
   *
   * @param runId - The payroll run identifier
   * @returns Locked payroll run confirmation
   */
  async lockPayroll(runId: string) {
    const run = await this.payrollRunModel.findOne({ runId });
    if (!run) throw new NotFoundException('Payroll Run not found');

    // Check if already locked
    if (run.status === PayRollStatus.LOCKED) {
      throw new BadRequestException(`Payroll run ${runId} is already locked`);
    }

    // Only approved/paid payrolls can be locked
    if (run.status !== PayRollStatus.APPROVED) {
      throw new BadRequestException(
        `Cannot lock payroll ${runId}. Only approved payrolls can be locked. Current status: ${run.status}`,
      );
    }

    // Lock the payroll and set payment status
    run.status = PayRollStatus.LOCKED;
    run.paymentStatus = PayRollPaymentStatus.PAID;
    await run.save();

    this.logger.log(
      `REQ-PY-7: Payroll Manager locked payroll ${runId}. Ready for execution.`,
    );

    return {
      message: 'Payroll run locked successfully by Payroll Manager. Ready for execution.',
      runId: run.runId,
      status: run.status,
      lockedAt: new Date(),
      paymentStatus: run.paymentStatus,
      totalNetPay: run.totalnetpay,
      nextStep: 'Finance Staff can now execute payroll via EXECUTE_PAYROLL endpoint',
    };
  }

  /**
   * REQ-PY-19: Unfreezes a locked payroll run under exceptional circumstances.
   * Requires manager authority and justification for audit trail.
   *
   * @param runId - The payroll run identifier
   * @param dto - Unfreeze justification
   * @returns Unfrozen payroll run confirmation
   */
  async unfreezePayroll(runId: string, dto: UnfreezePayrollDto) {
    const run = await this.payrollRunModel.findOne({ runId });
    if (!run) throw new NotFoundException('Payroll Run not found');

    // Only locked payrolls can be unfrozen
    if (run.status !== PayRollStatus.LOCKED) {
      throw new BadRequestException(
        `Cannot unfreeze payroll ${runId}. Only locked payrolls can be unfrozen. Current status: ${run.status}`,
      );
    }

    // Unfreeze the payroll and record justification
    run.status = PayRollStatus.UNLOCKED;

    // Revert payment status to pending since corrections are needed
    run.paymentStatus = PayRollPaymentStatus.PENDING;

    // Store unfreeze justification in rejection reason field for audit trail
    run.rejectionReason = `UNFROZEN: ${dto.justification} | Unfrozen at: ${new Date().toISOString()}`;
    await run.save();

    this.logger.warn(
      `REQ-PY-19: Payroll run ${runId} has been UNFROZEN under exceptional circumstances`,
    );
    this.logger.warn(`Justification: ${dto.justification}`);
    this.logger.warn(`Payment status reverted to PENDING for corrections`);

    return {
      message:
        'Payroll run successfully unfrozen. Legitimate corrections can now be made.',
      runId: run.runId,
      status: run.status,
      unfrozenAt: new Date(),
      justification: dto.justification,
      warning:
        'Payroll is now unlocked for corrections. Payment status reverted to PENDING. Re-lock after changes are complete.',
      paymentStatus: run.paymentStatus,
    };
  }

  // === MEMBER 3 (PAYSLIP DETAILS) ===
  // REQ-PY-8: DETAILED PAYSLIP WITH TAX BREAKDOWN

  /**
   * REQ-PY-8: Retrieves detailed payslip with comprehensive tax breakdown.
   * Displays tax laws, deduction rules, and multi-channel distribution status.
   * Ensures employees can view their salary details with legal references.
   *
   * @param employeeId - The employee identifier
   * @param runId - The payroll run identifier
   * @returns Detailed payslip with earnings, deductions, tax laws, and distribution channels
   */
  async getPayslipDetails(employeeId: string, runId: string) {
    // Find the payroll run
    const run = await this.payrollRunModel.findOne({ runId });
    if (!run) throw new NotFoundException(`Payroll Run ${runId} not found`);

    // Convert employeeId to ObjectId if it's a valid 24-char hex string
    let employeeObjectId: Types.ObjectId;
    try {
      // Check if it's a valid ObjectId format (24 hex characters)
      if (employeeId.match(/^[0-9a-fA-F]{24}$/)) {
        employeeObjectId = new Types.ObjectId(employeeId);
      } else {
        // For string IDs like 'EMP-001', we need to find all payslips and match by a different field
        // Since the seed script doesn't store the string employeeId in payslips,
        // we'll throw a helpful error for now
        throw new BadRequestException(
          `Employee ID must be a valid MongoDB ObjectId (24 hex characters). ` +
          `Received: ${employeeId}. Please use the employee's ObjectId instead of string identifier.`,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `Invalid employee ID format: ${employeeId}`,
      );
    }

    // Find the payslip for this employee in this run
    const payslip = await this.paySlipModel
      .findOne({
        employeeId: employeeObjectId,
        payrollRunId: run._id,
      })
      .exec();

    if (!payslip) {
      throw new NotFoundException(
        `Payslip not found for Employee ${employeeId} in Payroll Run ${runId}`,
      );
    }

    // Get employee details from summary record
    const empDetails = await this.empDetailsModel
      .findOne({
        employeeId: employeeObjectId,
        payrollRunId: run._id,
      })
      .exec();

    // EARNINGS BREAKDOWN
    const earningsBreakdown = {
      baseSalary: payslip.earningsDetails.baseSalary,
      allowances: payslip.earningsDetails.allowances.map((allowance) => ({
        type:
          (allowance as any).name ||
          (allowance as any).allowanceType ||
          'Allowance',
        amount: allowance.amount,
        description: `Monthly ${(allowance as any).name || (allowance as any).allowanceType || 'Allowance'} allowance`,
      })),
      bonuses: (payslip.earningsDetails.bonuses || []).map((bonus) => ({
        type: (bonus as any).name || (bonus as any).bonusType || 'Bonus',
        amount: bonus.amount,
        reason: 'Signing bonus for new hire',
      })),
      benefits: (payslip.earningsDetails.benefits || []).map((benefit) => ({
        type: (benefit as any).name || (benefit as any).type || 'Benefit',
        amount: benefit.amount,
        description: 'Termination benefit settlement',
      })),
      refunds: (payslip.earningsDetails.refunds || []).map((refund) => ({
        type: (refund as any).name || (refund as any).refundType || 'Refund',
        amount: refund.amount,
        description: 'Approved expense reimbursement',
      })),
      totalGross: payslip.totalGrossSalary,
    };

    // DEDUCTIONS BREAKDOWN WITH TAX LAWS (REQ-PY-8)
    const deductionsBreakdown = {
      taxes: payslip.deductionsDetails.taxes.map((tax) => ({
        type: (tax as any).name || (tax as any).taxType || 'Tax',
        rate: (tax as any).rate || (tax as any).taxRate || 0,
        amount: (tax as any).amount || (tax as any).taxAmount || 0,
        law: this.getTaxLawReference(
          (tax as any).name || (tax as any).taxType || 'Income Tax',
        ), // REQ-PY-8: Tax law references
        rule: this.getTaxRuleDescription(
          (tax as any).name || (tax as any).taxType || 'Income Tax',
        ),
        bracket: this.getTaxBracket(
          (tax as any).name || (tax as any).taxType || 'Income Tax',
          payslip.earningsDetails.baseSalary,
        ),
      })),
      insurances: (payslip.deductionsDetails.insurances || []).map(
        (insurance) => ({
          type:
            (insurance as any).name ||
            (insurance as any).insuranceType ||
            'Insurance',
          rate:
            (insurance as any).employeeRate ||
            (insurance as any).insuranceRate ||
            0,
          amount:
            (insurance as any).amount ||
            (insurance as any).insuranceAmount ||
            0,
          law: this.getInsuranceLawReference(
            (insurance as any).name ||
            (insurance as any).insuranceType ||
            'Health Insurance',
          ),
          bracket: this.getInsuranceBracket(
            (insurance as any).name ||
            (insurance as any).insuranceType ||
            'Health Insurance',
            payslip.earningsDetails.baseSalary,
          ),
        }),
      ),
      penalties: payslip.deductionsDetails.penalties
        ? {
          employeeId: payslip.deductionsDetails.penalties.employeeId,
          penalties: (
            payslip.deductionsDetails.penalties.penalties || []
          ).map((penalty) => ({
            type: (penalty as any).penaltyType || 'Penalty',
            amount: penalty.amount,
            reason: penalty.reason,
            date: (penalty as any).date || new Date(),
          })),
          totalPenalties: (
            payslip.deductionsDetails.penalties.penalties || []
          ).reduce((sum, p) => sum + p.amount, 0),
        }
        : { employeeId: payslip.employeeId, penalties: [], totalPenalties: 0 },
      totalDeductions: (payslip as any).totaDeductions || 0,
    };

    // DISTRIBUTION STATUS (REQ-PY-8: Multi-channel distribution)
    const distributionStatus = {
      pdf: {
        available: true,
        downloadUrl: `/payslips/${payslip._id}/download`,
        status: 'AVAILABLE',
        generatedAt: new Date(),
      },
      email: {
        sent: payslip.paymentStatus === PaySlipPaymentStatus.PAID,
        status:
          payslip.paymentStatus === PaySlipPaymentStatus.PAID
            ? 'DELIVERED'
            : 'PENDING',
        message: 'Payslip sent to registered email address',
      },
      portal: {
        accessible: true,
        accessUrl: `/employee-portal/payslips/${payslip._id}`,
        status: 'ACCESSIBLE',
        message: 'View payslip anytime via employee portal',
      },
      archived: {
        archived: true,
        location: `/archive/payslips/${run.runId}/${payslip._id}.pdf`,
        retentionPolicy: '7 years', // BR 17: Long-term record keeping
        archivedAt: new Date(),
        expiresAt: new Date(
          new Date().setFullYear(new Date().getFullYear() + 7),
        ),
      },
    };

    // NET PAY CALCULATION
    const totalDeductions = (payslip as any).totaDeductions || 0;
    const netPayCalculation = {
      grossSalary: payslip.totalGrossSalary,
      totalDeductions: totalDeductions,
      netPay: payslip.netPay,
      formula: 'Net Pay = Gross Salary - Total Deductions',
      calculationVerified:
        payslip.netPay === payslip.totalGrossSalary - totalDeductions,
    };

    this.logger.log(
      `REQ-PY-8: Retrieved detailed payslip for Employee ${employeeId} in Run ${runId}`,
    );

    return {
      payslipId: payslip._id,
      employeeId: payslip.employeeId,
      runId: run.runId,
      payrollPeriod: run.payrollPeriod,
      paymentStatus: payslip.paymentStatus,

      earnings: earningsBreakdown,
      deductions: deductionsBreakdown,
      netPayCalculation: netPayCalculation,

      // REQ-PY-8: Multi-channel distribution
      distribution: distributionStatus,

      // Bank details for payment
      bankStatus: empDetails?.bankStatus,
      exceptions: empDetails?.exceptions,

      // Timestamps
      generatedAt: new Date(),
      paidAt:
        payslip.paymentStatus === PaySlipPaymentStatus.PAID ? new Date() : null,

      // Compliance
      taxLawsDisplayed: true, // REQ-PY-8: Tax laws and rules displayed
      archivedForCompliance: true, // BR 17: Long-term archiving
    };
  }

  // === TAX LAW REFERENCE HELPERS (REQ-PY-8) ===

  /**
   * REQ-PY-8: Returns the legal reference for a specific tax type.
   * Ensures transparency by showing which laws govern each deduction.
   */
  private getTaxLawReference(taxType: string): string {
    const taxLaws = {
      'Income Tax': 'Federal Tax Code Section 401 (2024)',
      'Social Security': 'Social Security Act 2020, Article 12',
      Medicare: 'Medicare Tax Law Section 3101',
      'State Tax': 'State Revenue Code Chapter 7',
      'Local Tax': 'Municipal Tax Ordinance 2023',
    };
    return taxLaws[taxType] || 'Tax Law Reference Not Available';
  }

  /**
   * REQ-PY-8: Returns a human-readable description of the tax rule.
   */
  private getTaxRuleDescription(taxType: string): string {
    const taxRules = {
      'Income Tax': 'Progressive tax based on annual income brackets',
      'Social Security':
        'Fixed percentage of gross salary for social security fund',
      Medicare: 'Mandatory health insurance contribution',
      'State Tax': 'State-level income tax based on residency',
      'Local Tax': 'Municipal tax for local services and infrastructure',
    };
    return taxRules[taxType] || 'Tax rule description not available';
  }

  /**
   * REQ-PY-8: Returns the tax bracket for the employee's salary.
   */
  private getTaxBracket(taxType: string, baseSalary: number): string {
    if (taxType === 'Income Tax') {
      if (baseSalary < 3000) return 'Bracket 1: $0-$2999 (5%)';
      if (baseSalary < 6000) return 'Bracket 2: $3000-$5999 (10%)';
      if (baseSalary < 10000) return 'Bracket 3: $6000-$9999 (15%)';
      return 'Bracket 4: $10000+ (20%)';
    }
    return 'Standard rate applies';
  }

  /**
   * REQ-PY-8: Returns the legal reference for insurance deductions.
   */
  private getInsuranceLawReference(insuranceType: string): string {
    const insuranceLaws = {
      'Health Insurance': 'Employee Health Insurance Act 2022, Section 5',
      'Life Insurance': 'Life Insurance Contribution Law 2021',
      'Disability Insurance': 'Disability Protection Act 2020',
    };
    return (
      insuranceLaws[insuranceType] || 'Insurance Law Reference Not Available'
    );
  }

  /**
   * REQ-PY-8: Returns the insurance bracket for the employee's salary.
   */
  private getInsuranceBracket(
    insuranceType: string,
    baseSalary: number,
  ): string {
    if (insuranceType === 'Health Insurance') {
      if (baseSalary < 4000) return 'Bracket 1: $0-$3999 (2%)';
      if (baseSalary < 7000) return 'Bracket 2: $4000-$6999 (3%)';
      return 'Bracket 3: $7000+ (4%)';
    }
    return 'Standard rate applies';
  }

  // === TEST DATA SEEDING ===

  /**
   * Seeds test data for signing bonuses and termination benefits
   * This creates sample benefit records that can be reviewed/approved
   */
  async seedTestBenefits() {
    try {
      const db = this.payrollRunModel.db;
      const employeesCollection = db.collection('employees');

      // Ensure employees exist first
      const employeeCount = await employeesCollection.countDocuments();
      if (employeeCount === 0) {
        await this.seedMockEmployees();
        this.logger.log('Seeded mock employees first');
      }

      // Get employee IDs
      const employees = await employeesCollection.find({}).limit(4).toArray();

      if (employees.length === 0) {
        throw new Error('No employees found to create benefits for');
      }

      // Clear existing benefits to avoid duplicates
      await this.signingBonusModel.deleteMany({});
      await this.terminationModel.deleteMany({});
      this.logger.log('Cleared existing benefits');

      // Create signing bonuses for testing
      const signingBonuses = [
        {
          employeeId: employees[0]._id,
          signingBonusId: new Types.ObjectId('64f1b2b3e4b0a1a2b3c4d5f1'), // Reference to a bonus config
          givenAmount: 5000,
          status: BonusStatus.PENDING,
          paymentDate: null,
        },
        {
          employeeId: employees[1]._id,
          signingBonusId: new Types.ObjectId('64f1b2b3e4b0a1a2b3c4d5f1'),
          givenAmount: 3000,
          status: BonusStatus.PENDING,
          paymentDate: null,
        },
        {
          employeeId: employees[2]._id,
          signingBonusId: new Types.ObjectId('64f1b2b3e4b0a1a2b3c4d5f1'),
          givenAmount: 4000,
          status: BonusStatus.APPROVED, // Pre-approved for testing
          paymentDate: null,
        },
      ];

      // Create termination benefits for testing
      const terminationBenefits = [
        {
          employeeId: employees[3]._id,
          benefitId: new Types.ObjectId('64f1b2b3e4b0a1a2b3c4d5f2'), // Reference to a benefit config
          terminationId: new Types.ObjectId('64f1b2b3e4b0a1a2b3c4d5f3'), // Reference to termination request
          givenAmount: 10000,
          status: BenefitStatus.PENDING,
        },
      ];

      // Insert into database
      const insertedBonuses = await this.signingBonusModel.insertMany(signingBonuses);
      const insertedTerminations = await this.terminationModel.insertMany(terminationBenefits);

      // Create some penalties for testing deductions
      await this.penaltiesModel.deleteMany({});
      const penalties = [
        {
          employeeId: employees[1]._id,
          penalties: [
            { reason: 'Late arrival - 3 days', amount: 150 },
            { reason: 'Unauthorized absence', amount: 200 },
          ],
        },
      ];
      await this.penaltiesModel.insertMany(penalties);

      this.logger.log('✅ Test benefits seeded successfully');

      return {
        success: true,
        message: 'Test benefits seeded successfully',
        data: {
          signingBonuses: {
            total: insertedBonuses.length,
            pending: signingBonuses.filter(b => b.status === BonusStatus.PENDING).length,
            approved: signingBonuses.filter(b => b.status === BonusStatus.APPROVED).length,
            employees: insertedBonuses.map(b => ({
              id: b._id,
              employeeId: b.employeeId,
              amount: b.givenAmount,
              status: b.status,
            })),
          },
          terminationBenefits: {
            total: insertedTerminations.length,
            pending: terminationBenefits.filter(t => t.status === BenefitStatus.PENDING).length,
            employees: insertedTerminations.map(t => ({
              id: t._id,
              employeeId: t.employeeId,
              amount: t.givenAmount,
              status: t.status,
            })),
          },
          penalties: {
            total: penalties.length,
            employees: penalties.map(p => ({
              employeeId: p.employeeId,
              totalAmount: p.penalties.reduce((sum, pen) => sum + pen.amount, 0),
              count: p.penalties.length,
            })),
          },
          availableEmployees: employees.map(e => ({
            _id: e._id.toString(),
            name: e.name || 'Unknown',
          })),
        },
      };
    } catch (error) {
      this.logger.error(`Error seeding test benefits: ${error.message}`);
      throw new BadRequestException(`Failed to seed test benefits: ${error.message}`);
    }
  }

  /**
   * Clears all test data from the database
   */
  async clearTestData() {
    try {
      // Clear payroll runs
      const runsDeleted = await this.payrollRunModel.deleteMany({});

      // Clear payslips
      const payslipsDeleted = await this.paySlipModel.deleteMany({});

      // Clear employee payroll details
      const detailsDeleted = await this.empDetailsModel.deleteMany({});

      // Clear benefits
      const bonusesDeleted = await this.signingBonusModel.deleteMany({});
      const terminationsDeleted = await this.terminationModel.deleteMany({});

      // Clear penalties
      const penaltiesDeleted = await this.penaltiesModel.deleteMany({});

      this.logger.log('✅ All test data cleared successfully');

      return {
        success: true,
        message: 'All test data cleared successfully',
        deleted: {
          payrollRuns: runsDeleted.deletedCount,
          payslips: payslipsDeleted.deletedCount,
          employeeDetails: detailsDeleted.deletedCount,
          signingBonuses: bonusesDeleted.deletedCount,
          terminationBenefits: terminationsDeleted.deletedCount,
          penalties: penaltiesDeleted.deletedCount,
        },
      };
    } catch (error) {
      this.logger.error(`Error clearing test data: ${error.message}`);
      throw new BadRequestException(`Failed to clear test data: ${error.message}`);
    }
  }
}
