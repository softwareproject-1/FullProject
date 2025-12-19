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
import { UpdateLeaveTypeDto } from './dtos/update-leave-type.dto';
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
import { AcceptDelegationDto } from './dtos/accept-delegation.dto';
import { RejectDelegationDto } from './dtos/reject-delegation.dto';
import { PersonalizedEntitlementDto } from './dtos/personalized-entitlement.dto';

import { AuthenticationGuard } from '../auth/guards/authentication.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
// Seif's work - Additional imports
import { LeaveStatus } from './enums/leave-status.enum';



@ApiTags('leaves')
@UseGuards(AuthenticationGuard, RolesGuard)
@Controller('leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) { }


  // ============================Omar Controller part ============================


  //LEAVE TYPES --> works
  //updates leave type schema

  //@Get('types')
  //@UseGuards(AuthenticationGuard, RolesGuard)
  //@Roles('HR_ADMIN')
  //async getLeaveTypes() {
  //return this.leavesService.findAllLeaveTypes();
  //}


  @Post('types') // create leave type -> works (create leave type )
  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles('HR Admin')
  async createLeaveType(@Body() dto: CreateLeaveTypeDto) {
    return this.leavesService.createLeaveType(dto);
  }

  @Get('types') //get all leave types -> works (get all leave types )
  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles('HR Admin') // Allow all authenticated roles to see leave types
  async getAllLeaveTypes() {
    return this.leavesService.findAllLeaveTypes();
  }
  @Patch('types/:id') //update leave type -> works (update leave type )
  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles('HR Admin')
  async updateLeaveType(
    @Param('id') id: string,
    @Body() updateLeaveTypeDto: UpdateLeaveTypeDto,
  ) {
    return this.leavesService.updateLeaveType(id, updateLeaveTypeDto);
  }

  // ========== Personalized Entitlements ==========

  /**
   * Set personalized entitlement for an individual employee
   * POST /leaves/entitlement/personalized
   */
  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles('HR Admin')
  @Post('entitlement/personalized') //-> works (update leave entitlements)
  async setPersonalizedEntitlement(
    @Body() dto: {
      employeeId: string;
      leaveTypeId: string;
      yearlyEntitlement: number;
      reason?: string;
    },
  ) {
    return this.leavesService.setPersonalizedEntitlement(
      dto.employeeId,
      dto.leaveTypeId,
      dto.yearlyEntitlement,
      dto.reason,
    );
  }

  /**
   * Set personalized entitlement for a group of employees (bulk assignment)
   * POST /leaves/entitlement/personalized/bulk
   * Supports assignment by department, position, location, contract type, or explicit employee list
   */
  @Post('entitlement/personalized/group') //-> works (update leave entitlements)
  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles('HR Admin')
  async setPersonalizedEntitlementGroup(@Body() dto: PersonalizedEntitlementDto) {
    return this.leavesService.setPersonalizedEntitlementForGroup(dto);
  }

  // ========== Entitlement Rules ==========
  //updates leave policy schema


  @Post('types/:leaveTypeId/entitlement-rule') //-> works (update leave policy)
  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles('HR Admin')
  async setEntitlementRule(
    @Param('leaveTypeId') leaveTypeId: string,
    @Body() dto: EntitlementRuleDto,
  ) {
    return this.leavesService.setEntitlementRule(leaveTypeId, dto);
  }


  // ========== Accrual Policy Configuration ==========

  //ACCRUAL POLICY CONFIGURATION-> problem + integration with payroll and time management systems
  @Post('accrual/:employeeId/:leaveTypeId') //works update leave policy
  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles('HR Admin')
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
  @Roles('System Admin','HR Admin')
  async configureApprovalWorkflow( //problem but works
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


  @Post('calendar/:year/holiday') //adds to calendar schema and works
  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles('HR Admin')
  async addHoliday(
    @Param('year') year: string,
    @Body() dto: AddHolidayDto,
  ) {
    return this.leavesService.addHoliday(Number(year), dto);
  }

  //BLOCKED DAYS MANAGEMENT -> works
  @Post('calendar/:year/blocked') //adds to calendar schema and works
  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles('HR Admin')
  async addBlockedPeriod(
    @Param('year') year: string,
    @Body() dto: BlockedDayDto,
  ) {
    return this.leavesService.addBlockedPeriod(Number(year), dto);
  }

  //  NET LEAVE CALCULATION -> works

  @Get('net-duration') //works correctly for all the cases
  @UseGuards(AuthenticationGuard, RolesGuard)
  @Roles('HR Admin')
  async calculateNetLeaveDuration(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('year') year: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.leavesService.calculateNetLeaveDuration(
      startDate,
      endDate,
      Number(year),
      employeeId,
    );
  }



  // ============================End of Omar Controller part ============================
  // ============================ Phase 2: Leave Request and Approval ============================

  @Post('request')
  @ApiOperation({ summary: 'Submit a new leave request' })
  @ApiBody({ type: SubmitLeaveRequestDto })
  @ApiResponse({ status: 201, description: 'Leave request submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiBearerAuth('JWT-auth')
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
  @ApiOperation({ summary: 'Approve or reject a leave request (Manager or Delegate)' })
  @ApiParam({ name: 'id', description: 'Leave request ID' })
  @ApiBody({ type: ApproveLeaveRequestDto })
  @ApiResponse({ status: 200, description: 'Leave request approved/rejected successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or unauthorized' })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  @ApiBearerAuth('JWT-auth')
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
  @ApiOperation({ summary: 'Review a leave request (HR)' })
  @ApiParam({ name: 'id', description: 'Leave request ID' })
  @ApiBody({ type: ReviewLeaveRequestDto })
  @ApiResponse({ status: 200, description: 'Leave request reviewed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  @ApiBearerAuth('JWT-auth')
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
  @ApiOperation({ summary: 'Get leave balance for an employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiParam({ name: 'leaveTypeId', description: 'Leave type ID' })
  @ApiResponse({ status: 200, description: 'Leave balance retrieved successfully' })
  @ApiBearerAuth('JWT-auth')
  async getLeaveBalance(
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string,
  ) {
    return this.leavesService.getLeaveBalance(employeeId, leaveTypeId);
  }

  @Post('escalation/check')
  @ApiOperation({ summary: 'Check and escalate pending leave requests (>48h)' })
  @ApiResponse({ status: 200, description: 'Escalation check completed' })
  @ApiBearerAuth('JWT-auth')
  async checkAutoEscalation() {
    return this.leavesService.checkAutoEscalation();
  }

  @Post('deduction/retroactive')
  @ApiOperation({ summary: 'Apply retroactive leave deduction' })
  @ApiBody({ type: RetroactiveDeductionDto })
  @ApiResponse({ status: 201, description: 'Retroactive deduction applied successfully' })
  @ApiBearerAuth('JWT-auth')
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

  @Post('delegation/accept')
  @ApiOperation({ summary: 'Accept delegation: Delegate accepts the delegation request' })
  @ApiBody({ type: AcceptDelegationDto })
  @ApiResponse({ status: 200, description: 'Delegation accepted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or delegation already rejected' })
  @ApiResponse({ status: 404, description: 'Delegation not found' })
  @ApiBearerAuth('JWT-auth')
  async acceptDelegation(@Body() dto: AcceptDelegationDto) {
    return this.leavesService.acceptDelegation(dto.managerId, dto.delegateId);
  }

  @Post('delegation/reject')
  @ApiOperation({ summary: 'Reject delegation: Delegate rejects the delegation request' })
  @ApiBody({ type: RejectDelegationDto })
  @ApiResponse({ status: 200, description: 'Delegation rejected successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'Delegation not found' })
  @ApiBearerAuth('JWT-auth')
  async rejectDelegation(@Body() dto: RejectDelegationDto) {
    return this.leavesService.rejectDelegation(dto.managerId, dto.delegateId);
  }
// // ============================ End of Phase 2: Leave Request and Approval (Seif's Work) =============================


}

