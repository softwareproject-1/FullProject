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


export class LeavesService {
      constructor(
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
    private leaveRequestModel: Model<LeaveRequest>

  ) {}

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







}
