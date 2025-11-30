import {
    Injectable,
    Logger,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as mongoose from 'mongoose';

// Import all your DTOs and Schemas
import { InitiatePayrollDto } from './dto/initiate-payroll.dto';
import {
    PayrollRun,
    PayrollRunDocument,
} from './schemas/payroll-run.schema';
import {
    PayslipDetail,
    PayslipDetailDocument,
} from './schemas/payslip-detail.schema';
import {
    PayrollAnomality,
    PayrollAnomalityDocument,
} from './schemas/payroll-anomaly.schema';
import { PayrollStatus } from './enums/payroll-status.enum';

@Injectable()
export class PayrollProcessingService {
    private readonly logger = new Logger(PayrollProcessingService.name);

    // 1. Inject all the models you need
    constructor(
        @InjectModel(PayrollRun.name)
        private payrollRunModel: Model<PayrollRunDocument>,
        @InjectModel(PayslipDetail.name)
        private payslipDetailModel: Model<PayslipDetailDocument>,
        @InjectModel(PayrollAnomality.name)
        private payrollAnomalyModel: Model<PayrollAnomalityDocument>,
    ) {
        this.logger.log('PayrollProcessingService initialized with all models.');
    }

    /**
     * PHASE 1: INITIATION
     * Creates a new payroll run in 'Draft' status.
     */
    async initiateRun(
        initiateDto: InitiatePayrollDto,
        initiatorUserId: string,
    ): Promise<PayrollRunDocument> {
        const { period } = initiateDto;
        this.logger.log(`Attempting to initiate payroll for period: ${period}`);

        const existingRun = await this.payrollRunModel.findOne({ period }).exec();
        if (existingRun) {
            this.logger.warn(`Run for ${period} already exists.`);
            throw new ConflictException(`A payroll run for period ${period} exists.`);
        }

        const [month, year] = period.split('-');
        const runId = `PAY-${year}-${month.toUpperCase()}`;

        const newPayrollRun = new this.payrollRunModel({
            runId,
            period,
            status: PayrollStatus.DRAFT,
            initiatedBy: new mongoose.Types.ObjectId(initiatorUserId),
            draftGeneratedOn: null,
            approvalHistory: [],
            totalNetDisbursement: 0,
        });

        await newPayrollRun.save();
        this.logger.log(`Successfully initiated new payroll run: ${runId}`);
        return newPayrollRun;
    }

    /**
     * PHASE 1.1: DRAFT GENERATION (using Dummy Data for Milestone 1b)
     * Fetches employees, calculates salaries, and saves details.
     */
    async generateDraft(runId: string): Promise<PayrollRunDocument> {
        this.logger.log(`Attempting to generate draft for run: ${runId}`);

        // 1. Find the main payroll run
        const payrollRun = await this.payrollRunModel.findOne({ runId }).exec();
        if (!payrollRun) {
            throw new NotFoundException(`Payroll run ${runId} not found.`);
        }
        if (payrollRun.status !== PayrollStatus.DRAFT) {
            throw new ConflictException(`Run ${runId} is not in 'Draft' status.`);
        }

        // 2. DUMMY DATA (for Milestone 1b)
        // This simulates fetching data from other teams
        const dummyEmployees = [
            {
                employeeId: new mongoose.Types.ObjectId(),
                name: 'John Doe',
                grossSalary: 5000,
                penalties: 150.0,
                adjustments: 0,
            },
            {
                employeeId: new mongoose.Types.ObjectId(),
                name: 'Jane Smith',
                grossSalary: 7200,
                penalties: 0,
                adjustments: 300.0,
            },
            {
                employeeId: new mongoose.Types.ObjectId(),
                name: 'Negative Pay Anomaly',
                grossSalary: 500,
                penalties: 600.0,
                adjustments: 0,
            },
        ];

        let totalNetDisbursement = 0;
        const payslipDetailsToCreate: any[] = [];
        const anomaliesToCreate: any[] = [];

        // 3. Loop, Calculate, and Prepare
        for (const emp of dummyEmployees) {
            // Dummy calculations based on your project doc
            const taxes = emp.grossSalary * 0.1; // 10% dummy tax
            const insurance = emp.grossSalary * 0.05; // 5% dummy insurance
            const netSalary = emp.grossSalary - taxes - insurance;
            const finalPaidSalary = netSalary - emp.penalties + emp.adjustments;

            // Prepare the payslip detail document
            payslipDetailsToCreate.push({
                payrollRunId: payrollRun._id, // Link to the main run
                employeeId: emp.employeeId, // Link to the employee
                grossSalary: emp.grossSalary,
                taxes,
                insurance,
                penalties: emp.penalties,
                adjustments: emp.adjustments,
                netSalary,
                finalPaidSalary,
            });

            // 3b. Check for anomalies (as per your schema)
            if (finalPaidSalary < 0) {
                anomaliesToCreate.push({
                    payrollRunId: payrollRun._id,
                    employeeId: emp.employeeId,
                    type: 'NegativePay',
                    description: `Employee ${emp.name} has negative net pay.`,
                    status: 'Pending',
                });
            }

            totalNetDisbursement += finalPaidSalary;
        }

        // 4. Save to database
        await this.payslipDetailModel.insertMany(payslipDetailsToCreate);
        if (anomaliesToCreate.length > 0) {
            await this.payrollAnomalyModel.insertMany(anomaliesToCreate);
        }

        // 5. Update the main PayrollRun
        payrollRun.status = PayrollStatus.UNDER_REVIEW;
        payrollRun.draftGeneratedOn = new Date();
        payrollRun.totalNetDisbursement = totalNetDisbursement;
        await payrollRun.save();

        this.logger.log(`Draft generated for ${runId}. ${payslipDetailsToCreate.length} payslips created.`);
        return payrollRun;
    }
}