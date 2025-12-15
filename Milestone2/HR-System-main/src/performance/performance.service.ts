import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AppraisalAssignmentStatus,
  AppraisalCycleStatus,
  AppraisalRecordStatus,
  AppraisalDisputeStatus,
} from './enums/performance.enums';
import { AppraisalTemplate } from './models/appraisal-template.schema';
import { AppraisalCycle } from './models/appraisal-cycle.schema';
import { AppraisalAssignment } from './models/appraisal-assignment.schema';
import { AppraisalRecord } from './models/appraisal-record.schema';
import { AppraisalDispute } from './models/appraisal-dispute.schema';
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

@Injectable()
export class PerformanceService {
  constructor(
    @InjectModel(AppraisalTemplate.name)
    private readonly templateModel: Model<AppraisalTemplate>,
    @InjectModel(AppraisalCycle.name)
    private readonly cycleModel: Model<AppraisalCycle>,
    @InjectModel(AppraisalAssignment.name)
    private readonly assignmentModel: Model<AppraisalAssignment>,
    @InjectModel(AppraisalRecord.name)
    private readonly recordModel: Model<AppraisalRecord>,
    @InjectModel(AppraisalDispute.name)
    private readonly disputeModel: Model<AppraisalDispute>,
  ) {}

  // PHASE 1: PLANNING & SETUP

  async createTemplate(dto: CreateAppraisalTemplateDto) {
    const created = await this.templateModel.create(dto);
    return created.toObject();
  }

  async listTemplates() {
    return this.templateModel.find().lean().exec();
  }

  async getTemplate(id: string) {
    const template = await this.templateModel
      .findById(new Types.ObjectId(id))
      .lean()
      .exec();
    if (!template) {
      throw new NotFoundException('Appraisal template not found');
    }
    return template;
  }

  async updateTemplate(id: string, dto: UpdateAppraisalTemplateDto) {
    const updated = await this.templateModel
      .findByIdAndUpdate(new Types.ObjectId(id), dto, { new: true })
      .lean()
      .exec();
    if (!updated) {
      throw new NotFoundException('Appraisal template not found');
    }
    return updated;
  }

  // NOTE: should be restricted to HR Manager role
  async deleteTemplate(id: string) {
    const deleted = await this.templateModel
      .findByIdAndDelete(new Types.ObjectId(id))
      .lean()
      .exec();
    if (!deleted) {
      throw new NotFoundException('Appraisal template not found');
    }
    return deleted;
  }

  async createCycle(dto: CreateAppraisalCycleDto) {
    const payload: Partial<AppraisalCycle> = {
      name: dto.name,
      description: dto.description,
      cycleType: dto.cycleType,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      managerDueDate: dto.managerDueDate
        ? new Date(dto.managerDueDate)
        : undefined,
      employeeAcknowledgementDueDate: dto.employeeAcknowledgementDueDate
        ? new Date(dto.employeeAcknowledgementDueDate)
        : undefined,
      templateAssignments: dto.templateAssignments.map((ta) => ({
        templateId: new Types.ObjectId(ta.templateId),
        departmentIds: (ta.departmentIds || []).map(
          (d) => new Types.ObjectId(d),
        ),
      })),
      status: dto.status ?? AppraisalCycleStatus.PLANNED,
    };

    const created = await this.cycleModel.create(payload);
    return created.toObject();
  }

  async listCycles() {
    return this.cycleModel.find().lean().exec();
  }

  async getCycle(id: string) {
    const cycle = await this.cycleModel
      .findById(new Types.ObjectId(id))
      .lean()
      .exec();
    if (!cycle) {
      throw new NotFoundException('Appraisal cycle not found');
    }
    return cycle;
  }

  async updateCycle(id: string, dto: UpdateAppraisalCycleDto) {
    const update: Partial<AppraisalCycle> = {};

    if (dto.name !== undefined) update.name = dto.name;
    if (dto.description !== undefined) update.description = dto.description;
    if (dto.cycleType !== undefined) update.cycleType = dto.cycleType;
    if (dto.startDate !== undefined)
      update.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) update.endDate = new Date(dto.endDate);
    if (dto.managerDueDate !== undefined)
      update.managerDueDate = dto.managerDueDate
        ? new Date(dto.managerDueDate)
        : undefined;
    if (dto.employeeAcknowledgementDueDate !== undefined)
      update.employeeAcknowledgementDueDate =
        dto.employeeAcknowledgementDueDate
          ? new Date(dto.employeeAcknowledgementDueDate)
          : undefined;
    if (dto.templateAssignments !== undefined) {
      update.templateAssignments = dto.templateAssignments.map((ta) => ({
        templateId: new Types.ObjectId(ta.templateId),
        departmentIds: (ta.departmentIds || []).map(
          (d) => new Types.ObjectId(d),
        ),
      }));
    }
    if (dto.status !== undefined) update.status = dto.status;

    const updated = await this.cycleModel
      .findByIdAndUpdate(new Types.ObjectId(id), update, { new: true })
      .lean()
      .exec();
    if (!updated) {
      throw new NotFoundException('Appraisal cycle not found');
    }
    return updated;
  }

  async setCycleStatus(id: string, status: AppraisalCycleStatus) {
    const updated = await this.cycleModel
      .findByIdAndUpdate(
        new Types.ObjectId(id),
        { status },
        {
          new: true,
        },
      )
      .lean()
      .exec();
    if (!updated) {
      throw new NotFoundException('Appraisal cycle not found');
    }
    return updated;
  }

  // NOTE: should be restricted to HR Manager role
  async deleteCycle(id: string) {
    const deleted = await this.cycleModel
      .findByIdAndDelete(new Types.ObjectId(id))
      .lean()
      .exec();
    if (!deleted) {
      throw new NotFoundException('Appraisal cycle not found');
    }
    return deleted;
  }

  // PHASE 2: EVALUATION & REVIEW

  async createAssignments(dto: CreateAppraisalAssignmentsDto) {
    const cycleId = new Types.ObjectId(dto.cycleId);
    const templateId = new Types.ObjectId(dto.templateId);

    const docs: Partial<AppraisalAssignment>[] = dto.assignments.map((a) => ({
      cycleId,
      templateId,
      employeeProfileId: new Types.ObjectId(a.employeeProfileId),
      managerProfileId: new Types.ObjectId(a.managerProfileId),
      departmentId: new Types.ObjectId(a.departmentId),
      positionId: a.positionId ? new Types.ObjectId(a.positionId) : undefined,
      status: AppraisalAssignmentStatus.NOT_STARTED,
      assignedAt: new Date(),
      dueDate: a.dueDate ? new Date(a.dueDate) : undefined,
    }));

    const created = await this.assignmentModel.insertMany(docs);
    return created.map((d) => d.toObject());
  }

  async listAssignmentsByCycle(cycleId: string) {
    return this.assignmentModel
      .find({ cycleId: new Types.ObjectId(cycleId) })
      .lean()
      .exec();
  }

  async getAssignment(id: string) {
    const assignment = await this.assignmentModel
      .findById(new Types.ObjectId(id))
      .lean()
      .exec();
    if (!assignment) {
      throw new NotFoundException('Appraisal assignment not found');
    }
    return assignment;
  }

  // NOTE: typically HR Manager or System Admin
  async deleteAssignment(id: string) {
    const deleted = await this.assignmentModel
      .findByIdAndDelete(new Types.ObjectId(id))
      .lean()
      .exec();
    if (!deleted) {
      throw new NotFoundException('Appraisal assignment not found');
    }
    return deleted;
  }

  async updateAssignmentStatus(id: string, status: AppraisalAssignmentStatus) {
    const update: Partial<AppraisalAssignment> = { status };
    
    // Update related timestamps based on status
    if (status === AppraisalAssignmentStatus.SUBMITTED) {
      update.submittedAt = new Date();
    } else if (status === AppraisalAssignmentStatus.PUBLISHED) {
      update.publishedAt = new Date();
    }
    
    const updated = await this.assignmentModel
      .findByIdAndUpdate(new Types.ObjectId(id), update, { new: true })
      .lean()
      .exec();
    if (!updated) {
      throw new NotFoundException('Appraisal assignment not found');
    }
    return updated;
  }

  async createOrUpdateRecord(
    assignmentId: string,
    dto: CreateAppraisalRecordDto,
  ) {
    const assignmentObjectId = new Types.ObjectId(assignmentId);

    const payload: Partial<AppraisalRecord> = {
      assignmentId: assignmentObjectId,
      cycleId: new Types.ObjectId(dto.cycleId),
      templateId: new Types.ObjectId(dto.templateId),
      employeeProfileId: new Types.ObjectId(dto.employeeProfileId),
      managerProfileId: new Types.ObjectId(dto.managerProfileId),
      ratings: dto.ratings,
      totalScore: dto.totalScore,
      overallRatingLabel: dto.overallRatingLabel,
      managerSummary: dto.managerSummary,
      strengths: dto.strengths,
      improvementAreas: dto.improvementAreas,
      managerSubmittedAt: dto.managerSubmittedAt
        ? new Date(dto.managerSubmittedAt)
        : new Date(),
      status: AppraisalRecordStatus.MANAGER_SUBMITTED,
    };

    const existing = await this.recordModel
      .findOne({ assignmentId: assignmentObjectId })
      .exec();

    let record: any;

    if (existing) {
      Object.assign(existing, payload);
      record = await existing.save();
    } else {
      record = await this.recordModel.create(payload);
    }

    await this.assignmentModel
      .findByIdAndUpdate(assignmentObjectId, {
        status: AppraisalAssignmentStatus.SUBMITTED,
        submittedAt: payload.managerSubmittedAt,
      })
      .exec();

    return record.toObject();
  }

  async listRecordsByCycle(cycleId: string) {
    return this.recordModel
      .find({ cycleId: new Types.ObjectId(cycleId) })
      .lean()
      .exec();
  }

  async getRecord(id: string) {
    const record = await this.recordModel
      .findById(new Types.ObjectId(id))
      .lean()
      .exec();
    if (!record) {
      throw new NotFoundException('Appraisal record not found');
    }
    return record;
  }

  // NOTE: typically HR Manager or System Admin
  async deleteRecord(id: string) {
    const deleted = await this.recordModel
      .findByIdAndDelete(new Types.ObjectId(id))
      .lean()
      .exec();
    if (!deleted) {
      throw new NotFoundException('Appraisal record not found');
    }
    return deleted;
  }

  // PHASE 3: FEEDBACK & ACKNOWLEDGEMENT

  async publishRecord(id: string, dto: PublishAppraisalRecordDto) {
    const recordId = new Types.ObjectId(id);

    const record = await this.recordModel
      .findByIdAndUpdate(
        recordId,
        {
          status: AppraisalRecordStatus.HR_PUBLISHED,
          hrPublishedAt: new Date(),
          publishedByEmployeeId: new Types.ObjectId(
            dto.hrPublisherEmployeeId,
          ),
        },
        { new: true },
      )
      .lean()
      .exec();

    if (!record) {
      throw new NotFoundException('Appraisal record not found');
    }

    await this.assignmentModel
      .findByIdAndUpdate(record.assignmentId, {
        status: AppraisalAssignmentStatus.PUBLISHED,
        publishedAt: new Date(),
      })
      .exec();

    return record;
  }

  async acknowledgeRecord(id: string, dto: AcknowledgeAppraisalRecordDto) {
    const recordId = new Types.ObjectId(id);

    const record = await this.recordModel
      .findByIdAndUpdate(
        recordId,
        {
          employeeViewedAt: new Date(),
          employeeAcknowledgedAt: new Date(),
          employeeAcknowledgementComment: dto.acknowledgementComment,
        },
        { new: true },
      )
      .lean()
      .exec();

    if (!record) {
      throw new NotFoundException('Appraisal record not found');
    }

    await this.assignmentModel
      .findByIdAndUpdate(record.assignmentId, {
        status: AppraisalAssignmentStatus.ACKNOWLEDGED,
      })
      .exec();

    return record;
  }

  // PHASE 4: DISPUTE & RESOLUTION

  async createDispute(dto: CreateAppraisalDisputeDto) {
    // Validate required IDs are valid ObjectIds
    const invalidIds: string[] = [];
    
    if (!Types.ObjectId.isValid(dto.appraisalId)) {
      invalidIds.push(`appraisalId: "${dto.appraisalId}"`);
    }
    if (dto.assignmentId && !Types.ObjectId.isValid(dto.assignmentId)) {
      invalidIds.push(`assignmentId: "${dto.assignmentId}"`);
    }
    if (dto.cycleId && !Types.ObjectId.isValid(dto.cycleId)) {
      invalidIds.push(`cycleId: "${dto.cycleId}"`);
    }
    if (!Types.ObjectId.isValid(dto.raisedByEmployeeId)) {
      invalidIds.push(`raisedByEmployeeId: "${dto.raisedByEmployeeId}"`);
    }
    
    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Invalid ObjectId format for: ${invalidIds.join(', ')}. All IDs must be valid 24-character hex strings.`
      );
    }

    // If assignmentId is not provided or empty, try to get it from the appraisal record
    let assignmentId = dto.assignmentId;
    if (!assignmentId || assignmentId.trim() === '') {
      try {
        const appraisalRecord = await this.recordModel
          .findById(new Types.ObjectId(dto.appraisalId))
          .lean()
          .exec();
        
        if (appraisalRecord && appraisalRecord.assignmentId) {
          assignmentId = String(appraisalRecord.assignmentId);
        } else {
          throw new BadRequestException(
            'Assignment ID is required. Could not retrieve it from the appraisal record.'
          );
        }
      } catch (err: any) {
        if (err instanceof BadRequestException) {
          throw err;
        }
        throw new BadRequestException(
          'Assignment ID is required. Could not retrieve it from the appraisal record.'
        );
      }
    }

    // If cycleId is not provided or empty, try to get it from the appraisal record
    let cycleId = dto.cycleId;
    let appraisalRecord: any = null;
    if (!cycleId || cycleId.trim() === '') {
      try {
        appraisalRecord = await this.recordModel
          .findById(new Types.ObjectId(dto.appraisalId))
          .lean()
          .exec();
        
        if (appraisalRecord && appraisalRecord.cycleId) {
          cycleId = String(appraisalRecord.cycleId);
        } else {
          throw new BadRequestException(
            'Cycle ID is required. Could not retrieve it from the appraisal record.'
          );
        }
      } catch (err: any) {
        if (err instanceof BadRequestException) {
          throw err;
        }
        throw new BadRequestException(
          'Cycle ID is required. Could not retrieve it from the appraisal record.'
        );
      }
    }

    // Validate that the employee submitting the dispute is the one who was evaluated
    // Fetch appraisal record if not already fetched
    if (!appraisalRecord) {
      try {
        appraisalRecord = await this.recordModel
          .findById(new Types.ObjectId(dto.appraisalId))
          .lean()
          .exec();
      } catch (err: any) {
        throw new BadRequestException(
          'Could not retrieve the appraisal record. Please verify the appraisal ID is correct.'
        );
      }
    }

    if (!appraisalRecord) {
      throw new BadRequestException(
        'Appraisal record not found. Please verify the appraisal ID is correct.'
      );
    }

    // Check if the raisedByEmployeeId matches the employeeProfileId in the appraisal record
    const evaluatedEmployeeId = String(appraisalRecord.employeeProfileId || '');
    const disputeRaisedByEmployeeId = String(dto.raisedByEmployeeId).trim();

    if (evaluatedEmployeeId !== disputeRaisedByEmployeeId) {
      throw new BadRequestException(
        'You can only submit a dispute for your own appraisal. The employee submitting the dispute must be the same employee who was evaluated in this appraisal record.'
      );
    }

    // Validate that the appraisal record is published (employees can only dispute published appraisals)
    const recordStatus = appraisalRecord.status || '';
    const isPublished = recordStatus === AppraisalRecordStatus.HR_PUBLISHED || 
                        recordStatus === 'HR_PUBLISHED' || 
                        recordStatus === 'PUBLISHED';
    
    if (!isPublished) {
      throw new BadRequestException(
        `You can only submit a dispute for published appraisals. This appraisal record has status "${recordStatus}". Please wait until the appraisal is published by HR (status: HR_PUBLISHED) before submitting a dispute.`
      );
    }
    
    const payload: Partial<AppraisalDispute> = {
      appraisalId: new Types.ObjectId(dto.appraisalId),
      assignmentId: new Types.ObjectId(assignmentId),
      cycleId: new Types.ObjectId(cycleId),
      raisedByEmployeeId: new Types.ObjectId(dto.raisedByEmployeeId),
      reason: dto.reason,
      details: dto.details,
      submittedAt: new Date(),
      status: AppraisalDisputeStatus.OPEN,
    };

    const created = await this.disputeModel.create(payload);
    return created.toObject();
  }

  async listDisputesByCycle(cycleId: string) {
    // Trim and validate the cycleId
    const trimmedCycleId = cycleId?.trim();
    if (!trimmedCycleId || !Types.ObjectId.isValid(trimmedCycleId)) {
      throw new BadRequestException(`Invalid cycle ID format: "${cycleId}". Must be a valid 24-character hex string.`);
    }
    
    return this.disputeModel
      .find({ cycleId: new Types.ObjectId(trimmedCycleId) })
      .lean()
      .exec();
  }

  async getDispute(id: string) {
    const dispute = await this.disputeModel
      .findById(new Types.ObjectId(id))
      .lean()
      .exec();
    if (!dispute) {
      throw new NotFoundException('Appraisal dispute not found');
    }
    return dispute;
  }

  async resolveDispute(id: string, dto: ResolveAppraisalDisputeDto) {
    const disputeId = new Types.ObjectId(id);

    const dispute = await this.disputeModel
      .findByIdAndUpdate(
        disputeId,
        {
          status: dto.status,
          resolvedAt: new Date(),
          resolvedByEmployeeId: new Types.ObjectId(dto.resolvedByEmployeeId),
          resolutionSummary: dto.resolutionSummary,
        },
        { new: true },
      )
      .lean()
      .exec();

    if (!dispute) {
      throw new NotFoundException('Appraisal dispute not found');
    }

    return dispute;
  }

  // PHASE 5: CLOSURE & ARCHIVING

  async archiveCycle(id: string) {
    const cycleId = new Types.ObjectId(id);

    await this.recordModel
      .updateMany(
        { cycleId },
        {
          status: AppraisalRecordStatus.ARCHIVED,
          archivedAt: new Date(),
        },
      )
      .exec();

    const cycle = await this.cycleModel
      .findByIdAndUpdate(
        cycleId,
        {
          status: AppraisalCycleStatus.ARCHIVED,
          archivedAt: new Date(),
        } as Partial<AppraisalCycle>,
        { new: true },
      )
      .lean()
      .exec();

    if (!cycle) {
      throw new NotFoundException('Appraisal cycle not found');
    }

    return cycle;
  }
}
