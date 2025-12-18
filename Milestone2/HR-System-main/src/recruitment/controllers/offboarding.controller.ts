import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { OffboardingService } from '../services/offboarding.service';
import { AuthenticationGuard } from '../../auth/guards/authentication.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SystemRole } from '../../employee-profile/enums/employee-profile.enums';
import {
  InitiateTerminationReviewDto,
  UpdateTerminationStatusDto,
  CreateResignationRequestDto,
  ReviewResignationDto,
  CreateOffboardingChecklistDto,
  AddEquipmentToChecklistDto,
  DepartmentSignOffDto,
  UpdateEquipmentReturnDto,
  UpdateAccessCardReturnDto,
  ScheduleAccessRevocationDto,
  TriggerFinalSettlementDto,
  RevokeAccessImmediatelyDto,
} from '../dto/offboarding.dto';

/**
 * OffboardingController handles:
 * - OFF-001: Termination reviews based on performance data
 * - OFF-006: Offboarding checklist (IT assets, ID cards, equipment)
 * - OFF-007: System/account access revocation
 * - OFF-010: Multi-department exit clearance sign-offs
 * - OFF-013: Benefits termination & final pay calculation (with notifications)
 * - OFF-018/019: Employee resignation requests & tracking
 */
@Controller('recruitment/offboarding')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@UseGuards(AuthenticationGuard, RolesGuard)
export class OffboardingController {
  constructor(private readonly offboardingService: OffboardingService) { }

  // ============================================================
  // OFF-001: Termination Review Endpoints
  // ============================================================

  /**
   * Initiate termination review (HR/Manager)
   */
  @Post('termination/review')
  @HttpCode(HttpStatus.CREATED)
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async initiateTerminationReview(@Body() dto: InitiateTerminationReviewDto) {
    return this.offboardingService.initiateTerminationReview(dto);
  }

  /**
   * Update termination status
   */
  @Patch('termination/:terminationId/status')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async updateTerminationStatus(
    @Param('terminationId') terminationId: string,
    @Body() dto: UpdateTerminationStatusDto,
  ) {
    return this.offboardingService.updateTerminationStatus(terminationId, dto);
  }

  /**
   * Get pending terminations
   */
  @Get('termination/pending')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getPendingTerminations() {
    return this.offboardingService.getPendingTerminations();
  }

  /**
   * Get terminations by employee
   */
  @Get('termination/employee/:employeeId')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getTerminationsByEmployee(@Param('employeeId') employeeId: string) {
    return this.offboardingService.getTerminationsByEmployee(employeeId);
  }

  /**
   * Get termination by ID
   */
  @Get('termination/:terminationId')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getTerminationRequest(@Param('terminationId') terminationId: string) {
    return this.offboardingService.getTerminationRequest(terminationId);
  }

  /**
   * Get employee performance data for termination review (OFF-001)
   * Returns latest appraisal data to help HR make informed termination decisions
   */
  @Get('termination/employee/:employeeId/performance')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getEmployeePerformanceData(@Param('employeeId') employeeId: string) {
    return this.offboardingService.getEmployeePerformanceData(employeeId);
  }

  // ============================================================
  // OFF-018/019: Resignation Endpoints
  // ============================================================

  /**
   * Create resignation request (Employee - OFF-018)
   */
  @Post('resignation')
  @HttpCode(HttpStatus.CREATED)
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async createResignationRequest(@Body() dto: CreateResignationRequestDto) {
    return this.offboardingService.createResignationRequest(dto);
  }

  /**
   * Get all my resignations (Employee - OFF-019)
   */
  @Get('resignation/my')
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getMyResignations(@Query('employeeId') employeeId: string) {
    return this.offboardingService.getMyResignations(employeeId);
  }

  /**
   * Get resignation status (Employee - OFF-019)
   */
  @Get('resignation/:resignationId')
  @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getResignationStatus(
    @Param('resignationId') resignationId: string,
    @Query('employeeId') employeeId: string,
  ) {
    return this.offboardingService.getResignationStatus(resignationId, employeeId);
  }

  /**
   * Review resignation (HR Manager - OFF-019)
   */
  @Patch('resignation/:resignationId/review')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async reviewResignation(
    @Param('resignationId') resignationId: string,
    @Body() dto: ReviewResignationDto,
  ) {
    return this.offboardingService.reviewResignation(resignationId, dto);
  }

  // ============================================================
  // OFF-006: Offboarding Checklist Endpoints
  // ============================================================

  /**
   * Create offboarding checklist (OFF-006)
   */
  @Post('checklist')
  @HttpCode(HttpStatus.CREATED)
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async createOffboardingChecklist(@Body() dto: CreateOffboardingChecklistDto) {
    return this.offboardingService.createOffboardingChecklist(dto);
  }

  /**
   * Add equipment to checklist (OFF-006)
   */
  @Post('checklist/:checklistId/equipment')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async addEquipmentToChecklist(
    @Param('checklistId') checklistId: string,
    @Body() dto: AddEquipmentToChecklistDto,
  ) {
    return this.offboardingService.addEquipmentToChecklist(checklistId, dto);
  }

  /**
   * Get checklist by termination (OFF-006)
   */
  @Get('checklist/termination/:terminationId')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getChecklistByTermination(@Param('terminationId') terminationId: string) {
    return this.offboardingService.getChecklistByTermination(terminationId);
  }

  // ============================================================
  // OFF-010: Department Clearance Sign-off Endpoints
  // ============================================================

  /**
   * Department sign-off (OFF-010)
   */
  @Patch('checklist/:checklistId/signoff')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async departmentSignOff(
    @Param('checklistId') checklistId: string,
    @Body() dto: DepartmentSignOffDto,
    @Query('userId') userId: string,
  ) {
    return this.offboardingService.departmentSignOff(checklistId, userId, dto);
  }

  /**
   * Update equipment return (OFF-010)
   */
  @Patch('checklist/:checklistId/equipment')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async updateEquipmentReturn(
    @Param('checklistId') checklistId: string,
    @Body() dto: UpdateEquipmentReturnDto,
  ) {
    return this.offboardingService.updateEquipmentReturn(checklistId, dto);
  }

  /**
   * Update access card return (OFF-010)
   */
  @Patch('checklist/:checklistId/access-card')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async updateAccessCardReturn(
    @Param('checklistId') checklistId: string,
    @Body() dto: UpdateAccessCardReturnDto,
  ) {
    return this.offboardingService.updateAccessCardReturn(checklistId, dto);
  }

  /**
   * Check if clearance complete (OFF-010)
   */
  @Get('checklist/:checklistId/complete')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async isClearanceComplete(@Param('checklistId') checklistId: string) {
    const isComplete = await this.offboardingService.isClearanceComplete(checklistId);
    return { isComplete };
  }

  // ============================================================
  // OFF-007: Access Revocation Endpoints
  // ============================================================

  /**
   * Schedule access revocation (OFF-007 - System Admin only)
   */
  @Post('access/schedule-revocation')
  @Roles(SystemRole.SYSTEM_ADMIN)
  async scheduleAccessRevocation(@Body() dto: ScheduleAccessRevocationDto) {
    return this.offboardingService.scheduleAccessRevocation(dto);
  }

  /**
   * Immediately revoke all access (OFF-007 - System Admin only)
   * For urgent terminations or security concerns
   */
  @Post('access/revoke-immediate')
  @HttpCode(HttpStatus.OK)
  @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER)
  async revokeAccessImmediately(@Body() dto: RevokeAccessImmediatelyDto) {
    return this.offboardingService.revokeAccessImmediately(dto);
  }

  /**
   * Get scheduled revocations (OFF-007 - System Admin only)
   */
  @Get('access/scheduled-revocations')
  @Roles(SystemRole.SYSTEM_ADMIN)
  async getScheduledRevocations() {
    return this.offboardingService.getScheduledRevocations();
  }

  // ============================================================
  // OFF-013: Final Settlement Endpoints
  // ============================================================

  /**
   * Get termination for settlement calculation (OFF-013)
   */
  @Get('settlement/termination/:terminationId')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getTerminationForSettlement(@Param('terminationId') terminationId: string) {
    return this.offboardingService.getTerminationForSettlement(terminationId);
  }

  /**
   * Get terminations pending settlement (OFF-013)
   */
  @Get('settlement/pending')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getTerminationsPendingSettlement() {
    return this.offboardingService.getTerminationsPendingSettlement();
  }

  /**
   * Get leave balance for settlement calculation (OFF-013)
   */
  @Get('settlement/employee/:employeeId/leave-balance')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getLeaveBalanceForSettlement(@Param('employeeId') employeeId: string) {
    return this.offboardingService.getLeaveBalanceForSettlement(employeeId);
  }

  /**
   * Get employee context for settlement (OFF-013)
   */
  @Get('settlement/employee/:employeeId/context')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getEmployeeOffboardingContext(@Param('employeeId') employeeId: string) {
    return this.offboardingService.getEmployeeOffboardingContext(employeeId);
  }

  /**
   * Get complete settlement data (OFF-013)
   */
  @Get('settlement/:terminationId/complete')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getCompleteSettlementData(@Param('terminationId') terminationId: string) {
    return this.offboardingService.getCompleteSettlementData(terminationId);
  }

  /**
   * Trigger final settlement - sends notifications to Payroll and Benefits (OFF-013)
   */
  @Post('settlement/:terminationId/trigger')
  @HttpCode(HttpStatus.OK)
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async triggerFinalSettlement(
    @Param('terminationId') terminationId: string,
    @Body() dto: TriggerFinalSettlementDto,
  ) {
    return this.offboardingService.triggerFinalSettlement(terminationId, dto);
  }
}
