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
import { Calendar, CalendarSchema } from './schemas/calendar.schema';
import { Attachment, AttachmentSchema } from './schemas/attachment.schema';
import { EmployeeProfileModule } from '../employee-profile/employee-profile.module';
import { TimeManagementModule } from '../time-management/time-management.module';
// Seif's work - Additional imports
import { forwardRef } from '@nestjs/common';
import { PayrollExecutionModule } from '../payroll-execution/payroll-execution.module';
import { employeePenalties, employeePenaltiesSchema } from '../payroll-execution/models/employeePenalties.schema';
import { payGrade, payGradeSchema } from '../payroll-configuration/models/payGrades.schema';
import { Position, PositionSchema } from '../organization-structure/models/position.schema';
import { Department, DepartmentSchema } from '../organization-structure/models/department.schema';
import { AttendanceRecord, AttendanceRecordSchema } from '../time-management/models/attendance-record.schema';
import { EmployeeProfile, EmployeeProfileSchema } from '../employee-profile/models/employee-profile.schema';
import { PositionAssignment, PositionAssignmentSchema } from '../organization-structure/models/position-assignment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      // Omar's work - Original schemas
      { name: LeaveType.name, schema: LeaveTypeSchema },
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
      { name: LeavePolicy.name, schema: LeavePolicySchema },
      { name: LeaveEntitlement.name, schema: LeaveEntitlementSchema },
      { name: LeaveCategory.name, schema: LeaveCategorySchema },
      { name: LeaveAdjustment.name, schema: LeaveAdjustmentSchema },
      { name: Calendar.name, schema: CalendarSchema },
      { name: Attachment.name, schema: AttachmentSchema },
      // Seif's work - Additional schemas
      { name: employeePenalties.name, schema: employeePenaltiesSchema },
      { name: payGrade.name, schema: payGradeSchema },
      { name: Position.name, schema: PositionSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: AttendanceRecord.name, schema: AttendanceRecordSchema },
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
      { name: PositionAssignment.name, schema: PositionAssignmentSchema }
    ]),
    // Omar's work - Original module imports
    // Seif's work - Using forwardRef for circular dependency handling
    forwardRef(() => EmployeeProfileModule),
    forwardRef(() => TimeManagementModule),
    // Seif's work - Additional module import
    //forwardRef(() => PayrollExecutionModule)
  ],
  controllers: [LeavesController],
  providers: [LeavesService],
  exports: [LeavesService]
})
export class LeavesModule { }

