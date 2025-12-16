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
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LeavesService } from './leaves.service';

import { CreateLeaveTypeDto } from './dtos/create-leave-type.dto';
import { EntitlementRuleDto } from './dtos/entitlement-rule.dto';
import { AccrualPolicyDto } from './dtos/accrual-policy.dto';
import { AddHolidayDto } from './dtos/add-holiday.dto';
import { BlockedDayDto } from './dtos/blocked-day.dto';
import { ApprovalStepDto } from './dtos/create-leave-type.dto';
import { SubmitLeaveRequestDto } from './dtos/submit-leave-request.dto';
import { ApproveLeaveRequestDto } from './dtos/approve-leave-request.dto';
import { ReviewLeaveRequestDto } from './dtos/review-leave-request.dto';
import { RetroactiveDeductionDto } from './dtos/retroactive-deduction.dto';
import { SetDelegationDto } from './dtos/set-delegation.dto';
import { RevokeDelegationDto } from './dtos/revoke-delegation.dto';

import { AuthenticationGuard } from '../auth/guards/authentication.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
// Seif's work - Additional imports
import { LeaveStatus } from './enums/leave-status.enum';



@ApiTags('leaves')
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
// ============================ Phase 2: Leave Request and Approval ============================

@Post('request')
async submitLeaveRequest(@Body() dto: SubmitLeaveRequestDto) {
  return this.leavesService.submitLeaveRequest(
    dto.employeeId,
    dto.leaveTypeId,
    dto.dates,
    dto.justification,
    dto.attachmentId,
  );
}

@Post('request/:id/approve')
async approveLeaveRequest(
  @Param('id') id: string,
  @Body() dto: ApproveLeaveRequestDto,
) {
  return this.leavesService.approveLeaveRequest(
    id,
    dto.managerId,
    dto.status,
    dto.reason,
  );
}

@Post('request/:id/review')
async reviewLeaveRequest(
  @Param('id') id: string,
  @Body() dto: ReviewLeaveRequestDto,
) {
  return this.leavesService.reviewLeaveRequest(
    id,
    dto.hrId,
    dto.status,
    dto.overrideReason,
  );
}

@Get('balance/:employeeId/:leaveTypeId')
async getLeaveBalance(
  @Param('employeeId') employeeId: string,
  @Param('leaveTypeId') leaveTypeId: string,
) {
  return this.leavesService.getLeaveBalance(employeeId, leaveTypeId);
}

@Post('escalation/check')
async checkAutoEscalation() {
  return this.leavesService.checkAutoEscalation();
}

@Post('deduction/retroactive')
async applyRetroactiveDeduction(@Body() dto: RetroactiveDeductionDto) {
  return this.leavesService.applyRetroactiveDeduction(
    dto.employeeId,
    dto.leaveTypeId,
    dto.dates,
    dto.reason,
  );
}

// ============================ Delegation Management ============================

@Post('delegation/set')
@ApiOperation({ summary: 'Set delegation: Manager delegates approval authority to another employee' })
@ApiBody({ type: SetDelegationDto })
@ApiResponse({ status: 201, description: 'Delegation set successfully' })
@ApiResponse({ status: 404, description: 'Manager or delegate not found' })
@ApiBearerAuth('JWT-auth')
async setDelegation(@Body() dto: SetDelegationDto) {
  return this.leavesService.setDelegation(
    dto.managerId,
    dto.delegateId,
    dto.startDate ? new Date(dto.startDate) : undefined,
    dto.endDate ? new Date(dto.endDate) : null,
  );
}

@Post('delegation/revoke')
@ApiOperation({ summary: 'Revoke delegation for a manager' })
@ApiBody({ type: RevokeDelegationDto })
@ApiResponse({ status: 200, description: 'Delegation revoked successfully' })
@ApiResponse({ status: 404, description: 'No active delegation found' })
@ApiBearerAuth('JWT-auth')
async revokeDelegation(@Body() dto: RevokeDelegationDto) {
  return this.leavesService.revokeDelegation(dto.managerId);
}

@Get('delegation/status/:managerId')
@ApiOperation({ summary: 'Get delegation status for a manager' })
@ApiParam({ name: 'managerId', description: 'Manager ID to check delegation status' })
@ApiResponse({ status: 200, description: 'Delegation status retrieved successfully' })
@ApiBearerAuth('JWT-auth')
async getDelegationStatus(@Param('managerId') managerId: string) {
  return this.leavesService.getDelegationStatus(managerId);
}
}

