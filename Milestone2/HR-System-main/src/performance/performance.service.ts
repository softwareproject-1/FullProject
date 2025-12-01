import { Injectable, NotFoundException } from '@nestjs/common';
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

  async getEmployeeRecords(
    employeeId: string,
    filters?: { cycleId?: string; startDate?: string; endDate?: string },
  ) {
    const query: any = {
      employeeProfileId: new Types.ObjectId(employeeId),
      // Only return completed records (HR_PUBLISHED or ARCHIVED)
      status: {
        $in: [
          AppraisalRecordStatus.HR_PUBLISHED,
          AppraisalRecordStatus.ARCHIVED,
        ],
      },
    };

    if (filters?.cycleId) {
      query.cycleId = new Types.ObjectId(filters.cycleId);
    }

    if (filters?.startDate || filters?.endDate) {
      query.hrPublishedAt = {};
      if (filters.startDate) {
        query.hrPublishedAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.hrPublishedAt.$lte = new Date(filters.endDate);
      }
    }

    const records = await this.recordModel
      .find(query)
      .select(
        '_id overallRatingLabel status managerSummary totalScore hrPublishedAt cycleId templateId createdAt updatedAt',
      )
      .sort({ hrPublishedAt: -1 })
      .lean()
      .exec();

    return records.map((record) => ({
      id: record._id,
      overallRating: record.overallRatingLabel,
      status: record.status,
      managerComments: record.managerSummary,
      totalScore: record.totalScore,
      publishedAt: record.hrPublishedAt,
      cycleId: record.cycleId,
      templateId: record.templateId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
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
    const payload: Partial<AppraisalDispute> = {
      appraisalId: new Types.ObjectId(dto.appraisalId),
      assignmentId: new Types.ObjectId(dto.assignmentId),
      cycleId: new Types.ObjectId(dto.cycleId),
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
    return this.disputeModel
      .find({ cycleId: new Types.ObjectId(cycleId) })
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
