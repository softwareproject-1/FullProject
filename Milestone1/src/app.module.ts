import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

// Employee-Organization-Performance Schemas
import { Employee, EmployeeSchema } from '../Employee-Organization-Performance/Backend/Models/employeeSchema';
import { User, UserSchema } from '../Employee-Organization-Performance/Backend/Models/userSchema';
import { Department, DepartmentSchema } from '../Employee-Organization-Performance/Backend/Models/Organization Schema/departmenSchema';
import { Position, PositionSchema } from '../Employee-Organization-Performance/Backend/Models/Organization Schema/postionSchema';
import { AppraisalTemplate, AppraisalTemplateSchema } from '../Employee-Organization-Performance/Backend/Models/performance/AppraisalTemplate';
import { AppraisalCycle, AppraisalCycleSchema } from '../Employee-Organization-Performance/Backend/Models/performance/AppraisalCycle';
import { PerformanceAppraisal, PerformanceAppraisalSchema } from '../Employee-Organization-Performance/Backend/Models/performance/PerformanceAppraisal';

// Time Management Schemas
import { AttendanceLog, AttendanceLogSchema } from '../TimeManagment/Models/AttendanceLog';
import { AttendanceCorrectionRequest, AttendanceCorrectionRequestSchema } from '../TimeManagment/Models/AttendanceCorrectionRequest';
import { DataBackup, DataBackupSchema } from '../TimeManagment/Models/DataBackup';
import { HolidayCalendar, HolidayCalendarSchema } from '../TimeManagment/Models/HolidayCalendar';
import { PayrollEscalation, PayrollEscalationSchema } from '../TimeManagment/Models/payrollEscalation';
import { Policy, PolicySchema } from '../TimeManagment/Models/policyschema';
import { ShiftAssignment, ShiftAssignmentSchema } from '../TimeManagment/Models/ShiftAssignment';
import { ShiftTemplate, ShiftTemplateSchema } from '../TimeManagment/Models/ShiftTemplate';
import { SyncLog, SyncLogSchema } from '../TimeManagment/Models/SyncLog';
import { TimeException, TimeExceptionSchema } from '../TimeManagment/Models/TimeException';
import { TimeReport, TimeReportSchema } from '../TimeManagment/Models/TimeReport';
import { VacationLink, VacationLinkSchema } from '../TimeManagment/Models/VacationLink';

// Payroll Configuration Schemas
import { AllowanceRule, AllowanceRuleSchema } from '../payroll-configuration/src/payroll-config/schemas/allowance-rule.schema';
import { InsuranceRule, InsuranceRuleSchema } from '../payroll-configuration/src/payroll-config/schemas/insurance-rule.schema';
import { PayGradeRule, PayGradeRuleSchema } from '../payroll-configuration/src/payroll-config/schemas/paygrade-rule.schema';
import { PayrollPolicy, PayrollPolicySchema } from '../payroll-configuration/src/payroll-config/schemas/payroll-policy.schema';
import { TaxBracket, TaxBracketSchema } from '../payroll-configuration/src/payroll-config/schemas/tax-bracket.schema';

// Payroll Transparency Schemas
import { ExpenseClaim, ExpenseClaimSchema } from '../PayrollTransparency/src/payroll-tracking/schemas/expense-claim.schema';
import { PayrollDispute, PayrollDisputeSchema } from '../PayrollTransparency/src/payroll-tracking/schemas/payroll-dispute.schema';
import { PayrollRun as PayrollRunTransparency, PayrollRunSchema as PayrollRunSchemaTransparency } from '../PayrollTransparency/src/payroll-tracking/schemas/payroll-run.schema';
import { Payslip, PayslipSchema } from '../PayrollTransparency/src/payroll-tracking/schemas/payslip.schema';
import { Refund, RefundSchema } from '../PayrollTransparency/src/payroll-tracking/schemas/refund.schema';
import { TaxDocument, TaxDocumentSchema } from '../PayrollTransparency/src/payroll-tracking/schemas/tax-document.schema';

// Payroll Processing Execution Schemas
import { CycleAdjustment, CycleAdjustmentSchema } from '../Payroll-Processing-Execution/backend/src/payroll-processing/schemas/cycle-adjustment.schema';
import { PayrollAnomality, PayrollAnomalitySchema } from '../Payroll-Processing-Execution/backend/src/payroll-processing/schemas/payroll-anomaly.schema';
import { PayrollRun as PayrollRunProcessing, PayrollRunSchema as PayrollRunSchemaProcessing } from '../Payroll-Processing-Execution/backend/src/payroll-processing/schemas/payroll-run.schema';
import { PayslipDetail, PayslipDetailSchema } from '../Payroll-Processing-Execution/backend/src/payroll-processing/schemas/payslip-detail.schema';

// Recruitment Schemas
import { Application, ApplicationSchema } from '../Recruitment/backend/src/recruitment-tracking/schemas/application.schema';
import { AssessmentForm, AssessmentFormSchema } from '../Recruitment/backend/src/recruitment-tracking/schemas/assessment-form.schema';
import { Candidate, CandidateSchema } from '../Recruitment/backend/src/recruitment-tracking/schemas/candidate.schema';
import { ClearanceTask, ClearanceTaskSchema } from '../Recruitment/backend/src/recruitment-tracking/schemas/clearance-task.schema';
import { EquipmentAllocation, EquipmentAllocationSchema } from '../Recruitment/backend/src/recruitment-tracking/schemas/equipment-allocation.schema';
import { ExitSettlement, ExitSettlementSchema } from '../Recruitment/backend/src/recruitment-tracking/schemas/exit-settlement.schema';
import { HiringProcessTemplate, HiringProcessTemplateSchema } from '../Recruitment/backend/src/recruitment-tracking/schemas/hiring-process-template.schema';
import { Interview, InterviewSchema } from '../Recruitment/backend/src/recruitment-tracking/schemas/interview.schema';
import { JobPosting, JobPostingSchema } from '../Recruitment/backend/src/recruitment-tracking/schemas/job-posting.schema';
import { JobTemplate, JobTemplateSchema } from '../Recruitment/backend/src/recruitment-tracking/schemas/job-template.schema';
import { OffboardingPlan, OffboardingPlanSchema } from '../Recruitment/backend/src/recruitment-tracking/schemas/offboarding-plan.schema';
import { Offer, OfferSchema } from '../Recruitment/backend/src/recruitment-tracking/schemas/offer.schema';
import { OnboardingChecklist, OnboardingChecklistSchema } from '../Recruitment/backend/src/recruitment-tracking/schemas/onboarding-checklist.schema';
import { OnboardingDocument, OnboardingDocumentSchema } from '../Recruitment/backend/src/recruitment-tracking/schemas/onboarding-document.schema';
import { OnboardingPlan, OnboardingPlanSchema } from '../Recruitment/backend/src/recruitment-tracking/schemas/onboarding-plan.schema';
//leaves
import { AccrualRule, AccrualRuleSchema } from '../Leaves/src/leaves/schemas/accrual-rule.schema';
import { ApprovalWorkflow, ApprovalWorkflowSchema } from '../Leaves/src/leaves/schemas/approval-workflow.schema';
import { EntitlementRule, EntitlementRuleSchema } from '../Leaves/src/leaves/schemas/entitlement-rule.schema';
import { HolidayCalendar as HolidayCalendarLeaves, HolidayCalendarSchema as HolidayCalendarSchemaLeaves } from '../Leaves/src/leaves/schemas/holiday-calendar.schema';
import { IntegrationLog, IntegrationLogSchema } from '../Leaves/src/leaves/schemas/integration-log.schema';
import { JobRunLog, JobRunLogSchema } from '../Leaves/src/leaves/schemas/job-run-log.schema';
import { LeaveAudit, LeaveAuditSchema } from '../Leaves/src/leaves/schemas/leave-audit.schema';
import { LeaveBalanceTransaction, LeaveBalanceTransactionSchema } from '../Leaves/src/leaves/schemas/leave-balance-transaction.schema';
import { LeaveBalance, LeaveBalanceSchema } from '../Leaves/src/leaves/schemas/leave-balance.schema';
import { LeaveCategory, LeaveCategorySchema } from '../Leaves/src/leaves/schemas/leave-category.schema';
import { LeaveRequest, LeaveRequestSchema } from '../Leaves/src/leaves/schemas/leave-request.schema';
import { LeaveType, LeaveTypeSchema } from '../Leaves/src/leaves/schemas/leave-type.schema';
import { NotificationQueue, NotificationQueueSchema } from '../Leaves/src/leaves/schemas/notification-queue.schema';
import { OffboardingSettlement, OffboardingSettlementSchema } from '../Leaves/src/leaves/schemas/offboarding-settlement.schema';
import { VacationPackage, VacationPackageSchema } from '../Leaves/src/leaves/schemas/vacation-package.schema';

@Module({
  imports: [
    // Configuration (load .env)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // MongoDB connection from environment variable
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI') || 
                    configService.get<string>('DATABASE_URL') ||
                    configService.get<string>('DB_URL') ||
                    process.env.MONGODB_URI ||
                    process.env.DATABASE_URL ||
                    process.env.DB_URL;
        
        if (!uri) {
          throw new Error('MONGODB_URI, DATABASE_URL, or DB_URL environment variable is required. Please set it in your .env file.');
        }
        
        return { uri };
      },
      inject: [ConfigService],
    }),

    // Register all schemas from all sub-projects
    MongooseModule.forFeature([
      // Employee-Organization-Performance
      { name: Employee.name, schema: EmployeeSchema },
      { name: User.name, schema: UserSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Position.name, schema: PositionSchema },
      { name: AppraisalTemplate.name, schema: AppraisalTemplateSchema },
      { name: AppraisalCycle.name, schema: AppraisalCycleSchema },
      { name: PerformanceAppraisal.name, schema: PerformanceAppraisalSchema },

      // Time Management
      { name: AttendanceLog.name, schema: AttendanceLogSchema },
      { name: AttendanceCorrectionRequest.name, schema: AttendanceCorrectionRequestSchema },
      { name: DataBackup.name, schema: DataBackupSchema },
      { name: HolidayCalendar.name, schema: HolidayCalendarSchema },
      { name: PayrollEscalation.name, schema: PayrollEscalationSchema },
      { name: Policy.name, schema: PolicySchema },
      { name: ShiftAssignment.name, schema: ShiftAssignmentSchema },
      { name: ShiftTemplate.name, schema: ShiftTemplateSchema },
      { name: SyncLog.name, schema: SyncLogSchema },
      { name: TimeException.name, schema: TimeExceptionSchema },
      { name: TimeReport.name, schema: TimeReportSchema },
      { name: VacationLink.name, schema: VacationLinkSchema },

      // Payroll Configuration
      { name: AllowanceRule.name, schema: AllowanceRuleSchema },
      { name: InsuranceRule.name, schema: InsuranceRuleSchema },
      { name: PayGradeRule.name, schema: PayGradeRuleSchema },
      { name: PayrollPolicy.name, schema: PayrollPolicySchema },
      { name: TaxBracket.name, schema: TaxBracketSchema },

      // Payroll Transparency
      { name: ExpenseClaim.name, schema: ExpenseClaimSchema },
      { name: PayrollDispute.name, schema: PayrollDisputeSchema },
      { name: PayrollRunTransparency.name, schema: PayrollRunSchemaTransparency },
      { name: Payslip.name, schema: PayslipSchema },
      { name: Refund.name, schema: RefundSchema },
      { name: TaxDocument.name, schema: TaxDocumentSchema },

      // Payroll Processing Execution
      { name: CycleAdjustment.name, schema: CycleAdjustmentSchema },
      { name: PayrollAnomality.name, schema: PayrollAnomalitySchema },
      { name: PayrollRunProcessing.name, schema: PayrollRunSchemaProcessing },
      { name: PayslipDetail.name, schema: PayslipDetailSchema },

      // Recruitment
      { name: Application.name, schema: ApplicationSchema },
      { name: AssessmentForm.name, schema: AssessmentFormSchema },
      { name: Candidate.name, schema: CandidateSchema },
      { name: ClearanceTask.name, schema: ClearanceTaskSchema },
      { name: EquipmentAllocation.name, schema: EquipmentAllocationSchema },
      { name: ExitSettlement.name, schema: ExitSettlementSchema },
      { name: HiringProcessTemplate.name, schema: HiringProcessTemplateSchema },
      { name: Interview.name, schema: InterviewSchema },
      { name: JobPosting.name, schema: JobPostingSchema },
      { name: JobTemplate.name, schema: JobTemplateSchema },
      { name: OffboardingPlan.name, schema: OffboardingPlanSchema },
      { name: Offer.name, schema: OfferSchema },
      { name: OnboardingChecklist.name, schema: OnboardingChecklistSchema },
      { name: OnboardingDocument.name, schema: OnboardingDocumentSchema },
      { name: OnboardingPlan.name, schema: OnboardingPlanSchema },
      //leaves
      { name: AccrualRule.name, schema: AccrualRuleSchema },
      { name: ApprovalWorkflow.name, schema: ApprovalWorkflowSchema },
      { name: EntitlementRule.name, schema: EntitlementRuleSchema },
      { name: HolidayCalendarLeaves.name, schema: HolidayCalendarSchemaLeaves },
      { name: IntegrationLog.name, schema: IntegrationLogSchema },
      { name: JobRunLog.name, schema: JobRunLogSchema },
      { name: LeaveAudit.name, schema: LeaveAuditSchema },
      { name: LeaveBalanceTransaction.name, schema: LeaveBalanceTransactionSchema },
      { name: LeaveBalance.name, schema: LeaveBalanceSchema },
      { name: LeaveCategory.name, schema: LeaveCategorySchema },
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
      { name: LeaveType.name, schema: LeaveTypeSchema },
      { name: NotificationQueue.name, schema: NotificationQueueSchema },
      { name: OffboardingSettlement.name, schema: OffboardingSettlementSchema },
      { name: VacationPackage.name, schema: VacationPackageSchema },
    ]),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
