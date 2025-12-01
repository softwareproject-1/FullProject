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
} from '@nestjs/common';
import { OffboardingService } from './offboarding.service';
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
} from './dto/offboarding.dto';

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
export class OffboardingController {
  constructor(private readonly offboardingService: OffboardingService) {}

  // ============================================================
  // OFF-001: Termination Review Endpoints
  // ============================================================

  /**
   * Initiate termination review (HR/Manager)
   */
  @Post('termination/review')
  @HttpCode(HttpStatus.CREATED)
  async initiateTerminationReview(@Body() dto: InitiateTerminationReviewDto) {
    return this.offboardingService.initiateTerminationReview(dto);
  }

  /**
   * Update termination status
   */
  @Patch('termination/:terminationId/status')
  async updateTerminationStatus(
    @Param('terminationId') terminationId: string,
    @Body() dto: UpdateTerminationStatusDto,
  ) {
    return this.offboardingService.updateTerminationStatus(terminationId, dto);
  }

  /**
   * Get termination by ID
   */
  @Get('termination/:terminationId')
  async getTerminationRequest(@Param('terminationId') terminationId: string) {
    return this.offboardingService.getTerminationRequest(terminationId);
  }

  /**
   * Get terminations by employee
   */
  @Get('termination/employee/:employeeId')
  async getTerminationsByEmployee(@Param('employeeId') employeeId: string) {
    return this.offboardingService.getTerminationsByEmployee(employeeId);
  }

  /**
   * Get pending terminations
   */
  @Get('termination/pending')
  async getPendingTerminations() {
    return this.offboardingService.getPendingTerminations();
  }

  /**
   * Get employee performance data for termination review (OFF-001)
   * Returns latest appraisal data to help HR make informed termination decisions
   */
  @Get('termination/employee/:employeeId/performance')
  async getEmployeePerformanceData(@Param('employeeId') employeeId: string) {
    return this.offboardingService.getEmployeePerformanceData(employeeId);
  }

  // ============================================================
  // OFF-018/019: Resignation Endpoints
  // ============================================================

  /**
   * Create resignation request (Employee)
   */
  @Post('resignation')
  @HttpCode(HttpStatus.CREATED)
  async createResignationRequest(@Body() dto: CreateResignationRequestDto) {
    return this.offboardingService.createResignationRequest(dto);
  }

  /**
   * Get resignation status (Employee)
   */
  @Get('resignation/:resignationId')
  async getResignationStatus(
    @Param('resignationId') resignationId: string,
    @Query('employeeId') employeeId: string,
  ) {
    return this.offboardingService.getResignationStatus(resignationId, employeeId);
  }

  /**
   * Get all my resignations (Employee)
   */
  @Get('resignation/my')
  async getMyResignations(@Query('employeeId') employeeId: string) {
    return this.offboardingService.getMyResignations(employeeId);
  }

  /**
   * Review resignation (HR)
   */
  @Patch('resignation/:resignationId/review')
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
   * Create offboarding checklist
   */
  @Post('checklist')
  @HttpCode(HttpStatus.CREATED)
  async createOffboardingChecklist(@Body() dto: CreateOffboardingChecklistDto) {
    return this.offboardingService.createOffboardingChecklist(dto);
  }

  /**
   * Add equipment to checklist
   */
  @Post('checklist/:checklistId/equipment')
  async addEquipmentToChecklist(
    @Param('checklistId') checklistId: string,
    @Body() dto: AddEquipmentToChecklistDto,
  ) {
    return this.offboardingService.addEquipmentToChecklist(checklistId, dto);
  }

  /**
   * Get checklist by termination
   */
  @Get('checklist/termination/:terminationId')
  async getChecklistByTermination(@Param('terminationId') terminationId: string) {
    return this.offboardingService.getChecklistByTermination(terminationId);
  }

  // ============================================================
  // OFF-010: Department Clearance Sign-off Endpoints
  // ============================================================

  /**
   * Department sign-off
   */
  @Patch('checklist/:checklistId/signoff')
  async departmentSignOff(
    @Param('checklistId') checklistId: string,
    @Body() dto: DepartmentSignOffDto,
    @Query('userId') userId: string,
  ) {
    return this.offboardingService.departmentSignOff(checklistId, userId, dto);
  }

  /**
   * Update equipment return
   */
  @Patch('checklist/:checklistId/equipment')
  async updateEquipmentReturn(
    @Param('checklistId') checklistId: string,
    @Body() dto: UpdateEquipmentReturnDto,
  ) {
    return this.offboardingService.updateEquipmentReturn(checklistId, dto);
  }

  /**
   * Update access card return
   */
  @Patch('checklist/:checklistId/access-card')
  async updateAccessCardReturn(
    @Param('checklistId') checklistId: string,
    @Body() dto: UpdateAccessCardReturnDto,
  ) {
    return this.offboardingService.updateAccessCardReturn(checklistId, dto);
  }

  /**
   * Check if clearance complete
   */
  @Get('checklist/:checklistId/complete')
  async isClearanceComplete(@Param('checklistId') checklistId: string) {
    const isComplete = await this.offboardingService.isClearanceComplete(checklistId);
    return { isComplete };
  }

  // ============================================================
  // OFF-007: Access Revocation Endpoints
  // ============================================================

  /**
   * Schedule access revocation
   */
  @Post('access/schedule-revocation')
  async scheduleAccessRevocation(@Body() dto: ScheduleAccessRevocationDto) {
    return this.offboardingService.scheduleAccessRevocation(dto);
  }

  /**
   * Immediately revoke all access (OFF-007)
   * For urgent terminations or security concerns
   */
  @Post('access/revoke-immediate')
  @HttpCode(HttpStatus.OK)
  async revokeAccessImmediately(@Body() dto: RevokeAccessImmediatelyDto) {
    return this.offboardingService.revokeAccessImmediately(dto);
  }

  /**
   * Get scheduled revocations
   */
  @Get('access/scheduled-revocations')
  async getScheduledRevocations() {
    return this.offboardingService.getScheduledRevocations();
  }

  // ============================================================
  // OFF-013: Final Settlement Endpoints
  // ============================================================

  /**
   * Get termination for settlement calculation
   */
  @Get('settlement/termination/:terminationId')
  async getTerminationForSettlement(@Param('terminationId') terminationId: string) {
    return this.offboardingService.getTerminationForSettlement(terminationId);
  }

  /**
   * Get terminations pending settlement
   */
  @Get('settlement/pending')
  async getTerminationsPendingSettlement() {
    return this.offboardingService.getTerminationsPendingSettlement();
  }

  /**
   * Get leave balance for settlement calculation (OFF-013)
   */
  @Get('settlement/employee/:employeeId/leave-balance')
  async getLeaveBalanceForSettlement(@Param('employeeId') employeeId: string) {
    return this.offboardingService.getLeaveBalanceForSettlement(employeeId);
  }

  /**
   * Get employee context for settlement (banking, tenure info)
   */
  @Get('settlement/employee/:employeeId/context')
  async getEmployeeOffboardingContext(@Param('employeeId') employeeId: string) {
    return this.offboardingService.getEmployeeOffboardingContext(employeeId);
  }

  /**
   * Get complete settlement data (OFF-013)
   */
  @Get('settlement/:terminationId/complete')
  async getCompleteSettlementData(@Param('terminationId') terminationId: string) {
    return this.offboardingService.getCompleteSettlementData(terminationId);
  }

  /**
   * Trigger final settlement - sends notifications to Payroll and Benefits (OFF-013)
   */
  @Post('settlement/:terminationId/trigger')
  @HttpCode(HttpStatus.OK)
  async triggerFinalSettlement(
    @Param('terminationId') terminationId: string,
    @Body() dto: TriggerFinalSettlementDto,
  ) {
    return this.offboardingService.triggerFinalSettlement(terminationId, dto);
  }
}
