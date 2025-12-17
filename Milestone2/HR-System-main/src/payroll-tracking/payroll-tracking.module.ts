import { forwardRef, Module } from '@nestjs/common';
import { PayrollTrackingController } from './payroll-tracking.controller';
import { FinanceController } from './finance.controller';
import { PayrollTrackingService } from './payroll-tracking.service';
import { MongooseModule } from '@nestjs/mongoose';
import { refunds, refundsSchema } from './models/refunds.schema';
import { claims, claimsSchema } from './models/claims.schema';
import { disputes, disputesSchema } from './models/disputes.schema';
import { paySlip, paySlipSchema } from '../payroll-execution/models/payslip.schema';
import { PayrollConfigurationModule } from '../payroll-configuration/payroll-configuration.module';
import { PayrollExecutionModule } from '../payroll-execution/payroll-execution.module';
import { AuthModule } from '../auth/auth.module';
import { EmployeeProfileService } from '../employee-profile/employee-profile.service';
import { EmployeeProfile, EmployeeProfileSchema } from '../employee-profile/models/employee-profile.schema';
import { Candidate, CandidateSchema } from '../employee-profile/models/candidate.schema';
import { EmployeeQualification, EmployeeQualificationSchema } from '../employee-profile/models/qualification.schema';
import { EmployeeSystemRole, EmployeeSystemRoleSchema } from '../employee-profile/models/employee-system-role.schema';
import { EmployeeProfileChangeRequest, EmployeeProfileChangeRequestSchema } from '../employee-profile/models/ep-change-request.schema';
import { NotificationLog, NotificationLogSchema } from '../time-management/models/notification-log.schema';



@Module({

  imports: [
    PayrollConfigurationModule,
    forwardRef(() => PayrollExecutionModule),
    AuthModule,
    MongooseModule.forFeature([
      { name: refunds.name, schema: refundsSchema },
      { name: claims.name, schema: claimsSchema },
      { name: disputes.name, schema: disputesSchema },
      { name: paySlip.name, schema: paySlipSchema },
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
      { name: Candidate.name, schema: CandidateSchema },
      { name: EmployeeQualification.name, schema: EmployeeQualificationSchema },
      { name: EmployeeSystemRole.name, schema: EmployeeSystemRoleSchema },
      { name: EmployeeProfileChangeRequest.name, schema: EmployeeProfileChangeRequestSchema },
      { name: NotificationLog.name, schema: NotificationLogSchema },
    ])],
  controllers: [PayrollTrackingController, FinanceController],
  providers: [PayrollTrackingService, EmployeeProfileService],
  exports: [PayrollTrackingService]
})
export class PayrollTrackingModule { }
