import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// Models
import { JobTemplate, JobTemplateDocument } from '../models/job-template.schema';
import { JobRequisition, JobRequisitionDocument } from '../models/job-requisition.schema';
import { Application, ApplicationDocument } from '../models/application.schema';
import { ApplicationStatusHistory, ApplicationStatusHistoryDocument } from '../models/application-history.schema';
import { Interview, InterviewDocument } from '../models/interview.schema';
import { AssessmentResult, AssessmentResultDocument } from '../models/assessment-result.schema';
import { Referral, ReferralDocument } from '../models/referral.schema';
import { Offer, OfferDocument } from '../models/offer.schema';
import { Contract, ContractDocument } from '../models/contract.schema';
import { EmployeeProfile } from '../../employee-profile/models/employee-profile.schema';
import { ShiftAssignment } from '../../time-management/models/shift-assignment.schema';
import { Shift } from '../../time-management/models/shift.schema';
import { NotificationLog, NotificationLogDocument } from '../../time-management/models/notification-log.schema';

// Enums
import { ApplicationStage } from '../enums/application-stage.enum';
import { ApplicationStatus } from '../enums/application-status.enum';
import { InterviewStatus } from '../enums/interview-status.enum';
import { ApprovalStatus } from '../enums/approval-status.enum';
import { OfferFinalStatus } from '../enums/offer-final-status.enum';
import { OfferResponseStatus } from '../enums/offer-response-status.enum';

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

// Cross-team services (to be implemented by respective teams)
import { OrganizationStructureService } from '../../organization-structure/organization-structure.service';

// Internal services
import { OnboardingService } from './onboarding.service';

@Injectable()
export class RecruitmentService {
  // Progress percentage mapping for REC-004 (Hiring Process Stages)
  private readonly stageProgressMap: Record<ApplicationStage, number> = {
    [ApplicationStage.SCREENING]: 25,
    [ApplicationStage.DEPARTMENT_INTERVIEW]: 50,
    [ApplicationStage.HR_INTERVIEW]: 75,
    [ApplicationStage.OFFER]: 100,
  };

  // Stage name mapping for flexible lookup
  private readonly stageNameMapping: Record<string, ApplicationStage> = {
    'screening': ApplicationStage.SCREENING,
    'interview': ApplicationStage.DEPARTMENT_INTERVIEW,
    'department_interview': ApplicationStage.DEPARTMENT_INTERVIEW,
    'department-interview': ApplicationStage.DEPARTMENT_INTERVIEW,
    'hr_interview': ApplicationStage.HR_INTERVIEW,
    'hr-interview': ApplicationStage.HR_INTERVIEW,
    'offer': ApplicationStage.OFFER,
  };

  constructor(
    @InjectModel(JobTemplate.name) private jobTemplateModel: Model<JobTemplateDocument>,
    @InjectModel(JobRequisition.name) private jobRequisitionModel: Model<JobRequisitionDocument>,
    @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>,
    @InjectModel(ApplicationStatusHistory.name) private applicationHistoryModel: Model<ApplicationStatusHistoryDocument>,
    @InjectModel(Interview.name) private interviewModel: Model<InterviewDocument>,
    @InjectModel(AssessmentResult.name) private assessmentResultModel: Model<AssessmentResultDocument>,
    @InjectModel(Referral.name) private referralModel: Model<ReferralDocument>,
    @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
    @InjectModel(Contract.name) private contractModel: Model<ContractDocument>,
    @InjectModel(NotificationLog.name) private notificationLogModel: Model<NotificationLogDocument>,
    private readonly organizationStructureService: OrganizationStructureService,
    private readonly onboardingService: OnboardingService,
  ) {}

  // ==================== REC-003: Job Description Templates ====================

  async createJobTemplate(dto: CreateJobTemplateDto): Promise<JobTemplateDocument> {
    // Validate department exists in Organization Structure (REC-003 input from OS)
    const departmentValidation = await this.validateDepartment(dto.department);
    if (!departmentValidation.valid) {
      throw new BadRequestException(`Department '${dto.department}' not found in organization structure`);
    }

    const template = new this.jobTemplateModel(dto);
    return template.save();
  }

  async getAllJobTemplates(): Promise<JobTemplateDocument[]> {
    return this.jobTemplateModel.find().exec();
  }

  async getJobTemplateById(id: string): Promise<JobTemplateDocument> {
    const template = await this.jobTemplateModel.findById(id).exec();
    if (!template) {
      throw new NotFoundException(`Job template with ID ${id} not found`);
    }
    return template;
  }

  async updateJobTemplate(id: string, dto: UpdateJobTemplateDto): Promise<JobTemplateDocument> {
    const template = await this.jobTemplateModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!template) {
      throw new NotFoundException(`Job template with ID ${id} not found`);
    }
    return template;
  }

  async deleteJobTemplate(id: string): Promise<void> {
    const result = await this.jobTemplateModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Job template with ID ${id} not found`);
    }
  }

  // ==================== REC-004: Hiring Process Stages ====================

  getStageProgress(stage: ApplicationStage): number {
    return this.stageProgressMap[stage] || 0;
  }

  getStageProgressByName(stageName: string): { stage: string; progress: number; mappedTo: ApplicationStage } {
    const normalizedName = stageName.toLowerCase().trim();
    const mappedStage = this.stageNameMapping[normalizedName];
    
    if (!mappedStage) {
      const validStages = Object.keys(this.stageNameMapping).join(', ');
      throw new NotFoundException(
        `Stage '${stageName}' not found. Valid stages: ${validStages}`
      );
    }
    
    return {
      stage: stageName,
      progress: this.stageProgressMap[mappedStage],
      mappedTo: mappedStage,
    };
  }

  getAllStagesWithProgress(): Array<{ stage: ApplicationStage; progress: number; order: number }> {
    const orderedStages = [
      ApplicationStage.SCREENING,
      ApplicationStage.DEPARTMENT_INTERVIEW,
      ApplicationStage.HR_INTERVIEW,
      ApplicationStage.OFFER,
    ];

    return orderedStages.map((stage, index) => ({
      stage,
      progress: this.stageProgressMap[stage],
      order: index + 1,
    }));
  }

  // ==================== REC-023: Job Requisition & Publishing ====================

  async createJobRequisition(dto: CreateJobRequisitionDto): Promise<JobRequisitionDocument> {
    const requisition = new this.jobRequisitionModel({
      ...dto,
      templateId: dto.templateId ? new Types.ObjectId(dto.templateId) : undefined,
      hiringManagerId: new Types.ObjectId(dto.hiringManagerId),
      publishStatus: 'draft',
    });
    return requisition.save();
  }

  async getAllJobRequisitions(status?: string): Promise<JobRequisitionDocument[]> {
    const filter = status ? { publishStatus: status } : {};
    return this.jobRequisitionModel.find(filter).populate('templateId').exec();
  }

  async getJobRequisitionById(id: string): Promise<JobRequisitionDocument> {
    const requisition = await this.jobRequisitionModel
      .findById(id)
      .populate('templateId')
      .exec();
    if (!requisition) {
      throw new NotFoundException(`Job requisition with ID ${id} not found`);
    }
    return requisition;
  }

  async updateJobRequisition(id: string, dto: UpdateJobRequisitionDto): Promise<JobRequisitionDocument> {
    const requisition = await this.jobRequisitionModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!requisition) {
      throw new NotFoundException(`Job requisition with ID ${id} not found`);
    }
    return requisition;
  }

  async previewJobPosting(id: string): Promise<{ requisition: JobRequisitionDocument; template: JobTemplateDocument | null }> {
    const requisition = await this.getJobRequisitionById(id);
    let template: JobTemplateDocument | null = null;
    
    if (requisition.templateId) {
      template = await this.jobTemplateModel.findById(requisition.templateId).exec();
    }
    
    return { requisition, template };
  }

  async publishJob(id: string): Promise<JobRequisitionDocument> {
    const requisition = await this.jobRequisitionModel.findById(id).exec();
    if (!requisition) {
      throw new NotFoundException(`Job requisition with ID ${id} not found`);
    }
    
    if (requisition.publishStatus === 'published') {
      throw new BadRequestException('Job is already published');
    }
    
    requisition.publishStatus = 'published';
    requisition.postingDate = new Date();
    return requisition.save();
  }

  async closeJob(id: string): Promise<JobRequisitionDocument> {
    const requisition = await this.jobRequisitionModel.findById(id).exec();
    if (!requisition) {
      throw new NotFoundException(`Job requisition with ID ${id} not found`);
    }
    
    requisition.publishStatus = 'closed';
    return requisition.save();
  }

  async getPublishedJobs(): Promise<JobRequisitionDocument[]> {
    return this.jobRequisitionModel
      .find({ publishStatus: 'published' })
      .populate('templateId')
      .exec();
  }

  // ==================== REC-007: Candidate Application ====================

  async createApplication(dto: CreateApplicationDto): Promise<ApplicationDocument> {
    const requisition = await this.jobRequisitionModel.findById(dto.requisitionId).exec();
    if (!requisition) {
      throw new NotFoundException(`Job requisition with ID ${dto.requisitionId} not found`);
    }
    if (requisition.publishStatus !== 'published') {
      throw new BadRequestException('Cannot apply to a job that is not published');
    }

    const existingApplication = await this.applicationModel.findOne({
      candidateId: new Types.ObjectId(dto.candidateId),
      requisitionId: new Types.ObjectId(dto.requisitionId),
    }).exec();
    
    if (existingApplication) {
      throw new BadRequestException('Candidate has already applied for this position');
    }

    const application = new this.applicationModel({
      candidateId: new Types.ObjectId(dto.candidateId),
      requisitionId: new Types.ObjectId(dto.requisitionId),
      assignedHr: dto.assignedHr ? new Types.ObjectId(dto.assignedHr) : undefined,
      currentStage: ApplicationStage.SCREENING,
      status: ApplicationStatus.SUBMITTED,
    });

    return application.save();
  }

  async getApplicationById(id: string): Promise<ApplicationDocument> {
    const application = await this.applicationModel
      .findById(id)
      .populate('candidateId')
      .populate('requisitionId')
      .exec();
    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }
    return application;
  }

  async getAllApplications(): Promise<ApplicationDocument[]> {
    return this.applicationModel
      .find()
      .populate('candidateId')
      .populate('requisitionId')
      .exec();
  }

  async getApplicationsByRequisition(requisitionId: string): Promise<ApplicationDocument[]> {
    return this.applicationModel
      .find({ requisitionId: new Types.ObjectId(requisitionId) })
      .populate('candidateId')
      .exec();
  }

  async getApplicationsByCandidate(candidateId: string): Promise<ApplicationDocument[]> {
    return this.applicationModel
      .find({ candidateId: new Types.ObjectId(candidateId) })
      .populate('requisitionId')
      .exec();
  }

  // ==================== REC-008 & REC-017: Application Status Tracking ====================

  async updateApplicationStatus(
    id: string,
    dto: UpdateApplicationStatusDto,
  ): Promise<ApplicationDocument> {
    const application = await this.applicationModel.findById(id).exec();
    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    const historyRecord = new this.applicationHistoryModel({
      applicationId: application._id,
      oldStage: application.currentStage,
      newStage: dto.currentStage || application.currentStage,
      oldStatus: application.status,
      newStatus: dto.status || application.status,
      changedBy: new Types.ObjectId(dto.changedBy),
    });
    await historyRecord.save();

    if (dto.currentStage) {
      application.currentStage = dto.currentStage;
    }
    if (dto.status) {
      application.status = dto.status;
    }

    const updatedApplication = await application.save();

    await this._notifyCandidate(
      application.candidateId.toString(),
      'APPLICATION_STATUS_UPDATE',
      `Your application status has been updated to ${dto.status || application.status}`,
    );

    return updatedApplication;
  }

  async getApplicationHistory(applicationId: string): Promise<ApplicationStatusHistoryDocument[]> {
    return this.applicationHistoryModel
      .find({ applicationId: new Types.ObjectId(applicationId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getApplicationProgress(applicationId: string): Promise<{ 
    stage: ApplicationStage; 
    progress: number;
    status: ApplicationStatus;
    stagesCompleted: ApplicationStage[];
    stagesRemaining: ApplicationStage[];
  }> {
    const application = await this.getApplicationById(applicationId);
    const allStages = this.getAllStagesWithProgress();
    const currentStageIndex = allStages.findIndex(s => s.stage === application.currentStage);
    
    return {
      stage: application.currentStage,
      progress: this.getStageProgress(application.currentStage),
      status: application.status,
      stagesCompleted: allStages.slice(0, currentStageIndex).map(s => s.stage),
      stagesRemaining: allStages.slice(currentStageIndex + 1).map(s => s.stage),
    };
  }

  // ==================== REC-022: Automated Rejection ====================

  async rejectApplication(
    id: string,
    changedBy: string,
    reason?: string,
  ): Promise<ApplicationDocument> {
    const application = await this.applicationModel.findById(id).exec();
    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    const historyRecord = new this.applicationHistoryModel({
      applicationId: application._id,
      oldStage: application.currentStage,
      newStage: application.currentStage,
      oldStatus: application.status,
      newStatus: ApplicationStatus.REJECTED,
      changedBy: new Types.ObjectId(changedBy),
    });
    await historyRecord.save();

    application.status = ApplicationStatus.REJECTED;
    const updatedApplication = await application.save();

    await this._notifyCandidate(
      application.candidateId.toString(),
      'APPLICATION_REJECTED',
      reason || 'Thank you for your interest. Unfortunately, we have decided to proceed with other candidates.',
    );

    return updatedApplication;
  }

  // ==================== REC-010, REC-021: Interview Scheduling & Panel ====================

  async scheduleInterview(dto: ScheduleInterviewDto): Promise<InterviewDocument> {
    const application = await this.applicationModel.findById(dto.applicationId).exec();
    if (!application) {
      throw new NotFoundException(`Application with ID ${dto.applicationId} not found`);
    }

    if (dto.panel && dto.panel.length > 0) {
      const availability = await this._checkInterviewerAvailability(
        dto.panel,
        new Date(dto.scheduledDate),
      );
      if (!availability.allAvailable) {
        console.warn('Some interviewers may not be available:', availability.unavailable);
      }
    }

    const interview = new this.interviewModel({
      applicationId: new Types.ObjectId(dto.applicationId),
      stage: dto.stage,
      scheduledDate: new Date(dto.scheduledDate),
      method: dto.method,
      panel: dto.panel?.map((id) => new Types.ObjectId(id)) || [],
      videoLink: dto.videoLink,
      calendarEventId: dto.calendarEventId,
      status: InterviewStatus.SCHEDULED,
    });

    const savedInterview = await interview.save();

    await this._notifyCandidate(
      application.candidateId.toString(),
      'INTERVIEW_SCHEDULED',
      `Your interview has been scheduled for ${dto.scheduledDate}`,
    );

    return savedInterview;
  }

  async getAllInterviews(): Promise<InterviewDocument[]> {
    return this.interviewModel
      .find()
      .populate('applicationId')
      .populate('panel')
      .sort({ scheduledDate: -1 })
      .exec();
  }

  async getInterviewById(id: string): Promise<InterviewDocument> {
    const interview = await this.interviewModel
      .findById(id)
      .populate('applicationId')
      .populate('panel')
      .exec();
    if (!interview) {
      throw new NotFoundException(`Interview with ID ${id} not found`);
    }
    return interview;
  }

  async getInterviewsByApplication(applicationId: string): Promise<InterviewDocument[]> {
    return this.interviewModel
      .find({ applicationId: new Types.ObjectId(applicationId) })
      .populate('panel')
      .sort({ scheduledDate: 1 })
      .exec();
  }

  async updateInterview(id: string, dto: UpdateInterviewDto): Promise<InterviewDocument> {
    const updateData: any = { ...dto };
    if (dto.scheduledDate) {
      updateData.scheduledDate = new Date(dto.scheduledDate);
    }
    if (dto.panel) {
      updateData.panel = dto.panel.map((pid) => new Types.ObjectId(pid));
    }

    const interview = await this.interviewModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    
    if (!interview) {
      throw new NotFoundException(`Interview with ID ${id} not found`);
    }
    return interview;
  }

  async assignInterviewPanel(interviewId: string, panelIds: string[]): Promise<InterviewDocument> {
    const interview = await this.interviewModel.findById(interviewId).exec();
    if (!interview) {
      throw new NotFoundException(`Interview with ID ${interviewId} not found`);
    }

    interview.panel = panelIds.map((id) => new Types.ObjectId(id));
    return interview.save();
  }

  async cancelInterview(id: string): Promise<InterviewDocument> {
    const interview = await this.interviewModel.findById(id).exec();
    if (!interview) {
      throw new NotFoundException(`Interview with ID ${id} not found`);
    }

    interview.status = InterviewStatus.CANCELLED;
    const cancelledInterview = await interview.save();

    const application = await this.applicationModel.findById(interview.applicationId).exec();
    if (application) {
      await this._notifyCandidate(
        application.candidateId.toString(),
        'INTERVIEW_CANCELLED',
        'Your scheduled interview has been cancelled. We will contact you with further updates.',
      );
    }

    return cancelledInterview;
  }

  async completeInterview(interviewId: string): Promise<InterviewDocument> {
    const interview = await this.interviewModel.findById(interviewId).exec();
    if (!interview) {
      throw new NotFoundException(`Interview with ID ${interviewId} not found`);
    }

    interview.status = InterviewStatus.COMPLETED;
    return interview.save();
  }

  // ==================== REC-011, REC-020: Interview Feedback & Scoring ====================

  async submitInterviewFeedback(
    interviewId: string,
    dto: SubmitFeedbackDto,
  ): Promise<AssessmentResultDocument> {
    const interview = await this.interviewModel.findById(interviewId).exec();
    if (!interview) {
      throw new NotFoundException(`Interview with ID ${interviewId} not found`);
    }

    const isOnPanel = interview.panel.some(
      (panelMember) => panelMember.toString() === dto.interviewerId,
    );
    if (!isOnPanel) {
      throw new BadRequestException('Interviewer is not part of this interview panel');
    }

    const existingFeedback = await this.assessmentResultModel.findOne({
      interviewId: new Types.ObjectId(interviewId),
      interviewerId: new Types.ObjectId(dto.interviewerId),
    }).exec();

    if (existingFeedback) {
      existingFeedback.score = dto.score;
      existingFeedback.comments = dto.comments;
      return existingFeedback.save();
    }

    const feedback = new this.assessmentResultModel({
      interviewId: new Types.ObjectId(interviewId),
      interviewerId: new Types.ObjectId(dto.interviewerId),
      score: dto.score,
      comments: dto.comments,
    });

    return feedback.save();
  }

  async getInterviewFeedback(interviewId: string): Promise<AssessmentResultDocument[]> {
    return this.assessmentResultModel
      .find({ interviewId: new Types.ObjectId(interviewId) })
      .exec();
  }

  async getAverageInterviewScore(interviewId: string): Promise<number> {
    const feedback = await this.getInterviewFeedback(interviewId);
    if (feedback.length === 0) return 0;
    
    const totalScore = feedback.reduce((sum, f) => sum + f.score, 0);
    return Math.round((totalScore / feedback.length) * 100) / 100;
  }

  // ==================== REC-030: Referral Tagging ====================

  async createReferral(dto: CreateReferralDto): Promise<ReferralDocument> {
    const existingReferral = await this.referralModel.findOne({
      candidateId: new Types.ObjectId(dto.candidateId),
    }).exec();

    if (existingReferral) {
      throw new BadRequestException('Candidate has already been referred');
    }

    const referral = new this.referralModel({
      referringEmployeeId: new Types.ObjectId(dto.referringEmployeeId),
      candidateId: new Types.ObjectId(dto.candidateId),
      role: dto.role,
      level: dto.level,
    });

    return referral.save();
  }

  async getReferralByCandidate(candidateId: string): Promise<ReferralDocument | null> {
    return this.referralModel
      .findOne({ candidateId: new Types.ObjectId(candidateId) })
      .exec();
  }

  async isApplicationReferral(applicationId: string): Promise<{ isReferral: boolean; referral: ReferralDocument | null }> {
    const application = await this.applicationModel.findById(applicationId).exec();
    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found`);
    }
    const referral = await this.getReferralByCandidate(application.candidateId.toString());
    return {
      isReferral: !!referral,
      referral,
    };
  }

  async getReferralApplications(requisitionId?: string): Promise<ApplicationDocument[]> {
    const referrals = await this.referralModel.find().exec();
    const referralCandidateIds = referrals.map((r) => r.candidateId);

    const filter: Record<string, unknown> = {
      candidateId: { $in: referralCandidateIds },
    };

    if (requisitionId) {
      filter.requisitionId = new Types.ObjectId(requisitionId);
    }

    return this.applicationModel
      .find(filter)
      .populate('candidateId')
      .populate('requisitionId')
      .exec();
  }

  // ==================== REC-009: Recruitment Analytics ====================

  async getRecruitmentProgress(requisitionId: string): Promise<{
    requisitionId: string;
    total: number;
    byStage: Record<ApplicationStage, number>;
    byStatus: Record<ApplicationStatus, number>;
  }> {
    const applications = await this.applicationModel
      .find({ requisitionId: new Types.ObjectId(requisitionId) })
      .exec();

    const byStage: Record<ApplicationStage, number> = {
      [ApplicationStage.SCREENING]: 0,
      [ApplicationStage.DEPARTMENT_INTERVIEW]: 0,
      [ApplicationStage.HR_INTERVIEW]: 0,
      [ApplicationStage.OFFER]: 0,
    };

    const byStatus: Record<ApplicationStatus, number> = {
      [ApplicationStatus.SUBMITTED]: 0,
      [ApplicationStatus.IN_PROCESS]: 0,
      [ApplicationStatus.OFFER]: 0,
      [ApplicationStatus.HIRED]: 0,
      [ApplicationStatus.REJECTED]: 0,
    };

    applications.forEach((app) => {
      byStage[app.currentStage]++;
      byStatus[app.status]++;
    });

    return {
      requisitionId,
      total: applications.length,
      byStage,
      byStatus,
    };
  }

  async getAllRequisitionsProgress(): Promise<Array<{
    requisitionId: string;
    title: string;
    publishStatus: string;
    progress: Awaited<ReturnType<typeof this.getRecruitmentProgress>>;
  }>> {
    const requisitions = await this.jobRequisitionModel.find().populate('templateId').exec();
    
    const progressList = await Promise.all(
      requisitions.map(async (req) => ({
        requisitionId: req._id.toString(),
        title: (req.templateId as unknown as JobTemplate)?.title || req.requisitionId,
        publishStatus: req.publishStatus,
        progress: await this.getRecruitmentProgress(req._id.toString()),
      })),
    );

    return progressList;
  }

  // ==================== REC-028: Compliance & Consent Management ====================

  async submitConsent(dto: SubmitConsentDto): Promise<ApplicationStatusHistoryDocument> {
    const application = await this.applicationModel.findById(dto.applicationId).exec();
    if (!application) {
      throw new NotFoundException(`Application with ID ${dto.applicationId} not found`);
    }

    // Check if consent already exists
    const existingConsent = await this.getConsentByApplication(dto.applicationId);
    if (existingConsent) {
      throw new BadRequestException('Consent has already been submitted for this application');
    }

    // Create consent data as JSON
    const consentData = {
      type: 'CONSENT',
      dataProcessingConsent: dto.dataProcessingConsent,
      backgroundCheckConsent: dto.backgroundCheckConsent,
      timestamp: new Date().toISOString(),
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      consentText: dto.consentText,
    };

    // Store consent in ApplicationStatusHistory with notes field
    const consentRecord = new this.applicationHistoryModel({
      applicationId: application._id,
      oldStage: application.currentStage,
      newStage: application.currentStage,
      oldStatus: application.status,
      newStatus: application.status,
      changedBy: application.candidateId, // Candidate submits their own consent
      notes: JSON.stringify(consentData),
    });

    return consentRecord.save();
  }

  async getConsentByApplication(applicationId: string): Promise<ApplicationStatusHistoryDocument | null> {
    const consentRecords = await this.applicationHistoryModel
      .find({
        applicationId: new Types.ObjectId(applicationId),
        notes: { $regex: '"type":"CONSENT"' },
      })
      .sort({ createdAt: -1 })
      .exec();

    return consentRecords.length > 0 ? consentRecords[0] : null;
  }

  async getConsentByCandidate(candidateId: string): Promise<ApplicationStatusHistoryDocument[]> {
    // First, get all applications for this candidate
    const applications = await this.applicationModel
      .find({ candidateId: new Types.ObjectId(candidateId) })
      .exec();

    const applicationIds = applications.map((app) => app._id);

    // Then, get all consent records for these applications
    const consentRecords = await this.applicationHistoryModel
      .find({
        applicationId: { $in: applicationIds },
        notes: { $regex: '"type":"CONSENT"' },
      })
      .sort({ createdAt: -1 })
      .exec();

    return consentRecords;
  }

  async verifyConsent(applicationId: string): Promise<{ hasConsent: boolean; consent: any | null }> {
    const consentRecord = await this.getConsentByApplication(applicationId);

    if (!consentRecord || !consentRecord.notes) {
      return { hasConsent: false, consent: null };
    }

    try {
      const consentData = JSON.parse(consentRecord.notes);
      const hasValidConsent =
        consentData.type === 'CONSENT' &&
        consentData.dataProcessingConsent === true &&
        consentData.backgroundCheckConsent === true;

      return {
        hasConsent: hasValidConsent,
        consent: hasValidConsent ? consentData : null,
      };
    } catch (error) {
      return { hasConsent: false, consent: null };
    }
  }

  // ==================== REC-014: Offer Management & Approval Workflow ====================

  async createOffer(dto: CreateOfferDto): Promise<OfferDocument> {
    const application = await this.applicationModel.findById(dto.applicationId).exec();
    if (!application) {
      throw new NotFoundException(`Application with ID ${dto.applicationId} not found`);
    }

    // Verify consent has been submitted
    const consentVerification = await this.verifyConsent(dto.applicationId);
    if (!consentVerification.hasConsent) {
      throw new BadRequestException('Candidate consent is required before creating an offer');
    }

    // Check if offer already exists for this application
    const existingOffer = await this.offerModel.findOne({ applicationId: application._id }).exec();
    if (existingOffer) {
      throw new BadRequestException('An offer has already been created for this application');
    }

    // Create offer with approval workflow
    const offer = new this.offerModel({
      applicationId: application._id,
      candidateId: application.candidateId,
      grossSalary: dto.grossSalary,
      signingBonus: dto.signingBonus,
      benefits: dto.benefits,
      deadline: dto.offerExpiry,
      approvers: dto.approvers.map((approver) => ({
        employeeId: new Types.ObjectId(approver.employeeId),
        role: approver.role,
        status: ApprovalStatus.PENDING,
      })),
      finalStatus: OfferFinalStatus.PENDING,
      applicantResponse: OfferResponseStatus.PENDING,
    });

    const savedOffer = await offer.save();

    // Update application stage to OFFER
    application.currentStage = ApplicationStage.OFFER;
    application.status = ApplicationStatus.OFFER;
    await application.save();

    // Log status change
    const historyRecord = new this.applicationHistoryModel({
      applicationId: application._id,
      oldStage: ApplicationStage.HR_INTERVIEW,
      newStage: ApplicationStage.OFFER,
      oldStatus: ApplicationStatus.IN_PROCESS,
      newStatus: ApplicationStatus.OFFER,
      changedBy: offer.hrEmployeeId || application.candidateId,
    });
    await historyRecord.save();

    // Notify all approvers
    for (const approver of dto.approvers) {
      await this._notifyApprover(approver.employeeId, 'OFFER_APPROVAL_REQUEST', `New offer requires your approval`);
    }

    return savedOffer;
  }

  async getOfferById(id: string): Promise<OfferDocument> {
    const offer = await this.offerModel
      .findById(id)
      .populate('applicationId')
      .populate('candidateId')
      .exec();
    if (!offer) {
      throw new NotFoundException(`Offer with ID ${id} not found`);
    }
    return offer;
  }

  async getOfferByApplication(applicationId: string): Promise<OfferDocument | null> {
    return this.offerModel
      .findOne({ applicationId: new Types.ObjectId(applicationId) })
      .populate('candidateId')
      .exec();
  }

  async getAllOffers(): Promise<OfferDocument[]> {
    return this.offerModel
      .find()
      .populate('applicationId')
      .populate('candidateId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateOffer(id: string, dto: UpdateOfferDto): Promise<OfferDocument> {
    const offer = await this.offerModel.findById(id).exec();
    if (!offer) {
      throw new NotFoundException(`Offer with ID ${id} not found`);
    }

    if (offer.finalStatus !== OfferFinalStatus.PENDING) {
      throw new BadRequestException('Cannot update an offer that has been approved or rejected');
    }

    Object.assign(offer, dto);
    return offer.save();
  }

  async approveOfferStep(offerId: string, dto: ApproveOfferDto): Promise<OfferDocument> {
    const offer = await this.offerModel.findById(offerId).exec();
    if (!offer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    // Find the approver in the list
    const approverIndex = offer.approvers.findIndex(
      (a) => a.employeeId.toString() === dto.employeeId && a.status === ApprovalStatus.PENDING
    );

    if (approverIndex === -1) {
      throw new BadRequestException('Approver not found or has already submitted their decision');
    }

    // Update approver status
    offer.approvers[approverIndex].status = dto.status;
    offer.approvers[approverIndex].actionDate = new Date();
    offer.approvers[approverIndex].comment = dto.comment;

    // Check if any approver rejected
    const hasRejection = offer.approvers.some((a) => a.status === ApprovalStatus.REJECTED);
    if (hasRejection) {
      offer.finalStatus = OfferFinalStatus.REJECTED;
      await offer.save();

      // Notify candidate
      await this._notifyCandidate(
        offer.candidateId.toString(),
        'OFFER_REJECTED',
        'Unfortunately, your offer was not approved'
      );

      return offer;
    }

    // Check if all approvers have approved
    const allApproved = offer.approvers.every((a) => a.status === ApprovalStatus.APPROVED);
    if (allApproved) {
      offer.finalStatus = OfferFinalStatus.APPROVED;
      await offer.save();

      // Notify candidate
      await this._notifyCandidate(
        offer.candidateId.toString(),
        'OFFER_APPROVED',
        'Your offer has been approved and is ready for your review'
      );

      return offer;
    }

    // Still waiting for more approvals
    return offer.save();
  }

  async getOfferApprovalStatus(offerId: string): Promise<{
    finalStatus: OfferFinalStatus;
    pendingApprovers: any[];
    completedApprovers: any[];
  }> {
    const offer = await this.getOfferById(offerId);

    const pendingApprovers = offer.approvers.filter((a) => a.status === ApprovalStatus.PENDING);
    const completedApprovers = offer.approvers.filter((a) => a.status !== ApprovalStatus.PENDING);

    return {
      finalStatus: offer.finalStatus,
      pendingApprovers,
      completedApprovers,
    };
  }

  // ==================== REC-018: E-signed Offer Letters ====================

  async respondToOffer(offerId: string, dto: RespondToOfferDto): Promise<OfferDocument> {
    const offer = await this.offerModel.findById(offerId).exec();
    if (!offer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    // Check that offer is approved before candidate can respond
    if (offer.finalStatus !== OfferFinalStatus.APPROVED) {
      throw new BadRequestException('Can only respond to approved offers');
    }

    // Check that candidate hasn't already responded
    if (offer.applicantResponse !== OfferResponseStatus.PENDING) {
      throw new BadRequestException('Candidate has already responded to this offer');
    }

    offer.applicantResponse = dto.response;

    // If accepted, proceed to e-signature step
    if (dto.response === OfferResponseStatus.ACCEPTED) {
      await this._notifyCandidate(
        offer.candidateId.toString(),
        'OFFER_ACCEPTED',
        'Please proceed to sign the offer letter'
      );
    } else if (dto.response === OfferResponseStatus.REJECTED) {
      offer.finalStatus = OfferFinalStatus.REJECTED;
      await this._notifyCandidate(
        offer.candidateId.toString(),
        'OFFER_DECLINED',
        'You have declined the offer'
      );
    }

    return offer.save();
  }

  async signOffer(offerId: string, dto: SignOfferDto): Promise<OfferDocument> {
    const offer = await this.offerModel.findById(offerId).exec();
    if (!offer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    // Check that offer is accepted before signing
    if (offer.applicantResponse !== OfferResponseStatus.ACCEPTED) {
      throw new BadRequestException('Offer must be accepted before signing');
    }

    const now = new Date();

    // Mock e-signature implementation using timestamps
    switch (dto.role) {
      case 'candidate':
        if (offer.candidateSignedAt) {
          throw new BadRequestException('Candidate has already signed this offer');
        }
        offer.candidateSignedAt = now;
        await this._notifyCandidate(
          offer.candidateId.toString(),
          'SIGNATURE_RECORDED',
          'Your signature has been recorded'
        );
        break;

      case 'hr':
        if (offer.hrSignedAt) {
          throw new BadRequestException('HR has already signed this offer');
        }
        offer.hrSignedAt = now;
        break;

      case 'manager':
        if (offer.managerSignedAt) {
          throw new BadRequestException('Manager has already signed this offer');
        }
        offer.managerSignedAt = now;
        break;

      default:
        throw new BadRequestException('Invalid signer role');
    }

    await offer.save();

    // Check if all signatures collected
    const allSignaturesCollected =
      offer.candidateSignedAt && offer.hrSignedAt && offer.managerSignedAt;

    if (allSignaturesCollected) {
      // Use APPROVED instead of ACCEPTED since ACCEPTED doesn't exist in the enum
      // The offer is already APPROVED at this point, signatures just finalize it
      // No need to change finalStatus - it stays as APPROVED
      await offer.save();

      await this._notifyCandidate(
        offer.candidateId.toString(),
        'OFFER_FULLY_SIGNED',
        'All signatures collected. Proceeding to contract creation.'
      );

      // This will trigger contract creation in REC-029
    }

    return offer;
  }

  async getOfferSignatureStatus(offerId: string): Promise<{
    candidateSigned: boolean;
    candidateSignedAt?: Date;
    hrSigned: boolean;
    hrSignedAt?: Date;
    managerSigned: boolean;
    managerSignedAt?: Date;
    allSignaturesCollected: boolean;
  }> {
    const offer = await this.getOfferById(offerId);

    return {
      candidateSigned: !!offer.candidateSignedAt,
      candidateSignedAt: offer.candidateSignedAt,
      hrSigned: !!offer.hrSignedAt,
      hrSignedAt: offer.hrSignedAt,
      managerSigned: !!offer.managerSignedAt,
      managerSignedAt: offer.managerSignedAt,
      allSignaturesCollected: !!(offer.candidateSignedAt && offer.hrSignedAt && offer.managerSignedAt),
    };
  }

  // ==================== REC-029: Contract Creation & Onboarding Trigger ====================

  async createContract(offerId: string): Promise<ContractDocument> {
    const offer = await this.offerModel.findById(offerId).populate('applicationId').exec();
    if (!offer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    // Check that all signatures are collected
    const signatureStatus = await this.getOfferSignatureStatus(offerId);
    if (!signatureStatus.allSignaturesCollected) {
      throw new BadRequestException('All signatures must be collected before creating a contract');
    }

    // Check if contract already exists
    const existingContract = await this.contractModel.findOne({ offerId: offer._id }).exec();
    if (existingContract) {
      return existingContract;
    }

    // Create contract from offer data
    const contract = new this.contractModel({
      offerId: offer._id,
      acceptanceDate: offer.candidateSignedAt,
      grossSalary: offer.grossSalary,
      signingBonus: offer.signingBonus,
      employeeSignedAt: offer.candidateSignedAt,
      employerSignedAt: offer.hrSignedAt,
    });

    const savedContract = await contract.save();

    // Update application status to HIRED
    const application = await this.applicationModel.findById(offer.applicationId).exec();
    if (application) {
      application.status = ApplicationStatus.HIRED;
      await application.save();

      // Log status change
      const historyRecord = new this.applicationHistoryModel({
        applicationId: application._id,
        oldStage: ApplicationStage.OFFER,
        newStage: ApplicationStage.OFFER,
        oldStatus: ApplicationStatus.OFFER,
        newStatus: ApplicationStatus.HIRED,
        changedBy: offer.hrEmployeeId || offer.candidateId,
      });
      await historyRecord.save();
    }

    // Trigger onboarding creation
    // Note: employeeId should be created from candidate in real implementation
    // For now, using candidateId as placeholder
    await this.onboardingService.createOnboardingChecklist(
      offer.candidateId.toString(),
      savedContract._id.toString(),
    );

    await this._notifyCandidate(
      offer.candidateId.toString(),
      'CONTRACT_CREATED',
      'Your employment contract has been created. Onboarding process initiated.',
    );

    return savedContract;
  }

  async getContractById(id: string): Promise<ContractDocument> {
    const contract = await this.contractModel
      .findById(id)
      .populate('offerId')
      .exec();

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    return contract;
  }

  async getContractByOffer(offerId: string): Promise<ContractDocument | null> {
    return this.contractModel
      .findOne({ offerId: new Types.ObjectId(offerId) })
      .populate('offerId')
      .exec();
  }

  async getAllContracts(): Promise<ContractDocument[]> {
    return this.contractModel
      .find()
      .populate('offerId')
      .sort({ createdAt: -1 })
      .exec();
  }

  // ==================== Private Helper Methods ====================

  private async _notifyCandidate(
    candidateId: string,
    type: string,
    message: string,
  ): Promise<void> {
    const notification = new this.notificationLogModel({
      to: new Types.ObjectId(candidateId),
      type,
      message,
    });
    await notification.save();
  }

  private async _checkInterviewerAvailability(
    employeeIds: string[],
    date: Date,
  ): Promise<{ allAvailable: boolean; unavailable: string[] }> {
    console.log(`[AVAILABILITY CHECK] Employees: ${employeeIds.join(', ')}, Date: ${date.toISOString()}`);
    // TODO: Call TimeManagementService.getEmployeeAvailability when implemented
    return {
      allAvailable: true,
      unavailable: [],
    };
  }

  private async _notifyApprover(
    employeeId: string,
    type: string,
    message: string,
  ): Promise<void> {
    const notification = new this.notificationLogModel({
      to: new Types.ObjectId(employeeId),
      type,
      message,
    });
    await notification.save();
  }

  // ==================== Organization Structure Integration ====================
  // These methods integrate with the Organization Structure subsystem (REC-003, REC-023)
  // The OS team provides: getPositionByName, getAllPositions, getDepartmentByName

  /**
   * Validates that a department exists in the organization structure
   * Used for REC-003 (Job Templates) and clearance sign-offs
   */
  async validateDepartment(departmentName: string): Promise<{ valid: boolean; department: any | null }> {
    try {
      // Call OS team's getDepartmentByName method
      const osService = this.organizationStructureService as any;
      if (typeof osService.getDepartmentByName === 'function') {
        const department = await osService.getDepartmentByName(departmentName);
        return { valid: !!department, department };
      }
      // Method not yet implemented by OS team
      console.warn(`[OS INTEGRATION] getDepartmentByName not yet implemented`);
      return { valid: true, department: null };
    } catch (error) {
      console.warn(`[OS INTEGRATION] getDepartmentByName error: ${error.message}`);
      // Fallback: allow operation to proceed, log warning
      return { valid: true, department: null };
    }
  }

  /**
   * Validates that a position exists in the organization structure
   * Used for REC-003 (Job Templates) and REC-023 (Job Requisitions)
   */
  async validatePosition(positionName: string): Promise<{ valid: boolean; position: any | null }> {
    try {
      // Call OS team's getPositionByName method
      const osService = this.organizationStructureService as any;
      if (typeof osService.getPositionByName === 'function') {
        const position = await osService.getPositionByName(positionName);
        return { valid: !!position, position };
      }
      // Method not yet implemented by OS team
      console.warn(`[OS INTEGRATION] getPositionByName not yet implemented`);
      return { valid: true, position: null };
    } catch (error) {
      console.warn(`[OS INTEGRATION] getPositionByName error: ${error.message}`);
      // Fallback: allow operation to proceed, log warning
      return { valid: true, position: null };
    }
  }

  /**
   * Gets all available positions from the organization structure
   * Used for REC-003 (Job Templates) to show available positions
   */
  async getAvailablePositions(): Promise<any[]> {
    try {
      // Call OS team's getAllPositions method
      const osService = this.organizationStructureService as any;
      if (typeof osService.getAllPositions === 'function') {
        const positions = await osService.getAllPositions();
        return positions || [];
      }
      // Method not yet implemented by OS team
      console.warn(`[OS INTEGRATION] getAllPositions not yet implemented`);
      return [];
    } catch (error) {
      console.warn(`[OS INTEGRATION] getAllPositions error: ${error.message}`);
      // Fallback: return empty array
      return [];
    }
  }

  /**
   * Gets department information for clearance sign-offs (OFF-006, OFF-010)
   */
  async getDepartmentForClearance(departmentName: string): Promise<any | null> {
    const result = await this.validateDepartment(departmentName);
    return result.department;
  }
}

@Injectable()
export class InterviewStatusService {
  constructor(
    @InjectModel(EmployeeProfile.name)
    private employeeModel: Model<EmployeeProfile>,

    @InjectModel(ShiftAssignment.name)
    private shiftAssignmentModel: Model<ShiftAssignment>,

    @InjectModel(Shift.name)
    private shiftModel: Model<Shift>,

    @InjectModel(Interview.name)
    private interviewModel: Model<Interview>,
  ) {}

  async getInterviewerStatus(employeeId: string) {
    const id = new Types.ObjectId(employeeId);

    const employee = await this.employeeModel.findById(id);
    if (!employee) throw new NotFoundException('Employee not found');

    const shiftAssignment = await this.shiftAssignmentModel
      .findOne({
        employeeId: id,
        $or: [
          { endDate: null },
          { endDate: { $gte: new Date() } }
        ]
      })
      .populate('shiftId'); // EXACT FIELD NAME

    let shift: { _id: any; name: any; startTime: any; endTime: any } | null = null;
    if (shiftAssignment?.shiftId) {
      const s = shiftAssignment.shiftId as any;
      shift = {
        _id: s._id,
        name: s.name,
        startTime: s.startTime,
        endTime: s.endTime
      };
    }

    const scheduledInterviews = await this.interviewModel
      .find({
        panel: id,
        status: InterviewStatus.SCHEDULED
      });

    return {
      employee,
      shiftAssignment,
      shift,
      scheduledInterviews
    };
  }
}