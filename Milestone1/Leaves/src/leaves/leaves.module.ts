import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeavesService } from './leaves.service';
import { LeavesController } from './leaves.controller';
import { LeaveRequestSchema } from './schemas/leave-request.schema';
import { LeaveBalanceSchema } from './schemas/leave-balance.schema';
import { LeaveTypeSchema } from './schemas/leave-type.schema';
import { EntitlementRuleSchema } from './schemas/entitlement-rule.schema';
import { AccrualRuleSchema } from './schemas/accrual-rule.schema';
import { ApprovalWorkflowSchema } from './schemas/approval-workflow.schema';
import { HolidayCalendarSchema } from './schemas/holiday-calendar.schema';
import { LeaveBalanceTransactionSchema } from './schemas/leave-balance-transaction.schema';
import { LeaveAuditSchema } from './schemas/leave-audit.schema';
import { IntegrationLogSchema } from './schemas/integration-log.schema';
import { NotificationQueueSchema } from './schemas/notification-queue.schema';
import { JobRunLogSchema } from './schemas/job-run-log.schema';
import { OffboardingSettlementSchema } from './schemas/offboarding-settlement.schema';
import { LeaveCategorySchema } from './schemas/leave-category.schema';
import { VacationPackageSchema } from './schemas/vacation-package.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'LeaveRequest', schema: LeaveRequestSchema },
      { name: 'LeaveBalance', schema: LeaveBalanceSchema },
      { name: 'LeaveType', schema: LeaveTypeSchema },
      { name: 'EntitlementRule', schema: EntitlementRuleSchema },
      { name: 'AccrualRule', schema: AccrualRuleSchema },
      { name: 'ApprovalWorkflow', schema: ApprovalWorkflowSchema },
      { name: 'HolidayCalendar', schema: HolidayCalendarSchema },
      { name: 'LeaveBalanceTransaction', schema: LeaveBalanceTransactionSchema },
      { name: 'LeaveAudit', schema: LeaveAuditSchema },
      { name: 'IntegrationLog', schema: IntegrationLogSchema },
      { name: 'NotificationQueue', schema: NotificationQueueSchema },
      { name: 'JobRunLog', schema: JobRunLogSchema },
      { name: 'OffboardingSettlement', schema: OffboardingSettlementSchema },
      { name: 'LeaveCategory', schema: LeaveCategorySchema },
      { name: 'VacationPackage', schema: VacationPackageSchema },
    ]),
  ],
  providers: [LeavesService],
  controllers: [LeavesController],
})
export class LeavesModule {}
