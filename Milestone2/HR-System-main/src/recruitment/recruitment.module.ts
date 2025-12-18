import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// --- Controllers ---
import { RecruitmentController, InterviewStatusController } from './controllers/recruitment.controller';
import { OffboardingController } from './controllers/offboarding.controller';
import { OnboardingController } from './controllers/onboarding.controller';

// --- Services ---
import { RecruitmentService, InterviewStatusService } from './services/recruitment.service';
import { OffboardingService } from './services/offboarding.service';
import { OnboardingService } from './services/onboarding.service';
import { NotificationService } from './services/notification.service';
import { ITProvisioningService } from './services/it-provisioning.service';

// --- Recruitment Models ---
import { JobTemplate, JobTemplateSchema } from './models/job-template.schema';
import { JobRequisition, JobRequisitionSchema } from './models/job-requisition.schema';
import { Application, ApplicationSchema } from './models/application.schema';
import { ApplicationStatusHistory, ApplicationStatusHistorySchema } from './models/application-history.schema';
import { Interview, InterviewSchema } from './models/interview.schema';
import { AssessmentResult, AssessmentResultSchema } from './models/assessment-result.schema';
import { Referral, ReferralSchema } from './models/referral.schema';
import { Offer, OfferSchema } from './models/offer.schema';
import { Contract, ContractSchema } from './models/contract.schema';
import { Document, DocumentSchema } from './models/document.schema';
import { TerminationRequest, TerminationRequestSchema } from './models/termination-request.schema';
import { ClearanceChecklist, ClearanceChecklistSchema } from './models/clearance-checklist.schema';
import { Onboarding, OnboardingSchema } from './models/onboarding.schema';

// --- External Models ---
import { EmployeeProfile, EmployeeProfileSchema } from '../employee-profile/models/employee-profile.schema';
import { ShiftAssignment, ShiftAssignmentSchema } from '../time-management/models/shift-assignment.schema';
import { Shift, ShiftSchema } from '../time-management/models/shift.schema';
import { NotificationLog, NotificationLogSchema } from '../time-management/models/notification-log.schema';
import { employeeSigningBonus, employeeSigningBonusSchema } from '../payroll-execution/models/EmployeeSigningBonus.schema';
import { signingBonus, signingBonusSchema } from '../payroll-configuration/models/signingBonus.schema';
import { EmployeeSystemRole, EmployeeSystemRoleSchema } from '../employee-profile/models/employee-system-role.schema';
import { Candidate, CandidateSchema } from '../employee-profile/models/candidate.schema';
import { AppraisalRecord, AppraisalRecordSchema } from '../performance/models/appraisal-record.schema';
import { LeaveEntitlement, LeaveEntitlementSchema } from '../leaves/schemas/leave-entitlement.schema';

// --- Subsystem Modules (Dependencies) ---
import { EmployeeProfileModule } from '../employee-profile/employee-profile.module';
import { OrganizationStructureModule } from '../organization-structure/organization-structure.module';
import { LeavesModule } from '../leaves/leaves.module';
import { PerformanceModule } from '../performance/performance.module';
import { TimeManagementModule } from '../time-management/time-management.module';
import { PayrollExecutionModule } from '../payroll-execution/payroll-execution.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      // Core Recruitment Schemas
      { name: JobTemplate.name, schema: JobTemplateSchema },
      { name: JobRequisition.name, schema: JobRequisitionSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: ApplicationStatusHistory.name, schema: ApplicationStatusHistorySchema },
      { name: Interview.name, schema: InterviewSchema },
      { name: AssessmentResult.name, schema: AssessmentResultSchema },
      { name: Referral.name, schema: ReferralSchema },
      { name: Offer.name, schema: OfferSchema },
      { name: Contract.name, schema: ContractSchema },
      { name: Document.name, schema: DocumentSchema },
      { name: TerminationRequest.name, schema: TerminationRequestSchema },
      { name: ClearanceChecklist.name, schema: ClearanceChecklistSchema },
      { name: Onboarding.name, schema: OnboardingSchema },
      // External schemas
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
      { name: ShiftAssignment.name, schema: ShiftAssignmentSchema },
      { name: Shift.name, schema: ShiftSchema },
      { name: NotificationLog.name, schema: NotificationLogSchema },
      { name: employeeSigningBonus.name, schema: employeeSigningBonusSchema },
      { name: signingBonus.name, schema: signingBonusSchema },
      { name: EmployeeSystemRole.name, schema: EmployeeSystemRoleSchema },
      { name: Candidate.name, schema: CandidateSchema },
      { name: AppraisalRecord.name, schema: AppraisalRecordSchema },
      { name: LeaveEntitlement.name, schema: LeaveEntitlementSchema },
    ]),

    // External Modules
    EmployeeProfileModule,
    OrganizationStructureModule,
    LeavesModule,
    PerformanceModule,
    TimeManagementModule,
    PayrollExecutionModule,
  ],
  controllers: [
    RecruitmentController,
    InterviewStatusController,
    OffboardingController,
    OnboardingController,
  ],
  providers: [
    RecruitmentService,
    InterviewStatusService,
    OffboardingService,
    OnboardingService,
    NotificationService,
    ITProvisioningService,
  ],
  exports: [
    RecruitmentService,
    InterviewStatusService,
    OffboardingService,
    OnboardingService,
  ],
})
export class RecruitmentModule { }