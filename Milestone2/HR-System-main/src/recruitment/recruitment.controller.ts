import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RecruitmentService, InterviewStatusService } from '../services/recruitment.service';

// DTOs
import {
  CreateJobTemplateDto,
  UpdateJobTemplateDto,
  CreateJobRequisitionDto,
  UpdateJobRequisitionDto,
  CreateApplicationDto,
  UpdateApplicationStatusDto,
  ScheduleInterviewDto,
  UpdateInterviewDto,
  SubmitFeedbackDto,
  CreateReferralDto,
  SubmitConsentDto,
  CreateOfferDto,
  UpdateOfferDto,
  ApproveOfferDto,
  RespondToOfferDto,
  SignOfferDto,
} from '../dto';

@Controller('recruitment')
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  // ==================== REC-003: Job Templates ====================

  @Post('templates')
  async createJobTemplate(@Body() dto: CreateJobTemplateDto) {
    return this.recruitmentService.createJobTemplate(dto);
  }

  @Get('templates')
  async getAllJobTemplates() {
    return this.recruitmentService.getAllJobTemplates();
  }

  @Get('templates/:id')
  async getJobTemplateById(@Param('id') id: string) {
    return this.recruitmentService.getJobTemplateById(id);
  }

  @Patch('templates/:id')
  async updateJobTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateJobTemplateDto,
  ) {
    return this.recruitmentService.updateJobTemplate(id, dto);
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteJobTemplate(@Param('id') id: string) {
    await this.recruitmentService.deleteJobTemplate(id);
  }

  // ==================== Organization Structure Integration ====================

  @Get('positions')
  async getAvailablePositions() {
    return this.recruitmentService.getAvailablePositions();
  }

  @Get('departments/:name/validate')
  async validateDepartment(@Param('name') name: string) {
    return this.recruitmentService.validateDepartment(name);
  }

  @Get('positions/:name/validate')
  async validatePosition(@Param('name') name: string) {
    return this.recruitmentService.validatePosition(name);
  }

  // ==================== REC-004: Hiring Process Stages ====================

  @Get('stages')
  getHiringStages() {
    return this.recruitmentService.getAllStagesWithProgress();
  }

  @Get('stages/:stage/progress')
  getStageProgress(@Param('stage') stage: string) {
    return this.recruitmentService.getStageProgressByName(stage);
  }

  // ==================== REC-023: Job Requisitions & Publishing ====================

  @Post('jobs')
  async createJobRequisition(@Body() dto: CreateJobRequisitionDto) {
    return this.recruitmentService.createJobRequisition(dto);
  }

  @Get('jobs')
  async getAllJobRequisitions(@Query('status') status?: string) {
    return this.recruitmentService.getAllJobRequisitions(status);
  }

  @Get('jobs/published')
  async getPublishedJobs() {
    return this.recruitmentService.getPublishedJobs();
  }

  @Get('jobs/:id')
  async getJobRequisitionById(@Param('id') id: string) {
    return this.recruitmentService.getJobRequisitionById(id);
  }

  @Get('jobs/:id/preview')
  async previewJobPosting(@Param('id') id: string) {
    return this.recruitmentService.previewJobPosting(id);
  }

  @Post('jobs/:id/publish')
  async publishJob(@Param('id') id: string) {
    return this.recruitmentService.publishJob(id);
  }

  @Post('jobs/:id/close')
  async closeJob(@Param('id') id: string) {
    return this.recruitmentService.closeJob(id);
  }

  @Patch('jobs/:id')
  async updateJobRequisition(
    @Param('id') id: string,
    @Body() dto: UpdateJobRequisitionDto,
  ) {
    const requisition = await this.recruitmentService.getJobRequisitionById(id);
    Object.assign(requisition, dto);
    return requisition.save();
  }

  // ==================== REC-007: Applications ====================

  @Post('applications')
  async createApplication(@Body() dto: CreateApplicationDto) {
    return this.recruitmentService.createApplication(dto);
  }

  @Get('applications')
  async getApplications(
    @Query('requisitionId') requisitionId?: string,
    @Query('candidateId') candidateId?: string,
  ) {
    if (requisitionId) {
      return this.recruitmentService.getApplicationsByRequisition(requisitionId);
    }
    if (candidateId) {
      return this.recruitmentService.getApplicationsByCandidate(candidateId);
    }
    return this.recruitmentService.getAllApplications();
  }

  @Get('applications/:id')
  async getApplicationById(@Param('id') id: string) {
    return this.recruitmentService.getApplicationById(id);
  }

  @Get('applications/:id/progress')
  async getApplicationProgress(@Param('id') id: string) {
    return this.recruitmentService.getApplicationProgress(id);
  }

  // ==================== REC-008 & REC-017: Status Tracking ====================

  @Patch('applications/:id/status')
  async updateApplicationStatus(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.recruitmentService.updateApplicationStatus(id, dto);
  }

  @Get('applications/:id/history')
  async getApplicationHistory(@Param('id') id: string) {
    return this.recruitmentService.getApplicationHistory(id);
  }

  // ==================== REC-022: Rejection ====================

  @Post('applications/:id/reject')
  async rejectApplication(
    @Param('id') id: string,
    @Body() body: { changedBy: string; reason?: string },
  ) {
    return this.recruitmentService.rejectApplication(id, body.changedBy, body.reason);
  }

  // ==================== REC-010, REC-021: Interviews ====================

  @Post('interviews')
  async scheduleInterview(@Body() dto: ScheduleInterviewDto) {
    return this.recruitmentService.scheduleInterview(dto);
  }

  @Get('interviews')
  async getInterviews(@Query('applicationId') applicationId?: string) {
    if (applicationId) {
      return this.recruitmentService.getInterviewsByApplication(applicationId);
    }
    return this.recruitmentService.getAllInterviews();
  }

  @Get('interviews/:id')
  async getInterviewById(@Param('id') id: string) {
    return this.recruitmentService.getInterviewById(id);
  }

  @Patch('interviews/:id')
  async updateInterview(
    @Param('id') id: string,
    @Body() dto: UpdateInterviewDto,
  ) {
    return this.recruitmentService.updateInterview(id, dto);
  }

  @Post('interviews/:id/cancel')
  async cancelInterview(@Param('id') id: string) {
    return this.recruitmentService.cancelInterview(id);
  }

  @Post('interviews/:id/complete')
  async completeInterview(@Param('id') id: string) {
    return this.recruitmentService.completeInterview(id);
  }

  @Patch('interviews/:id/panel')
  async assignInterviewPanel(
    @Param('id') id: string,
    @Body() body: { panelIds: string[] },
  ) {
    return this.recruitmentService.assignInterviewPanel(id, body.panelIds);
  }

  // ==================== REC-011, REC-020: Feedback & Scoring ====================

  @Post('interviews/:id/feedback')
  async submitInterviewFeedback(
    @Param('id') id: string,
    @Body() dto: SubmitFeedbackDto,
  ) {
    return this.recruitmentService.submitInterviewFeedback(id, dto);
  }

  @Get('interviews/:id/feedback')
  async getInterviewFeedback(@Param('id') id: string) {
    return this.recruitmentService.getInterviewFeedback(id);
  }

  @Get('interviews/:id/score')
  async getAverageInterviewScore(@Param('id') id: string) {
    const averageScore = await this.recruitmentService.getAverageInterviewScore(id);
    return { averageScore };
  }

  // ==================== REC-030: Referrals ====================

  @Post('referrals')
  async createReferral(@Body() dto: CreateReferralDto) {
    return this.recruitmentService.createReferral(dto);
  }

  @Get('referrals/applications')
  async getReferralApplications(@Query('requisitionId') requisitionId?: string) {
    return this.recruitmentService.getReferralApplications(requisitionId);
  }

  @Get('applications/:id/referral')
  async checkApplicationReferral(@Param('id') id: string) {
    return this.recruitmentService.isApplicationReferral(id);
  }

  @Get('candidates/:candidateId/referral')
  async getReferralByCandidate(@Param('candidateId') candidateId: string) {
    return this.recruitmentService.getReferralByCandidate(candidateId);
  }

  // ==================== REC-028: Consent Management ====================

  @Post('applications/:id/consent')
  async submitConsent(
    @Param('id') id: string,
    @Body() dto: Omit<SubmitConsentDto, 'applicationId'>,
  ) {
    const fullDto: SubmitConsentDto = { ...dto, applicationId: id };
    return this.recruitmentService.submitConsent(fullDto);
  }

  @Get('applications/:id/consent')
  async getConsentByApplication(@Param('id') id: string) {
    const consent = await this.recruitmentService.getConsentByApplication(id);
    if (!consent) {
      return { message: 'No consent found for this application', consent: null };
    }
    return { consent: consent.notes ? JSON.parse(consent.notes) : null };
  }

  @Get('applications/:id/consent/verify')
  async verifyConsent(@Param('id') id: string) {
    return this.recruitmentService.verifyConsent(id);
  }

  @Get('candidates/:candidateId/consents')
  async getConsentsByCandidate(@Param('candidateId') candidateId: string) {
    const consents = await this.recruitmentService.getConsentByCandidate(candidateId);
    return {
      count: consents.length,
      consents: consents.map((c) => ({
        applicationId: c.applicationId,
        data: c.notes ? JSON.parse(c.notes) : null,
        createdAt: (c as any).createdAt,
      })),
    };
  }

  // ==================== REC-014: Offer Management & Approval ====================

  @Post('offers')
  async createOffer(@Body() dto: CreateOfferDto) {
    return this.recruitmentService.createOffer(dto);
  }

  @Get('offers')
  async getAllOffers() {
    return this.recruitmentService.getAllOffers();
  }

  @Get('offers/:id')
  async getOfferById(@Param('id') id: string) {
    return this.recruitmentService.getOfferById(id);
  }

  @Get('applications/:applicationId/offer')
  async getOfferByApplication(@Param('applicationId') applicationId: string) {
    const offer = await this.recruitmentService.getOfferByApplication(applicationId);
    if (!offer) {
      return { message: 'No offer found for this application', offer: null };
    }
    return offer;
  }

  @Patch('offers/:id')
  async updateOffer(
    @Param('id') id: string,
    @Body() dto: UpdateOfferDto,
  ) {
    return this.recruitmentService.updateOffer(id, dto);
  }

  @Post('offers/:id/approve')
  async approveOffer(
    @Param('id') id: string,
    @Body() dto: ApproveOfferDto,
  ) {
    return this.recruitmentService.approveOfferStep(id, dto);
  }

  @Get('offers/:id/approval-status')
  async getOfferApprovalStatus(@Param('id') id: string) {
    return this.recruitmentService.getOfferApprovalStatus(id);
  }

  // ==================== REC-018: E-signed Offer Letters ====================

  @Post('offers/:id/respond')
  async respondToOffer(
    @Param('id') id: string,
    @Body() dto: RespondToOfferDto,
  ) {
    return this.recruitmentService.respondToOffer(id, dto);
  }

  @Post('offers/:id/sign')
  async signOffer(
    @Param('id') id: string,
    @Body() dto: SignOfferDto,
  ) {
    return this.recruitmentService.signOffer(id, dto);
  }

  @Get('offers/:id/signature-status')
  async getOfferSignatureStatus(@Param('id') id: string) {
    return this.recruitmentService.getOfferSignatureStatus(id);
  }

  // ==================== REC-029: Contracts & Onboarding ====================

  @Post('contracts')
  async createContract(@Body() body: { offerId: string }) {
    return this.recruitmentService.createContract(body.offerId);
  }

  @Get('contracts')
  async getAllContracts() {
    return this.recruitmentService.getAllContracts();
  }

  @Get('contracts/:id')
  async getContractById(@Param('id') id: string) {
    return this.recruitmentService.getContractById(id);
  }

  @Get('offers/:offerId/contract')
  async getContractByOffer(@Param('offerId') offerId: string) {
    const contract = await this.recruitmentService.getContractByOffer(offerId);
    if (!contract) {
      return { message: 'No contract found for this offer', contract: null };
    }
    return contract;
  }

  // ==================== REC-009: Analytics ====================

  @Get('analytics/progress/:requisitionId')
  async getRecruitmentProgress(@Param('requisitionId') requisitionId: string) {
    return this.recruitmentService.getRecruitmentProgress(requisitionId);
  }

  @Get('analytics/progress')
  async getAllRequisitionsProgress() {
    return this.recruitmentService.getAllRequisitionsProgress();
  }
}

@Controller('interview-status')
export class InterviewStatusController {
  constructor(private readonly interviewStatusService: InterviewStatusService) {}

  @Get(':employeeId')
  async getStatus(@Param('employeeId') employeeId: string) {
    return this.interviewStatusService.getInterviewerStatus(employeeId);
  }
}
