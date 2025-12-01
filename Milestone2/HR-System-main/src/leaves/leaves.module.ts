import { Module } from '@nestjs/common';
import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveType, LeaveTypeSchema } from './schemas/leave-type.schema';
import { LeaveRequest, LeaveRequestSchema } from './schemas/leave-request.schema';
import { LeavePolicy, LeavePolicySchema } from './schemas/leave-policy.schema';
import { LeaveEntitlement, LeaveEntitlementSchema } from './schemas/leave-entitlement.schema';
import { LeaveCategory, LeaveCategorySchema } from './schemas/leave-category.schema';
import { LeaveAdjustment, LeaveAdjustmentSchema } from './schemas/leave-adjustment.schema';
import { Calendar, CalendarSchema} from './schemas/calendar.schema';
import { Attachment,AttachmentSchema } from './schemas/attachment.schema';
import { EmployeeProfileModule } from '../employee-profile/employee-profile.module';
import { TimeManagementModule } from '../time-management/time-management.module';

@Module({
  imports:[MongooseModule.forFeature([{name:LeaveType.name,schema:LeaveTypeSchema},
    {name:LeaveRequest.name, schema: LeaveRequestSchema},
    {name:LeavePolicy.name, schema:LeavePolicySchema},
    {name:LeaveEntitlement.name, schema:LeaveEntitlementSchema},
    {name: LeaveCategory.name, schema:LeaveCategorySchema},
    {name: LeaveAdjustment.name, schema:LeaveAdjustmentSchema},
    {name:Calendar.name, schema:CalendarSchema},
    {name:Attachment.name, schema: AttachmentSchema}
  ]),EmployeeProfileModule,TimeManagementModule],
  controllers: [LeavesController],
  providers: [LeavesService],
  exports:[LeavesService]
})
export class LeavesModule {}

