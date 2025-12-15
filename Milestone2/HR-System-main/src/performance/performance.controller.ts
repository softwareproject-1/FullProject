import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { CreateAppraisalTemplateDto } from './dtos/create-appraisal-template.dto';
import { UpdateAppraisalTemplateDto } from './dtos/update-appraisal-template.dto';
import { CreateAppraisalCycleDto } from './dtos/create-appraisal-cycle.dto';
import { UpdateAppraisalCycleDto } from './dtos/update-appraisal-cycle.dto';
import { CreateAppraisalAssignmentsDto } from './dtos/create-appraisal-assignment.dto';
import { CreateAppraisalRecordDto } from './dtos/create-appraisal-record.dto';
import { PublishAppraisalRecordDto } from './dtos/publish-appraisal-record.dto';
import { AcknowledgeAppraisalRecordDto } from './dtos/acknowledge-appraisal-record.dto';
import { CreateAppraisalDisputeDto } from './dtos/create-appraisal-dispute.dto';
import { ResolveAppraisalDisputeDto } from './dtos/resolve-appraisal-dispute.dto';
import { AppraisalCycleStatus, AppraisalAssignmentStatus } from './enums/performance.enums';

@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  // Templates

  @Post('templates')
  createTemplate(@Body() dto: CreateAppraisalTemplateDto) {
    return this.performanceService.createTemplate(dto);
  }

  @Get('templates')
  listTemplates() {
    return this.performanceService.listTemplates();
  }

  @Get('templates/:id')
  getTemplate(@Param('id') id: string) {
    return this.performanceService.getTemplate(id);
  }

  @Patch('templates/:id')
  updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateAppraisalTemplateDto,
  ) {
    return this.performanceService.updateTemplate(id, dto);
  }

  // DELETE template (should be HR-only when auth is added)
  @Patch('templates/:id/delete')
  deleteTemplate(@Param('id') id: string) {
    return this.performanceService.deleteTemplate(id);
  }

  // Cycles

  @Post('cycles')
  createCycle(@Body() dto: CreateAppraisalCycleDto) {
    return this.performanceService.createCycle(dto);
  }

  @Get('cycles')
  listCycles() {
    return this.performanceService.listCycles();
  }

  @Get('cycles/:id')
  getCycle(@Param('id') id: string) {
    return this.performanceService.getCycle(id);
  }

  @Patch('cycles/:id')
  updateCycle(
    @Param('id') id: string,
    @Body() dto: UpdateAppraisalCycleDto,
  ) {
    return this.performanceService.updateCycle(id, dto);
  }

  @Patch('cycles/:id/status/:status')
  setCycleStatus(
    @Param('id') id: string,
    @Param('status') status: AppraisalCycleStatus,
  ) {
    return this.performanceService.setCycleStatus(id, status);
  }

  @Patch('cycles/:id/archive')
  archiveCycle(@Param('id') id: string) {
    return this.performanceService.archiveCycle(id);
  }

  // DELETE cycle (should be HR-only when auth is added)
  @Patch('cycles/:id/delete')
  deleteCycle(@Param('id') id: string) {
    return this.performanceService.deleteCycle(id);
  }

  // Assignments

  @Post('assignments')
  createAssignments(@Body() dto: CreateAppraisalAssignmentsDto) {
    return this.performanceService.createAssignments(dto);
  }

  @Get('cycles/:cycleId/assignments')
  listAssignmentsByCycle(@Param('cycleId') cycleId: string) {
    return this.performanceService.listAssignmentsByCycle(cycleId);
  }

  @Get('assignments/:id')
  getAssignment(@Param('id') id: string) {
    return this.performanceService.getAssignment(id);
  }

  // DELETE assignment (HR / Admin)
  @Patch('assignments/:id/delete')
  deleteAssignment(@Param('id') id: string) {
    return this.performanceService.deleteAssignment(id);
  }

  // UPDATE assignment status (HR / Admin)
  @Patch('assignments/:id/status/:status')
  updateAssignmentStatus(
    @Param('id') id: string,
    @Param('status') status: AppraisalAssignmentStatus,
  ) {
    return this.performanceService.updateAssignmentStatus(id, status);
  }

  // Records

  @Post('assignments/:assignmentId/records')
  createOrUpdateRecord(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: CreateAppraisalRecordDto,
  ) {
    return this.performanceService.createOrUpdateRecord(assignmentId, dto);
  }

  @Get('cycles/:cycleId/records')
  listRecordsByCycle(@Param('cycleId') cycleId: string) {
    return this.performanceService.listRecordsByCycle(cycleId);
  }

  @Get('records/:id')
  getRecord(@Param('id') id: string) {
    return this.performanceService.getRecord(id);
  }

  @Patch('records/:id/publish')
  publishRecord(
    @Param('id') id: string,
    @Body() dto: PublishAppraisalRecordDto,
  ) {
    return this.performanceService.publishRecord(id, dto);
  }

  @Patch('records/:id/acknowledge')
  acknowledgeRecord(
    @Param('id') id: string,
    @Body() dto: AcknowledgeAppraisalRecordDto,
  ) {
    return this.performanceService.acknowledgeRecord(id, dto);
  }

  // DELETE record (HR / Admin)
  @Patch('records/:id/delete')
  deleteRecord(@Param('id') id: string) {
    return this.performanceService.deleteRecord(id);
  }

  // Disputes

  @Post('disputes')
  createDispute(@Body() dto: CreateAppraisalDisputeDto) {
    return this.performanceService.createDispute(dto);
  }

  @Get('cycles/:cycleId/disputes')
  listDisputesByCycle(@Param('cycleId') cycleId: string) {
    return this.performanceService.listDisputesByCycle(cycleId);
  }

  @Get('disputes/:id')
  getDispute(@Param('id') id: string) {
    return this.performanceService.getDispute(id);
  }

  @Patch('disputes/:id/resolve')
  resolveDispute(
    @Param('id') id: string,
    @Body() dto: ResolveAppraisalDisputeDto,
  ) {
    return this.performanceService.resolveDispute(id, dto);
  }
}
