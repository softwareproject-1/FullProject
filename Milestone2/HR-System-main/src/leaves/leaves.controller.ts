//import { Controller } from '@nestjs/common';

import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Query,
  BadRequestException,
  Patch,
} from '@nestjs/common';
import { LeavesService } from './leaves.service';

import { CreateLeaveTypeDto } from './dtos/create-leave-type.dto';
import { EntitlementRuleDto } from './dtos/entitlement-rule.dto';
import { AccrualPolicyDto } from './dtos/accrual-policy.dto';
import { AddHolidayDto } from './dtos/add-holiday.dto';
import { BlockedDayDto } from './dtos/blocked-day.dto';
import { ApprovalStepDto } from './dtos/create-leave-type.dto';

import { UseGuards } from '@nestjs/common';
import { AuthenticationGuard } from '../auth/guards/authentication.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';



@UseGuards(AuthenticationGuard, RolesGuard)
@Controller('leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}


  // ============================Omar Controller part ============================


  //LEAVE TYPES --> works
  //updates leave type schema


  @Post('types')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles('HR_ADMIN')
  async createLeaveType(@Body() dto: CreateLeaveTypeDto) {
    return this.leavesService.createLeaveType(dto);
  }


  //ENTITLEMENT RULES ---> works
  //updates leave policy schema


  @Post('types/:leaveTypeId/entitlement-rule')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles('HR_ADMIN')
  async setEntitlementRule(
    @Param('leaveTypeId') leaveTypeId: string,
    @Body() dto: EntitlementRuleDto,
  ) {
    return this.leavesService.setEntitlementRule(leaveTypeId, dto);
  }


  //PERSONALIZED ENTITLEMENTS ---> works
  //updates leave entitlement schema
  @Patch('entitlement/personalized')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles('HR_ADMIN')
  async setPersonalizedEntitlement(
    @Body()
    body: {
      employeeId: string;
      leaveTypeId: string;
      yearlyEntitlement: number;
    },
  ) {
    return this.leavesService.setPersonalizedEntitlement(
      body.employeeId,
      body.leaveTypeId,
      body.yearlyEntitlement,
    );
  }


  //ACCRUAL POLICY CONFIGURATION-> problem + integration with payroll and time management systems


  @Post('accrual/:employeeId/:leaveTypeId')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles('HR_ADMIN')
  async configureAccrualPolicy(
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string,
    @Query('monthsWorked') monthsWorked: string,
    @Body() dto: AccrualPolicyDto,
  ) {
    if (!monthsWorked) throw new BadRequestException('monthsWorked required');

    return this.leavesService.configureAccrualPolicy(
      employeeId,
      leaveTypeId,
      parseInt(monthsWorked),
      dto,
    );
  }

  
  //APPROVAL WORKFLOW + PAYROLL CODE -> works 
  //updates the leave request database 
  
  @Patch('types/:leaveTypeId/workflow')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles('SYSTEM_ADMIN')
  async configureApprovalWorkflow(
    @Param('leaveTypeId') leaveTypeId: string,
    @Body()
    body: {
      approvalWorkflow: ApprovalStepDto[];
      payrollCode: string;
    },
  ) {
    return this.leavesService.configureApprovalWorkflowAndPayrollIntegration(
      leaveTypeId,
      body.approvalWorkflow,
      body.payrollCode,
    );
  }


  //HOLIDAY CALENDAR MANAGEMENT -> works
 

  @Post('calendar/:year/holiday')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles('HR_ADMIN')
  async addHoliday(
    @Param('year') year: string,
    @Body() dto: AddHolidayDto,
  ) {
    return this.leavesService.addHoliday(Number(year), dto);
  }

  //BLOCKED DAYS MANAGEMENT -> works
  @Post('calendar/:year/blocked')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles('HR_ADMIN')
  async addBlockedPeriod(
    @Param('year') year: string,
    @Body() dto: BlockedDayDto,
  ) {
    return this.leavesService.addBlockedPeriod(Number(year), dto);
  }

  //  NET LEAVE CALCULATION -> works

  @Get('net-duration')
  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles('HR_ADMIN')
  async calculateNetLeaveDuration(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('year') year: string,
  ) {
    return this.leavesService.calculateNetLeaveDuration(
      startDate,
      endDate,
      Number(year),
    );
  }



  // ============================End of Omar Controller part ============================
}

