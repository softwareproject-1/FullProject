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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Request } from 'express';
import { RecruitmentService, InterviewStatusService } from '../services/recruitment.service';
import { AuthenticationGuard } from '../../auth/guards/authentication.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SystemRole } from '../../employee-profile/enums/employee-profile.enums';

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
@UseGuards(AuthenticationGuard, RolesGuard)
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  // ==================== REC-003: Job Templates ====================

  @Post('templates')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async createJobTemplate(@Body() dto: CreateJobTemplateDto) {
    return this.recruitmentService.createJobTemplate(dto);
  }

  @Get('templates')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getAllJobTemplates() {
    return this.recruitmentService.getAllJobTemplates();
  }

  @Get('templates/:id')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getJobTemplateById(@Param('id') id: string) {
    return this.recruitmentService.getJobTemplateById(id);
  }

  @Patch('templates/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async updateJobTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateJobTemplateDto,
  ) {
    return this.recruitmentService.updateJobTemplate(id, dto);
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async deleteJobTemplate(@Param('id') id: string) {
    await this.recruitmentService.deleteJobTemplate(id);
  }

  // ==================== Organization Structure Integration ====================

  @Get('positions')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getAvailablePositions() {
    return this.recruitmentService.getAvailablePositions();
  }

  @Get('departments/:name/validate')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async validateDepartment(@Param('name') name: string) {
    return this.recruitmentService.validateDepartment(name);
  }

  @Get('positions/:name/validate')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async validatePosition(@Param('name') name: string) {
    return this.recruitmentService.validatePosition(name);
  }

  // ==================== REC-004: Hiring Process Stages ====================

  @Get('stages')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  getHiringStages() {
    return this.recruitmentService.getAllStagesWithProgress();
  }

  @Get('stages/:stage/progress')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  getStageProgress(@Param('stage') stage: string) {
    return this.recruitmentService.getStageProgressByName(stage);
  }

  // ==================== REC-023: Job Requisitions & Publishing ====================

  @Post('jobs')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async createJobRequisition(@Body() dto: CreateJobRequisitionDto) {
    return this.recruitmentService.createJobRequisition(dto);
  }

  @Get('jobs')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getAllJobRequisitions(@Query('status') status?: string) {
    return this.recruitmentService.getAllJobRequisitions(status);
  }

  @Get('jobs/published')
  @Roles(SystemRole.JOB_CANDIDATE, SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getPublishedJobs() {
    return this.recruitmentService.getPublishedJobs();
  }

  @Get('jobs/:id')
  @Roles(SystemRole.JOB_CANDIDATE, SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getJobRequisitionById(@Param('id') id: string) {
    return this.recruitmentService.getJobRequisitionById(id);
  }

  @Get('jobs/:id/preview')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async previewJobPosting(@Param('id') id: string) {
    return this.recruitmentService.previewJobPosting(id);
  }

  @Post('jobs/:id/publish')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async publishJob(@Param('id') id: string) {
    return this.recruitmentService.publishJob(id);
  }

  @Post('jobs/:id/close')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async closeJob(@Param('id') id: string) {
    return this.recruitmentService.closeJob(id);
  }

  @Patch('jobs/:id')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async updateJobRequisition(
    @Param('id') id: string,
    @Body() dto: UpdateJobRequisitionDto,
  ) {
    return this.recruitmentService.updateJobRequisition(id, dto);
  }

  // ==================== REC-007: Applications (Candidate only) ====================

  @Post('applications')
  @Roles(SystemRole.JOB_CANDIDATE)
  async createApplication(@Body() dto: CreateApplicationDto) {
    return this.recruitmentService.createApplication(dto);
  }

  @Get('applications')
  @Roles(SystemRole.JOB_CANDIDATE, SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
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
  @Roles(SystemRole.JOB_CANDIDATE, SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getApplicationById(@Param('id') id: string) {
    return this.recruitmentService.getApplicationById(id);
  }

  // REC-017: Candidate can view own application progress
  @Get('applications/:id/progress')
  @Roles(SystemRole.JOB_CANDIDATE)
  async getApplicationProgress(@Param('id') id: string) {
    return this.recruitmentService.getApplicationProgress(id);
  }

  // ==================== REC-008 & REC-017: Status Tracking ====================

  // REC-008: HR Employee+ can update application status
  @Patch('applications/:id/status')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async updateApplicationStatus(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.recruitmentService.updateApplicationStatus(id, dto);
  }

  // REC-017: Candidate can view own application history
  @Get('applications/:id/history')
  @Roles(SystemRole.JOB_CANDIDATE)
  async getApplicationHistory(@Param('id') id: string) {
    return this.recruitmentService.getApplicationHistory(id);
  }

  // ==================== REC-022: Rejection ====================

  @Post('applications/:id/reject')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async rejectApplication(
    @Param('id') id: string,
    @Body() body: { changedBy: string; reason?: string },
  ) {
    return this.recruitmentService.rejectApplication(id, body.changedBy, body.reason);
  }

  // ==================== REC-010, REC-021: Interviews ====================

  @Post('interviews')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async scheduleInterview(@Body() dto: ScheduleInterviewDto) {
    return this.recruitmentService.scheduleInterview(dto);
  }

  @Get('interviews')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getInterviews(@Query('applicationId') applicationId?: string) {
    if (applicationId) {
      return this.recruitmentService.getInterviewsByApplication(applicationId);
    }
    return this.recruitmentService.getAllInterviews();
  }

  @Get('interviews/:id')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getInterviewById(@Param('id') id: string) {
    return this.recruitmentService.getInterviewById(id);
  }

  @Patch('interviews/:id')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async updateInterview(
    @Param('id') id: string,
    @Body() dto: UpdateInterviewDto,
  ) {
    return this.recruitmentService.updateInterview(id, dto);
  }

  @Post('interviews/:id/cancel')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async cancelInterview(@Param('id') id: string) {
    return this.recruitmentService.cancelInterview(id);
  }

  @Post('interviews/:id/complete')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async completeInterview(@Param('id') id: string) {
    return this.recruitmentService.completeInterview(id);
  }

  @Patch('interviews/:id/panel')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async assignInterviewPanel(
    @Param('id') id: string,
    @Body() body: { panelIds: string[] },
  ) {
    return this.recruitmentService.assignInterviewPanel(id, body.panelIds);
  }

  // ==================== REC-011, REC-020: Feedback & Scoring ====================

  @Post('interviews/:id/feedback')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async submitInterviewFeedback(
    @Param('id') id: string,
    @Body() dto: SubmitFeedbackDto,
  ) {
    return this.recruitmentService.submitInterviewFeedback(id, dto);
  }

  @Get('interviews/:id/feedback')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getInterviewFeedback(@Param('id') id: string) {
    return this.recruitmentService.getInterviewFeedback(id);
  }

  @Get('interviews/:id/score')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getAverageInterviewScore(@Param('id') id: string) {
    const averageScore = await this.recruitmentService.getAverageInterviewScore(id);
    return { averageScore };
  }

  // ==================== REC-030: Referrals ====================

  @Post('referrals')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async createReferral(@Body() dto: CreateReferralDto) {
    return this.recruitmentService.createReferral(dto);
  }

  @Get('referrals/applications')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getReferralApplications(@Query('requisitionId') requisitionId?: string) {
    return this.recruitmentService.getReferralApplications(requisitionId);
  }

  @Get('applications/:id/referral')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async checkApplicationReferral(@Param('id') id: string) {
    return this.recruitmentService.isApplicationReferral(id);
  }

  @Get('candidates/:candidateId/referral')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getReferralByCandidate(@Param('candidateId') candidateId: string) {
    return this.recruitmentService.getReferralByCandidate(candidateId);
  }

  // ==================== REC-028: Consent Management (Candidate only) ====================

  @Post('applications/:id/consent')
  @Roles(SystemRole.JOB_CANDIDATE)
  async submitConsent(
    @Param('id') id: string,
    @Body() dto: Omit<SubmitConsentDto, 'applicationId'>,
  ) {
    const fullDto: SubmitConsentDto = { ...dto, applicationId: id };
    return this.recruitmentService.submitConsent(fullDto);
  }

  @Get('applications/:id/consent')
  @Roles(SystemRole.JOB_CANDIDATE)
  async getConsentByApplication(@Param('id') id: string) {
    const consent = await this.recruitmentService.getConsentByApplication(id);
    if (!consent) {
      return { message: 'No consent found for this application', consent: null };
    }
    return { consent: consent.notes ? JSON.parse(consent.notes) : null };
  }

  @Get('applications/:id/consent/verify')
  @Roles(SystemRole.JOB_CANDIDATE)
  async verifyConsent(@Param('id') id: string) {
    return this.recruitmentService.verifyConsent(id);
  }

  @Get('candidates/:candidateId/consents')
  @Roles(SystemRole.JOB_CANDIDATE)
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
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async createOffer(@Body() dto: CreateOfferDto) {
    return this.recruitmentService.createOffer(dto);
  }

  @Get('offers')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN, SystemRole.JOB_CANDIDATE)
  async getAllOffers() {
    return this.recruitmentService.getAllOffers();
  }

  @Get('offers/:id')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN, SystemRole.JOB_CANDIDATE)
  async getOfferById(@Param('id') id: string) {
    return this.recruitmentService.getOfferById(id);
  }

  @Get('applications/:applicationId/offer')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getOfferByApplication(@Param('applicationId') applicationId: string) {
    const offer = await this.recruitmentService.getOfferByApplication(applicationId);
    if (!offer) {
      return { message: 'No offer found for this application', offer: null };
    }
    return offer;
  }

  @Patch('offers/:id')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async updateOffer(
    @Param('id') id: string,
    @Body() dto: UpdateOfferDto,
  ) {
    return this.recruitmentService.updateOffer(id, dto);
  }

  @Post('offers/:id/approve')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async approveOffer(
    @Param('id') id: string,
    @Body() dto: ApproveOfferDto,
  ) {
    return this.recruitmentService.approveOfferStep(id, dto);
  }

  @Get('offers/:id/approval-status')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getOfferApprovalStatus(@Param('id') id: string) {
    return this.recruitmentService.getOfferApprovalStatus(id);
  }

  // ==================== REC-018: E-signed Offer Letters ====================

  @Post('offers/:id/respond')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN, SystemRole.JOB_CANDIDATE)
  async respondToOffer(
    @Param('id') id: string,
    @Body() dto: RespondToOfferDto,
  ) {
    return this.recruitmentService.respondToOffer(id, dto);
  }

  @Post('offers/:id/sign')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN, SystemRole.JOB_CANDIDATE)
  async signOffer(
    @Param('id') id: string,
    @Body() dto: SignOfferDto,
  ) {
    return this.recruitmentService.signOffer(id, dto);
  }

  @Get('offers/:id/signature-status')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN, SystemRole.JOB_CANDIDATE)
  async getOfferSignatureStatus(@Param('id') id: string) {
    return this.recruitmentService.getOfferSignatureStatus(id);
  }

  // ==================== REC-029: Contracts & Onboarding ====================

  @Post('contracts')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async createContract(@Body() body: { offerId: string }) {
    return this.recruitmentService.createContract(body.offerId);
  }

  @Get('contracts')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getAllContracts() {
    return this.recruitmentService.getAllContracts();
  }

  @Get('contracts/:id')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getContractById(@Param('id') id: string) {
    return this.recruitmentService.getContractById(id);
  }

  @Get('offers/:offerId/contract')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getContractByOffer(@Param('offerId') offerId: string) {
    const contract = await this.recruitmentService.getContractByOffer(offerId);
    if (!contract) {
      return { message: 'No contract found for this offer', contract: null };
    }
    return contract;
  }

  // ==================== Document Upload (REC-007 - Candidate only) ====================

  @Post('documents/upload')
  @Roles(SystemRole.JOB_CANDIDATE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/resumes',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `cv-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Allow only PDF, DOC, DOCX files
        const allowedMimes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF, DOC, and DOCX files are allowed'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadCV(
    @UploadedFile() file: any,
    @Body('candidateId') candidateId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!candidateId) {
      throw new BadRequestException('candidateId is required');
    }

    // Save document record to database
    const document = await this.recruitmentService.uploadCVDocument(
      candidateId,
      file.path,
    );

    return {
      message: 'CV uploaded successfully',
      document: {
        _id: document._id,
        filePath: document.filePath,
        uploadedAt: document.uploadedAt,
        type: document.type,
      },
      // Return the URL that can be used as resumeUrl in application
      resumeUrl: document.filePath,
    };
  }

  @Get('documents/candidate/:candidateId')
  @Roles(SystemRole.JOB_CANDIDATE)
  async getCandidateDocuments(@Param('candidateId') candidateId: string) {
    return this.recruitmentService.getCandidateDocuments(candidateId);
  }

  // ==================== REC-009: Analytics ====================

  @Get('analytics/progress/:requisitionId')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getRecruitmentProgress(@Param('requisitionId') requisitionId: string) {
    return this.recruitmentService.getRecruitmentProgress(requisitionId);
  }

  @Get('analytics/progress')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getAllRequisitionsProgress() {
    return this.recruitmentService.getAllRequisitionsProgress();
  }
}

@Controller('interview-status')
@UseGuards(AuthenticationGuard, RolesGuard)
export class InterviewStatusController {
  constructor(private readonly interviewStatusService: InterviewStatusService) {}

  @Get(':employeeId')
  @Roles(SystemRole.HR_EMPLOYEE, SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN)
  async getStatus(@Param('employeeId') employeeId: string) {
    return this.interviewStatusService.getInterviewerStatus(employeeId);
  }
}
