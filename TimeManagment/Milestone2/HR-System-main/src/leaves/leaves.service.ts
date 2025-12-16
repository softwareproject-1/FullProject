import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { LeaveType, LeaveTypeDocument } from './schemas/leave-type.schema';
import { LeaveCategory, LeaveCategoryDocument } from './schemas/leave-category.schema';
import { LeaveEntitlement, LeaveEntitlementDocument } from './schemas/leave-entitlement.schema';
import { LeavePolicy, LeavePolicyDocument } from './schemas/leave-policy.schema';
import { AddHolidayDto } from './dtos/add-holiday.dto';
import { BlockedDayDto } from './dtos/blocked-day.dto';
import { CreateLeaveTypeDto, ApprovalStepDto } from './dtos/create-leave-type.dto';
import { EntitlementRuleDto } from './dtos/entitlement-rule.dto';
import { AccrualPolicyDto } from './dtos/accrual-policy.dto';
import { Calendar, CalendarDocument } from './schemas/calendar.schema';
import { LeaveRequest, LeaveRequestSchema } from './schemas/leave-request.schema';
import { AccrualMethod } from './enums/accrual-method.enum';
// Seif's work - Additional imports
import { LeaveStatus } from './enums/leave-status.enum';
import { Attachment, AttachmentDocument } from './schemas/attachment.schema';
import { LeaveRequestDocument } from './schemas/leave-request.schema';
import { EmployeeProfileService } from '../employee-profile/employee-profile.service';
import { TimeManagementService } from '../time-management/time-management.service';
import { TimeExceptionType } from '../time-management/models/enums/index';
import { employeePenalties, employeePenaltiesDocument } from '../payroll-execution/models/employeePenalties.schema';
import { payGrade, payGradeDocument } from '../payroll-configuration/models/payGrades.schema';
import { Position, PositionDocument } from '../organization-structure/models/position.schema';
import { Department, DepartmentDocument } from '../organization-structure/models/department.schema';
import { AttendanceRecord, AttendanceRecordDocument } from '../time-management/models/attendance-record.schema';
import { EmployeeProfile, EmployeeProfileDocument } from '../employee-profile/models/employee-profile.schema';
import { PositionAssignment, PositionAssignmentDocument } from '../organization-structure/models/position-assignment.schema';
import { forwardRef, Inject } from '@nestjs/common';


@Injectable()
export class LeavesService {
      constructor(
    // Omar's work - Original model injections
    @InjectModel(LeaveType.name)
    private leaveTypeModel: Model<LeaveTypeDocument>,
    @InjectModel(LeaveCategory.name)
    private leaveCategoryModel: Model<LeaveCategoryDocument>,
    @InjectModel(LeaveEntitlement.name)
    private leaveEntitlementModel: Model<LeaveEntitlementDocument>,
    @InjectModel(LeavePolicy.name)
    private leavePolicyModel: Model<LeavePolicyDocument>,
    @InjectModel(Calendar.name) // ✅ inject the calendar schema
    private calendarModel: Model<CalendarDocument>,
    @InjectModel(LeaveRequest.name)
    private leaveRequestModel: Model<LeaveRequest>,
    // Seif's work - Additional model injections
    @InjectModel(Attachment.name)
    private attachmentModel: Model<AttachmentDocument>,
    @InjectModel(employeePenalties.name)
    private employeePenaltiesModel: Model<employeePenaltiesDocument>,
    @InjectModel(payGrade.name)
    private payGradeModel: Model<payGradeDocument>,
    @InjectModel(Position.name)
    private positionModel: Model<PositionDocument>,
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
    @InjectModel(AttendanceRecord.name)
    private attendanceRecordModel: Model<AttendanceRecordDocument>,
    @InjectModel(EmployeeProfile.name)
    private employeeModel: Model<EmployeeProfileDocument>,
    @InjectModel(PositionAssignment.name)
    private positionAssignmentModel: Model<PositionAssignmentDocument>,
    // Seif's work - Service injections with forwardRef
    @Inject(forwardRef(() => EmployeeProfileService))
    private employeeProfileService: EmployeeProfileService,
    @Inject(forwardRef(() => TimeManagementService))
    private timeManagementService: TimeManagementService

  ) {}

  // ========== DELEGATION MAP (In-Memory) ==========
  // Stores delegation assignments: managerId -> delegation info
  // This avoids schema changes as per user requirement
  private delegationMap: Map<string, {
    managerId: string;
    delegateId: string;
    startDate: Date;
    endDate: Date | null; // null = indefinite
    isActive: boolean;
  }> = new Map();

  // ========== DELEGATION METHODS ==========

  /**
   * Set delegation: Manager delegates approval authority to another employee
   * Uses in-memory map - no schema changes needed
   */
  async setDelegation(
    managerId: string,
    delegateId: string,
    startDate?: Date,
    endDate?: Date | null,
  ) {
    // Validate both employees exist
    const [manager, delegate] = await Promise.all([
      this.employeeModel.findById(managerId),
      this.employeeModel.findById(delegateId),
    ]);

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }
    if (!delegate) {
      throw new NotFoundException('Delegate employee not found');
    }

    // Check if manager is actually a manager (has employees reporting to them)
    // This is optional validation - you can remove if not needed
    const hasReports = await this.employeeModel.findOne({
      supervisorPositionId: manager.primaryPositionId,
      status: 'ACTIVE'
    });

    if (!hasReports) {
      console.warn(`Manager ${managerId} has no direct reports. Delegation still set.`);
    }

    const key = managerId;
    this.delegationMap.set(key, {
      managerId,
      delegateId,
      startDate: startDate || new Date(),
      endDate: endDate || null,
      isActive: true,
    });

    return {
      managerId,
      delegateId,
      startDate: startDate || new Date(),
      endDate: endDate || null,
      message: 'Delegation set successfully',
    };
  }

  /**
   * Revoke delegation for a manager
   */
  revokeDelegation(managerId: string) {
    const key = managerId;
    const delegation = this.delegationMap.get(key);
    
    if (!delegation) {
      throw new NotFoundException('No active delegation found for this manager');
    }

    delegation.isActive = false;
    this.delegationMap.set(key, delegation);
    
    return { message: 'Delegation revoked successfully' };
  }

  /**
   * Get active delegate for a manager at a given date
   * Returns delegateId if delegation is active, otherwise returns managerId
   * This is used when setting approvalFlow[].decidedBy
   */
  private getActiveDelegate(managerId: string, checkDate: Date = new Date()): string {
    const key = managerId;
    const delegation = this.delegationMap.get(key);

    // No delegation or inactive
    if (!delegation || !delegation.isActive) {
      return managerId;
    }

    // Check date range
    if (checkDate < delegation.startDate) {
      return managerId; // Delegation hasn't started yet
    }

    if (delegation.endDate && checkDate > delegation.endDate) {
      return managerId; // Delegation has expired
    }

    // Delegation is active - return delegate
    return delegation.delegateId;
  }

  /**
   * Helper: Find manager for an employee and apply delegation if active
   * Returns the approver ID (manager or delegate) to be stored in approvalFlow[].decidedBy
   */
  private async findApproverWithDelegation(
    employeeId: string,
    requestDate: Date = new Date(),
  ): Promise<Types.ObjectId> {
    // Get employee profile
    const employee = await this.employeeModel
      .findById(employeeId)
      .populate('supervisorPositionId')
      .exec();

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Find manager through supervisor position
    const supervisorPosition = employee.supervisorPositionId;
    if (!supervisorPosition) {
      throw new BadRequestException('Employee has no supervisor assigned');
    }

    // Find employee(s) in that supervisor position
    const managers = await this.employeeModel
      .find({ primaryPositionId: supervisorPosition })
      .exec();

    if (managers.length === 0) {
      throw new NotFoundException('No manager found for supervisor position');
    }

    // Use first manager
    const managerId = managers[0]._id.toString();

    // Check for active delegation - returns delegateId if active, otherwise managerId
    const actualApproverId = this.getActiveDelegate(managerId, requestDate);

    return new Types.ObjectId(actualApproverId);
  }

  /**
   * Get delegation status for a manager
   */
  getDelegationStatus(managerId: string) {
    const key = managerId;
    const delegation = this.delegationMap.get(key);

    if (!delegation || !delegation.isActive) {
      return { hasDelegation: false };
    }

    const now = new Date();
    const isActive = now >= delegation.startDate && 
                     (delegation.endDate === null || now <= delegation.endDate);

    return {
      hasDelegation: true,
      isActive,
      managerId: delegation.managerId,
      delegateId: delegation.delegateId,
      startDate: delegation.startDate,
      endDate: delegation.endDate,
    };
  }

    //============================== Omar service methods ============================//
    //leave types(point 1)
    async createLeaveType(dto: CreateLeaveTypeDto) { 
    // make sure the input category is an existing category if not found will throw error
    const category = await this.leaveCategoryModel.findById(dto.categoryId);
    if (!category) throw new BadRequestException('Leave category not found');

    // a method creating all leave type     
    const leaveType = new this.leaveTypeModel({ 
      ...dto, //take all the properties(attributes) from dto
      categoryId: new Types.ObjectId(dto.categoryId), //convert the string in categoryId to ObjectId
      attachmentType: dto.attachmentType ?? undefined, //if the attachement is not given it is set to undefined
    });
    return leaveType.save();
  }


  //entitlement rules(point 2)
  //a method to set entitlement rule for a given leave type it take the leavetypeId and the entitlement rule dto as inputs
  async setEntitlementRule(leaveTypeId: string, dto: EntitlementRuleDto) {
  // Make sure the referenced leave type exists
  const leaveType = await this.leaveTypeModel.findById(leaveTypeId);
  if (!leaveType) {
    throw new NotFoundException('Leave type not found');
  }

  // Compose eligibility object from DTO
  const eligibility = dto.eligibilityCriteria || {};//checks eligibility criteria like minTenure, grade, contractType

  //defines the leave policy based on leaveTypeId and eligibility criteria
  const leavePolicy = await this.leavePolicyModel.findOneAndUpdate(
    {
      //It finds an existing leave policy that matches both the leaveTypeId and the same eligibility rules.
      // If no such policy exists, a new one is created.
      leaveTypeId: new Types.ObjectId(leaveTypeId),
      eligibility: eligibility,
    },
    {
      leaveTypeId: new Types.ObjectId(leaveTypeId), //sets the leaveTypeId
      yearlyRate: dto.daysPerYear, //sets the days per year from dto
      eligibility: eligibility, //sets the eligibility criteria
      
      // ...add any other fields to set, such as accrual, etc.
    },
    { upsert: true, new: true } //creates a new leave policy if not found
  );
  return leavePolicy;
}




//personalized entitlement rules(point 2)
async setPersonalizedEntitlement(employeeId: string, leaveTypeId: string, yearlyEntitlement: number) {
  // Basic check if leave type exists (optional)
  //chcecks the leave type id is valid
  const leaveType = await this.leaveTypeModel.findById(leaveTypeId);
  if (!leaveType) {
    throw new NotFoundException('Leave type not found');
  }

  // Upsert LeaveEntitlement for employee+leaveType
  const entitlement = await this.leaveEntitlementModel.findOneAndUpdate(
    {
     //checks if the employeeId and leaveTypeId combination already exists
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    },
    {
      yearlyEntitlement, //takes the yearly entitlement as an a personalized excpetion 
      
    },
    { new: true, upsert: true } // creates a new entitlement if not found (no valid employeeID or leaveTypeID)
  );
  return entitlement;
}




async getUnpaidLeaveMonths(employeeId: string): Promise<number> {
  const unpaidLeaves = await this.leaveRequestModel.find({
    employeeId: new Types.ObjectId(employeeId),
    status: 'APPROVED',
    leaveType: 'UNPAID', // or match your unpaid leave type
  });

  let months = 0;
  unpaidLeaves.forEach((leave) => {
    const start = new Date(leave.dates.from);
    const end = new Date(leave.dates.to);
    months += (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
  });

  return months;
}















//accrual policy(point 3)
async calculateAccruedLeave(employeeId: string, leaveTypeId: string, monthsWorked: number , pauseDuringUnpaid: boolean) {
  const leavePolicy = await this.leavePolicyModel.findOne({ leaveTypeId: leaveTypeId });

  if (!leavePolicy) throw new NotFoundException('Leave policy not found');

  let accrued = 0;

  if (leavePolicy.accrualMethod === AccrualMethod.MONTHLY) {
    accrued = monthsWorked; // example: 1 day per month
  }

  // Pause accrual during unpaid leave
  const unpaidMonths = await this.getUnpaidLeaveMonths(employeeId); // fetch from leave requests
  if (pauseDuringUnpaid) { // runtime flag from DTO or cache
    accrued -= unpaidMonths;
  }

  return accrued;
}
















//?? the selection criteria is not added in the schema how to add it or handle it ?
private pauseDuringUnpaidMap: Record<string, boolean> = {};
async configureAccrualPolicy(
  employeeId: string,
  leaveTypeId: string,
  monthsWorked: number,
  dto: AccrualPolicyDto
) {
  const leaveType = await this.leaveTypeModel.findById(leaveTypeId);
  if (!leaveType) throw new NotFoundException('LeaveType not found');

  // Map resetDateType to numeric months if needed
  let expiryAfterMonths: number | undefined;
  switch (dto.resetDateType) {
    case 'annual':
      expiryAfterMonths = 12;
      break;
    case 'quarterly':
      expiryAfterMonths = 3;
      break;
    case 'monthly':
      expiryAfterMonths = 1;
      break;
    default:
      expiryAfterMonths = undefined;
  }

  const updateFields: any = {
    leaveTypeId: new Types.ObjectId(leaveTypeId),
    accrualMethod: dto.accrualRate,
    carryForwardAllowed: dto.carryOverCap > 0,
    maxCarryForward: dto.carryOverCap,
    expiryAfterMonths, // mapped value
    pauseDuringUnpaid: dto.pauseDuringUnpaid, // store flag in LeavePolicy
  };

  const netAccrued = await this.calculateAccruedLeave(
    employeeId,
    leaveTypeId,
    monthsWorked,
    dto.pauseDuringUnpaid
  );

  // Upsert LeavePolicy document with the new fields
  const res = await this.leavePolicyModel.findOneAndUpdate(
    { leaveTypeId: new Types.ObjectId(leaveTypeId) },
    updateFields,
    { upsert: true, new: true }
  );

  return res;
}



//point 4 approval workflows
//take as inputs the leave type id , approval workflow array and payroll code   
//???????the integration service is not defined how to define it ?       
 



private approvalWorkflowMap: Record<string, ApprovalStepDto[]> = {};
private payrollCodeMap: Record<string, string> = {};
async configureApprovalWorkflowAndPayrollIntegration(
  leaveTypeId: string,
  approvalWorkflow: ApprovalStepDto[],
  payrollCode: string
) {
  const leaveType = await this.leaveTypeModel.findById(leaveTypeId);
  if (!leaveType) throw new NotFoundException('LeaveType not found');

  // Instead of runtime maps, store workflow & payroll in LeavePolicy
  const res = await this.leaveRequestModel.findOneAndUpdate(//updated
{ leaveTypeId: new Types.ObjectId(leaveTypeId) },
  {
    approvalFlow: approvalWorkflow.map(step => ({
      role: step.role,
      status: 'PENDING',      // default status
      decidedBy: null,
      decidedAt: null,
    })),
  },
  { upsert: true, new: true }
  );

  return {
    leaveType,
    approvalWorkflow,
    payrollCode,
  };
}




//point 5 holiday calendar management 


async addHoliday(year: number, dto: AddHolidayDto) {
  let calendar = await this.calendarModel.findOne({ year });
  if (!calendar) {
    calendar = new this.calendarModel({ year, holidays: [], blockedPeriods: [] });
  }

  // Handle recurring holidays → apply the year from the argument
  const holidayDate = new Date(dto.date);
  if (dto.isRecurring) {
    holidayDate.setFullYear(year);
  }

  // Convert holiday date → ObjectId with matching timestamp
  const seconds = Math.floor(holidayDate.getTime() / 1000);
  const hex = seconds.toString(16).padStart(8, '0');
  const holidayObjectId = new Types.ObjectId(hex + "0000000000000000");

  // Store holiday date encoded in ObjectId
  calendar.holidays.push(holidayObjectId);

  await calendar.save();
  return calendar;
  }


    //blocked days that cant be holidays in the calendar
    async addBlockedPeriod(year: number, dto: BlockedDayDto) {
      //finds a calendar if not found it create a new calendar
    let calendar = await this.calendarModel.findOne({ year });
    if (!calendar) {
      calendar = new this.calendarModel({ year, holidays: [], blockedPeriods: [] });
    }

    //pushes in the calendar blocked periods where it has a range(start->end) and a reason for blocking
    calendar.blockedPeriods.push({
      from: new Date(dto.startDate),
      to: new Date(dto.endDate),
      reason: dto.reason || dto.name,
    });

    await calendar.save(); //save the calendar with the blocked periods
    return calendar;
  }

  //calculate the netLeaveDays
  //input of startDate , endDate and year returns a number
  //this number is the net leave duration without the holidays and blocked days and weekend
    async calculateNetLeaveDuration(
    startDate: string,
    endDate: string,
    year: number,
  ): Promise<number> {
    //we need the calendar to know which days are holidays and blocked days
    //if no calendar is given it throws an exception
    const calendar = await this.calendarModel.findOne({ year });
    if (!calendar) throw new NotFoundException('Calendar not found');
    //convert inputs to date objects(to iterate through)
    //makes a totalDay counter = 0 to iterate for the total net days
    const start = new Date(startDate);
    const end = new Date(endDate);
    let totalDays = 0;
    //loop from the start date to the end date &(d.setDate(d.getDate()+1) increments the date by 1 day in each iteration)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      // skip weekends
      //the first 6 days are not counted as leaves
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

      // skip holidays
      //check if the current day is a holiday in the calendar
      //if its a holiday it skips to the next iteration
      const isHoliday = calendar.holidays.some((h: Types.ObjectId) => {
      const timestampHex = h.toString().substring(0, 8);
      const holidayDate = new Date(parseInt(timestampHex, 16) * 1000);
      return holidayDate.toDateString() === d.toDateString();
      });
      if (isHoliday) continue;

      // skip blocked periods
      //check if the current day is a blocked period in the calendar
      //if its a blocked period it skips to the next iteration
      const inBlocked = calendar.blockedPeriods.some(
        (b) => d >= b.from && d <= b.to,
      );
      if (inBlocked) continue;

      totalDays += 1;
    }

    return totalDays;
  }


  //============================== End of Omar service methods ============================//

 // ============================ Phase 2: Leave Request and Approval ============================

 async getLeaveBalance(employeeId: string, leaveTypeId: string): Promise<number> {
  const employee = await this.employeeProfileService.getProfileById(employeeId);
  if (!employee) throw new NotFoundException('Employee not found');

  const now = new Date();
  const hireDate = new Date(employee.dateOfHire);
  const monthsWorked = (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth());

  // Fetch policy to check pauseDuringUnpaid preference if possible, or default to true (BR 11)
  // const policy = await this.leavePolicyModel.findOne({ leaveTypeId: new Types.ObjectId(leaveTypeId) });
  const pauseDuringUnpaid = true; // Default to true as per BR 11 and schema limitation

  const accrued = await this.calculateAccruedLeave(employeeId, leaveTypeId, monthsWorked, pauseDuringUnpaid);

  const takenRequests = await this.leaveRequestModel.find({
    employeeId: new Types.ObjectId(employeeId),
    leaveTypeId: new Types.ObjectId(leaveTypeId),
    status: LeaveStatus.APPROVED,
  });

  const taken = takenRequests.reduce((sum, req) => sum + req.durationDays, 0);

  return accrued - taken;
}

async submitLeaveRequest(
  employeeId: string,
  leaveTypeId: string,
  dates: { from: Date; to: Date },
  justification: string,
  attachmentId?: string,
) {
  const fromDate = new Date(dates.from);
  const toDate = new Date(dates.to);

  if (fromDate > toDate) throw new BadRequestException('Invalid date range');

  // 1. Validate Leave Type & Policy Rules
  const leaveType = await this.leaveTypeModel.findById(leaveTypeId);
  if (!leaveType) throw new NotFoundException('Leave type not found');

  const policy = await this.leavePolicyModel.findOne({ leaveTypeId: new Types.ObjectId(leaveTypeId) });

  // BR 8: Eligibility Validation - Check tenure, contract type, position
  const employee = await this.employeeProfileService.getProfileById(employeeId);
  if (!employee) throw new NotFoundException('Employee not found');

  // Check minimum tenure requirement
  if (leaveType.minTenureMonths) {
    const hireDate = new Date(employee.dateOfHire);
    const now = new Date();
    const tenureMonths = (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth());

    if (tenureMonths < leaveType.minTenureMonths) {
      throw new BadRequestException(
        `Minimum tenure of ${leaveType.minTenureMonths} months required for ${leaveType.name}. Current tenure: ${tenureMonths} months`
      );
    }
  }

  // Check contract type eligibility (if policy has restrictions)
  if (policy && policy.eligibility && policy.eligibility.contractTypesAllowed) {
    const allowedTypes = policy.eligibility.contractTypesAllowed;
    if (allowedTypes.length > 0 && !allowedTypes.includes(employee.contractType)) {
      throw new BadRequestException(
        `Leave type ${leaveType.name} is not available for ${employee.contractType} contract type`
      );
    }
  }

  // Check position eligibility (if policy has restrictions)
  if (policy && policy.eligibility && policy.eligibility.positionsAllowed) {
    const allowedPositions = policy.eligibility.positionsAllowed;
    if (allowedPositions.length > 0 && employee.primaryPositionId) {
      const positionIdStr = employee.primaryPositionId.toString();
      if (!allowedPositions.includes(positionIdStr)) {
        throw new BadRequestException(
          `Leave type ${leaveType.name} is not available for your position`
        );
      }
    }
  }

  // REQ-016 & REQ-028: Attachment Validation
  if (leaveType.requiresAttachment && !attachmentId) {
    throw new BadRequestException(`Attachment is required for ${leaveType.name}`);
  }

  // REQ-028: Validate attachment content if provided
  if (attachmentId) {
    await this.validateAttachment(attachmentId, leaveType);
  }

  // REQ-031: Grace Period & Notice Validation
  const now = new Date();
  const diffTime = fromDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (policy && policy.minNoticeDays > 0 && diffDays < policy.minNoticeDays) {
    // Check if it's a post-leave request (grace period logic would go here, assuming 30 days grace for now)
    if (diffDays < -30) {
      throw new BadRequestException(`Request is outside the allowed grace period.`);
    }
    // If it's a future request but violates notice period
    if (diffDays >= 0 && diffDays < policy.minNoticeDays) {
      throw new BadRequestException(`Minimum notice period of ${policy.minNoticeDays} days required.`);
    }
  }

  // BR 41: Max Consecutive Days
  const duration = await this.calculateNetLeaveDuration(fromDate.toISOString(), toDate.toISOString(), fromDate.getFullYear());
  if (policy && policy.maxConsecutiveDays && duration > policy.maxConsecutiveDays) {
    throw new BadRequestException(`Leave exceeds maximum consecutive days limit of ${policy.maxConsecutiveDays}`);
  }

  // BR 41: Cumulative Yearly Limit Validation
  await this.validateCumulativeLimit(employeeId, leaveTypeId, duration, fromDate.getFullYear());

  // Check overlap
  const overlap = await this.leaveRequestModel.findOne({
    employeeId: new Types.ObjectId(employeeId),
    status: { $in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
    $or: [
      { 'dates.from': { $lte: toDate }, 'dates.to': { $gte: fromDate } },
    ],
  });
  if (overlap) throw new BadRequestException('Leave request overlaps with existing leave');

  // Check balance (BR 31)
  const balance = await this.getLeaveBalance(employeeId, leaveTypeId);

  // BR 29: Excess-to-Unpaid Conversion - FULL IMPLEMENTATION
  if (balance < duration) {
    const paidDays = balance;
    const unpaidDays = duration - balance;

    // Find or create unpaid leave type
    const unpaidLeaveType = await this.leaveTypeModel.findOne({ code: 'UNPAID' });
    if (!unpaidLeaveType) {
      throw new BadRequestException(
        `Insufficient balance (${balance} days available, ${duration} requested). Unpaid leave type not configured.`
      );
    }

    // Create the paid portion (using available balance)
    if (paidDays > 0) {
      const paidRequest = new this.leaveRequestModel({
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: new Types.ObjectId(leaveTypeId),
        dates: { from: fromDate, to: toDate },
        durationDays: paidDays,
        justification: `${justification} (Paid portion: ${paidDays} days)`,
        attachmentId: attachmentId ? new Types.ObjectId(attachmentId) : undefined,
        status: LeaveStatus.PENDING,
      });
      await paidRequest.save();
    }

    // Create the unpaid portion (excess days)
    const unpaidRequest = new this.leaveRequestModel({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: unpaidLeaveType._id,
      dates: { from: fromDate, to: toDate },
      durationDays: unpaidDays,
      justification: `${justification} (Unpaid portion: ${unpaidDays} days - converted from ${leaveType.name})`,
      attachmentId: attachmentId ? new Types.ObjectId(attachmentId) : undefined,
      status: LeaveStatus.PENDING,
    });

    console.log(`Split request created: ${paidDays} paid days + ${unpaidDays} unpaid days`);
    return unpaidRequest.save();
  }

  // Team Scheduling Conflicts (BR 28) - Warning/Validation
  // Note: employee already fetched above for eligibility check
  if (employee && employee.primaryDepartmentId) {
      // Seif's work - Get department members directly from model
      const teamMembers = await this.employeeModel.find({
        primaryDepartmentId: new Types.ObjectId(employee.primaryDepartmentId.toString()),
        status: 'ACTIVE'
      }).exec();
    const teamMemberIds = teamMembers.map((m) => m._id);

    const teamLeaves = await this.leaveRequestModel.countDocuments({
      employeeId: { $in: teamMemberIds, $ne: new Types.ObjectId(employeeId) },
      status: LeaveStatus.APPROVED,
      $or: [
        { 'dates.from': { $lte: toDate }, 'dates.to': { $gte: fromDate } },
      ],
    });

    if (teamLeaves > 0) {
      console.warn(`Potential team scheduling conflict: ${teamLeaves} other members on leave.`);
    }
  }

  const request = new this.leaveRequestModel({
    employeeId: new Types.ObjectId(employeeId),
    leaveTypeId: new Types.ObjectId(leaveTypeId),
    dates: { from: fromDate, to: toDate },
    durationDays: duration,
    justification,
    attachmentId: attachmentId ? new Types.ObjectId(attachmentId) : undefined,
    status: LeaveStatus.PENDING,
  });

  return request.save();
}

async approveLeaveRequest(requestId: string, managerId: string, status: LeaveStatus, reason?: string) {
  const request = await this.leaveRequestModel.findById(requestId);
  if (!request) throw new NotFoundException('Leave request not found');

  if (request.status !== LeaveStatus.PENDING) throw new BadRequestException('Request is not pending');

    // REQ-020: Manager Verification - Complete Implementation
    const employee = await this.employeeProfileService.getProfileById(request.employeeId.toString());
    if (!employee) throw new NotFoundException('Employee not found');

  // REQ-023: Manager Delegation - Check if manager is the supervisor or a valid delegate
  const isAuthorized = await this.verifyManagerAuthorization(employee, managerId);
  if (!isAuthorized) {
    throw new BadRequestException('Manager is not authorized to approve this request');
  }

  request.approvalFlow.push({
    role: 'MANAGER',
    status: status,
    decidedBy: new Types.ObjectId(managerId),
    decidedAt: new Date(),
  });

  if (status === LeaveStatus.REJECTED) {
    request.status = LeaveStatus.REJECTED;
  }
  // If Approved, status remains PENDING for HR review

  return request.save();
}

async reviewLeaveRequest(requestId: string, hrId: string, status: LeaveStatus, overrideReason?: string) {
  const request = await this.leaveRequestModel.findById(requestId);
  if (!request) throw new NotFoundException('Leave request not found');

  // REQ-026: HR Override
  // HR can act even if status is REJECTED (by manager) to override it to APPROVED
  // Or if status is PENDING (manager approved)

  request.approvalFlow.push({
    role: 'HR',
    status: status,
    decidedBy: new Types.ObjectId(hrId),
    decidedAt: new Date(),
  });

  if (status === LeaveStatus.APPROVED) {
    request.status = LeaveStatus.APPROVED;
    await this.finalizeLeaveRequest(request);
  } else {
    request.status = LeaveStatus.REJECTED;
  }

  return request.save();
}


private async finalizeLeaveRequest(request: LeaveRequestDocument) {
  // 1. Update real-time balance in LeaveEntitlement
  await this.updateLeaveBalance(request.employeeId.toString(), request.leaveTypeId.toString(), request.durationDays);

  // 2. Notify stakeholders (INTEGRATED)
  try {
    await this.timeManagementService.createNotification({
      to: request.employeeId.toString(),
      type: 'LEAVE_APPROVED',
      message: `Leave request ${request._id} has been approved.`,
    });
    console.log(`Notification sent for leave ${request._id}`);
  } catch (error) {
    console.error(`Failed to send notification for leave ${request._id}:`, error);
  }

  // 3. Block attendance (INTEGRATED)
  try {
    // Find or create attendance record for the start date to attach the exception
    const startDate = new Date(request.dates.from);
    startDate.setHours(0, 0, 0, 0);

    // Try to find existing record
    let attendanceRecord = await this.attendanceRecordModel.findOne({
      employeeId: new Types.ObjectId(request.employeeId.toString()),
      createdAt: {
        $gte: startDate,
        $lt: new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    // If not found, create a placeholder record
    if (!attendanceRecord) {
      console.log(`Creating placeholder attendance record for leave exception on ${startDate.toISOString()}`);
      // We use 'as any' here because we are injecting the model directly and bypassing the service wrapper
      // which might have different return types or strict checks.
      attendanceRecord = await this.timeManagementService.createAttendanceRecord({
        employeeId: request.employeeId.toString(),
        punches: [],
        exceptionIds: []
      }) as any;
    }

    if (attendanceRecord) {
      await this.timeManagementService.createTimeException({
        employeeId: request.employeeId.toString(),
        type: TimeExceptionType.MANUAL_ADJUSTMENT,
        attendanceRecordId: attendanceRecord._id.toString(),
        assignedTo: request.employeeId.toString(),
        reason: `Approved Leave: ${request.justification}`,
        status: undefined // Default to OPEN
      });
      console.log(`Attendance blocked from ${request.dates.from} to ${request.dates.to}`);
    }
  } catch (error) {
    console.warn(`Could not create time exception:`, error);
  }

  // 4. Adjust payroll (INTEGRATED)
  try {
    // Check if this is unpaid leave
    const leaveType = await this.leaveTypeModel.findById(request.leaveTypeId);

    if (leaveType && (leaveType.code === 'UNPAID' || leaveType.name.toLowerCase().includes('unpaid'))) {
      // Get employee details to calculate deduction amount
      const employee = await this.employeeProfileService.getProfileById(request.employeeId.toString());

      if (employee && employee.payGradeId) {
        // Fetch the payGrade to get baseSalary
        const payGrade = await this.payGradeModel.findById(employee.payGradeId);

        if (payGrade && payGrade.baseSalary) {
          // Calculate deduction: (baseSalary / 22 working days) * leave duration
          const workingDaysPerMonth = 22;
          const dailyRate = payGrade.baseSalary / workingDaysPerMonth;
          const deductionAmount = request.durationDays * dailyRate;

          // Record penalty in employeePenalties collection
          await this.employeePenaltiesModel.findOneAndUpdate(
            { employeeId: request.employeeId },
            {
              $push: {
                penalties: {
                  amount: deductionAmount,
                  reason: `Unpaid leave deduction: ${request.dates.from.toISOString().split('T')[0]} to ${request.dates.to.toISOString().split('T')[0]} (${request.durationDays} days)`,
                  date: new Date(),
                  type: 'UNPAID_LEAVE'
                }
              }
            },
            { upsert: true, new: true }
          );

          console.log(`Penalty recorded for unpaid leave: Employee ${request.employeeId}, Amount: ${deductionAmount.toFixed(2)}, Days: ${request.durationDays}`);
        } else {
          console.warn(`Could not calculate unpaid leave deduction: Employee ${request.employeeId} has no pay grade or base salary`);
        }
      } else {
        console.warn(`Could not calculate unpaid leave deduction: Employee ${request.employeeId} has no pay grade assigned`);
      }
    }
  } catch (error) {
    console.error(`Failed to record unpaid leave penalty:`, error);
  }
}

// Real-time balance update method
private async updateLeaveBalance(employeeId: string, leaveTypeId: string, durationDays: number): Promise<void> {
  const entitlement = await this.leaveEntitlementModel.findOne({
    employeeId: new Types.ObjectId(employeeId),
    leaveTypeId: new Types.ObjectId(leaveTypeId),
  });

  if (entitlement) {
    // Update taken and remaining fields
    entitlement.taken = (entitlement.taken || 0) + durationDays;
    entitlement.remaining = (entitlement.yearlyEntitlement || 0) - entitlement.taken;
    await entitlement.save();
    console.log(`Updated balance for employee ${employeeId}: taken=${entitlement.taken}, remaining=${entitlement.remaining}`);
  } else {
    // Create new entitlement record if it doesn't exist
    await this.leaveEntitlementModel.create({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
      taken: durationDays,
      remaining: -durationDays, // Negative indicates over-usage
    });
    console.log(`Created new entitlement record for employee ${employeeId}`);
  }
}

// BR 28: Auto-Escalation
async checkAutoEscalation() {
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const pendingRequests = await this.leaveRequestModel.find({
    status: LeaveStatus.PENDING,
    createdAt: { $lt: fortyEightHoursAgo },
    'approvalFlow.role': { $ne: 'MANAGER' } // Manager hasn't acted yet
  });

  for (const req of pendingRequests) {
    console.log(`Escalating request ${req._id} due to manager inactivity.`);

    // Logic to notify skip-level manager
    try {
        const employee = await this.employeeProfileService.getProfileById(req.employeeId.toString());
      if (employee && employee.supervisorPositionId) {
        // 1. Get Supervisor Position
        const supervisorPosition = await this.positionModel.findById(employee.supervisorPositionId);

        if (supervisorPosition && supervisorPosition.reportsToPositionId) {
          // 2. Get Skip-Level Supervisor Position (Grand-Supervisor)
          const skipLevelPositionId = supervisorPosition.reportsToPositionId;

          // 3. Find employee holding this position
          // Note: This assumes one employee per position or takes the first one found
          const skipLevelManager = await this.employeeModel.findOne({
            primaryPositionId: skipLevelPositionId,
            status: 'ACTIVE'
          });

          if (skipLevelManager) {
            await this.timeManagementService.createNotification({
              to: skipLevelManager._id.toString(),
              type: 'LEAVE_ESCALATION',
              message: `ESCALATION: Leave request ${req._id} for ${employee.firstName} ${employee.lastName} is pending approval > 48h.`
            });
            console.log(`Escalation notification sent to skip-level manager ${skipLevelManager._id}`);
          } else {
            console.warn(`No skip-level manager found for position ${skipLevelPositionId}`);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to process escalation for request ${req._id}:`, error);
    }
  }
  return pendingRequests.length;
}

// BR 19: Retroactive Deductions
async applyRetroactiveDeduction(employeeId: string, leaveTypeId: string, dates: { from: Date; to: Date }, reason: string) {
  const duration = await this.calculateNetLeaveDuration(dates.from.toISOString(), dates.to.toISOString(), dates.from.getFullYear());

  const request = new this.leaveRequestModel({
    employeeId: new Types.ObjectId(employeeId),
    leaveTypeId: new Types.ObjectId(leaveTypeId),
    dates: dates,
    durationDays: duration,
    justification: `Retroactive Deduction: ${reason}`,
    status: LeaveStatus.APPROVED, // Automatically approved
    approvalFlow: [{
      role: 'HR_SYSTEM',
      status: LeaveStatus.APPROVED,
      decidedAt: new Date(),
    }]
  });

  await request.save();
  await this.finalizeLeaveRequest(request);
  return request;
}

// REQ-020 & REQ-023: Manager Verification and Delegation - FULL IMPLEMENTATION
private async verifyManagerAuthorization(employee: any, managerId: string): Promise<boolean> {
    const manager = await this.employeeProfileService.getProfileById(managerId);
  if (!manager || !manager.primaryPositionId) return false;

  // 1. Direct Supervisor Check (REQ-020)
  if (employee.supervisorPositionId &&
    manager.primaryPositionId.toString() === employee.supervisorPositionId.toString()) {
    return true;
  }

  // 2. Department Head Check (Delegation via Role)
  if (employee.primaryDepartmentId) {
    const department = await this.departmentModel.findById(employee.primaryDepartmentId);
    if (department && department.headPositionId &&
      department.headPositionId.toString() === manager.primaryPositionId.toString()) {
      console.log(`Manager ${managerId} authorized as Department Head`);
      return true;
    }
  }

  // 3. Hierarchy Traversal (Skip-Level Manager)
  // Check if manager holds a position that is an ancestor of the employee's position
  if (employee.primaryPositionId) {
    let currentPositionId = employee.primaryPositionId;
    let depth = 0;
    const MAX_DEPTH = 5; // Prevent infinite loops

    while (currentPositionId && depth < MAX_DEPTH) {
      const position = await this.positionModel.findById(currentPositionId);
      if (!position || !position.reportsToPositionId) break;

      if (position.reportsToPositionId.toString() === manager.primaryPositionId.toString()) {
        console.log(`Manager ${managerId} authorized via hierarchy traversal (Depth: ${depth + 1})`);
        return true;
      }

      currentPositionId = position.reportsToPositionId;
      depth++;
    }
  }

  // 4. Explicit Delegation Check (REQ-023) - In-Memory Delegation Map
  // Check if manager has delegated authority to another employee via delegation map
  if (employee.supervisorPositionId) {
    // Find the actual manager for this employee
    const managers = await this.employeeModel
      .find({ primaryPositionId: employee.supervisorPositionId })
      .exec();

    if (managers.length > 0) {
      const actualManagerId = managers[0]._id.toString();
      
      // Check if the managerId trying to approve is the delegate
      const delegation = this.delegationMap.get(actualManagerId);
      if (delegation && delegation.isActive) {
        const now = new Date();
        const isActive = now >= delegation.startDate && 
                         (delegation.endDate === null || now <= delegation.endDate);
        
        if (isActive && delegation.delegateId === managerId) {
          console.log(`Manager ${managerId} authorized via In-Memory Delegation`);
          return true;
        }
      }
    }
  }

  // 5. Legacy PositionAssignment Delegation Check (if still needed)
  if (employee.supervisorPositionId) {
    const now = new Date();
    const delegation = await this.positionAssignmentModel.findOne({
      employeeProfileId: new Types.ObjectId(managerId),
      positionId: new Types.ObjectId(employee.supervisorPositionId),
      startDate: { $lte: now },
      $or: [{ endDate: { $gte: now } }, { endDate: null }]
    });

    if (delegation) {
      console.log(`Manager ${managerId} authorized via Explicit Delegation (PositionAssignment)`);
      return true;
    }
  }

  // If no verification passed, deny authorization
  console.warn(`Manager ${managerId} not authorized for employee ${employee._id}`);
  return false;
}

// BR 41: Cumulative Yearly Leave Limits
async validateCumulativeLimit(employeeId: string, leaveTypeId: string, requestedDuration: number, year: number): Promise<void> {
  // Get all approved leaves for this employee, leave type, and year
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);

  const yearlyLeaves = await this.leaveRequestModel.find({
    employeeId: new Types.ObjectId(employeeId),
    leaveTypeId: new Types.ObjectId(leaveTypeId),
    status: LeaveStatus.APPROVED,
    'dates.from': { $gte: yearStart, $lte: yearEnd }
  });

  const totalTaken = yearlyLeaves.reduce((sum, req) => sum + req.durationDays, 0);
  const totalAfterRequest = totalTaken + requestedDuration;

  // Check policy for yearly limit (if exists)
  const policy = await this.leavePolicyModel.findOne({ leaveTypeId: new Types.ObjectId(leaveTypeId) });
  if (policy && policy.yearlyRate && totalAfterRequest > policy.yearlyRate) {
    throw new BadRequestException(
      `Cumulative yearly limit exceeded. Limit: ${policy.yearlyRate} days, Already taken: ${totalTaken} days, Requested: ${requestedDuration} days`
    );
  }
}

// REQ-028: Document Validation - ENHANCED IMPLEMENTATION
async validateAttachment(attachmentId: string, leaveType: any): Promise<void> {
  if (!attachmentId) return;

  // 1. Fetch document metadata
  const attachment = await this.attachmentModel.findById(attachmentId);
  if (!attachment) {
    throw new BadRequestException(`Attachment not found: ${attachmentId}`);
  }

  // 2. Validate file type
  if (attachment.fileType) {
    const allowedTypes = this.getAllowedFileTypes(leaveType.attachmentType);
    if (!allowedTypes.includes(attachment.fileType)) {
      throw new BadRequestException(`Invalid file type: ${attachment.fileType}. Allowed: ${allowedTypes.join(', ')}`);
    }
  }

  // 3. Validate file size (e.g., max 5MB)
  const maxSizeBytes = 5 * 1024 * 1024; // 5MB
  if (attachment.size && attachment.size > maxSizeBytes) {
    throw new BadRequestException(`File size exceeds maximum of 5MB`);
  }

  console.log(`Document validation passed for attachment ${attachmentId}`);
}

// Helper method to get allowed file types based on attachment type
private getAllowedFileTypes(attachmentType: string): string[] {
  const typeMap: Record<string, string[]> = {
    'MEDICAL_CERTIFICATE': ['application/pdf', 'image/jpeg', 'image/png'],
    'LEGAL_DOCUMENT': ['application/pdf'],
    'PROOF_OF_TRAVEL': ['application/pdf', 'image/jpeg', 'image/png'],
    'OTHER': ['application/pdf', 'image/jpeg', 'image/png', 'application/msword'],
  };
  return typeMap[attachmentType] || typeMap['OTHER'];
}
}






