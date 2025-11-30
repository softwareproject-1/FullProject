import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ChangeLogAction,
  StructureRequestStatus,
} from './enums/organization-structure.enums';
import { Department, DepartmentDocument } from './models/department.schema';
import { Position, PositionDocument } from './models/position.schema';
import {
  PositionAssignment,
  PositionAssignmentDocument,
} from './models/position-assignment.schema';
import {
  StructureApproval,
  StructureApprovalDocument,
} from './models/structure-approval.schema';
import {
  StructureChangeLog,
  StructureChangeLogDocument,
} from './models/structure-change-log.schema';
import {
  StructureChangeRequest,
  StructureChangeRequestDocument,
} from './models/structure-change-request.schema';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from './dto/department.dto';
import { CreatePositionDto, UpdatePositionDto } from './dto/position.dto';
import { DeactivateEntityDto } from './dto/deactivate-entity.dto';
import {
  CreateStructureChangeRequestDto,
  RecordApprovalDecisionDto,
  SubmitStructureChangeRequestDto,
  UpdateStructureRequestStatusDto,
} from './dto/change-request.dto';

type WithId<T> = T & { _id: Types.ObjectId };

@Injectable()
export class OrganizationStructureService {
  private static readonly REQUEST_TRANSITIONS: Record<
    StructureRequestStatus,
    StructureRequestStatus[]
  > = {
    [StructureRequestStatus.DRAFT]: [
      StructureRequestStatus.SUBMITTED,
      StructureRequestStatus.CANCELED,
    ],
    [StructureRequestStatus.SUBMITTED]: [
      StructureRequestStatus.UNDER_REVIEW,
      StructureRequestStatus.CANCELED,
    ],
    [StructureRequestStatus.UNDER_REVIEW]: [
      StructureRequestStatus.APPROVED,
      StructureRequestStatus.REJECTED,
      StructureRequestStatus.CANCELED,
    ],
    [StructureRequestStatus.APPROVED]: [StructureRequestStatus.IMPLEMENTED],
    [StructureRequestStatus.REJECTED]: [],
    [StructureRequestStatus.CANCELED]: [],
    [StructureRequestStatus.IMPLEMENTED]: [],
  };

  constructor(
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
    @InjectModel(Position.name)
    private readonly positionModel: Model<PositionDocument>,
    @InjectModel(PositionAssignment.name)
    private readonly assignmentModel: Model<PositionAssignmentDocument>,
    @InjectModel(StructureApproval.name)
    private readonly approvalModel: Model<StructureApprovalDocument>,
    @InjectModel(StructureChangeLog.name)
    private readonly changeLogModel: Model<StructureChangeLogDocument>,
    @InjectModel(StructureChangeRequest.name)
    private readonly changeRequestModel: Model<StructureChangeRequestDocument>,
  ) {}

  async createDepartment(dto: CreateDepartmentDto) {
    const department = await this.departmentModel.create({
      code: dto.code,
      name: dto.name,
      description: dto.description,
      headPositionId: dto.headPositionId
        ? new Types.ObjectId(dto.headPositionId)
        : undefined,
    });

    await this.logChange({
      action: ChangeLogAction.CREATED,
      entityType: 'Department',
      entityId: department._id,
      performedByEmployeeId: dto.performedByEmployeeId,
      afterSnapshot: department.toObject(),
      summary: `Department ${department.code} created`,
    });

    return department.toObject();
  }

  async updateDepartment(departmentId: string, dto: UpdateDepartmentDto) {
    const existing = await this.departmentModel.findById(departmentId);
    if (!existing) {
      throw new NotFoundException('Department not found');
    }

    const before = existing.toObject();

    existing.name = dto.name ?? existing.name;
    existing.description = dto.description ?? existing.description;
    existing.headPositionId = dto.headPositionId
      ? new Types.ObjectId(dto.headPositionId)
      : existing.headPositionId;

    await existing.save();

    await this.logChange({
      action: ChangeLogAction.UPDATED,
      entityType: 'Department',
      entityId: existing._id,
      performedByEmployeeId: dto.performedByEmployeeId,
      beforeSnapshot: before,
      afterSnapshot: existing.toObject(), //a save what the log has
      summary: `Department ${existing.code} updated`,
    });

    return existing.toObject();
  }

  async deactivateDepartment(departmentId: string, dto: DeactivateEntityDto) {
    const department = await this.departmentModel.findById(departmentId);
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    if (!department.isActive) {
      return department.toObject();
    }

    const before = department.toObject();
    department.isActive = false;
    await department.save();

    await this.positionModel.updateMany(
      { departmentId: department._id },
      { isActive: false },
    );

    await this.logChange({
      action: ChangeLogAction.DEACTIVATED,
      entityType: 'Department',
      entityId: department._id,
      performedByEmployeeId: dto.performedByEmployeeId,
      beforeSnapshot: before,
      afterSnapshot: department.toObject(),
      summary:
        dto.reason || `Department ${department.code} deactivated by system`,
    });

    return department.toObject();
  }

  async createPosition(dto: CreatePositionDto) {
    await this.ensureDepartmentExists(dto.departmentId);
    const position = await this.positionModel.create({
      code: dto.code,
      title: dto.title,
      description: dto.description,
      departmentId: new Types.ObjectId(dto.departmentId),
      reportsToPositionId: dto.reportsToPositionId
        ? new Types.ObjectId(dto.reportsToPositionId)
        : undefined,
    });

    await this.logChange({
      action: ChangeLogAction.CREATED,
      entityType: 'Position',
      entityId: position._id,
      performedByEmployeeId: dto.performedByEmployeeId,
      afterSnapshot: position.toObject(),
      summary: `Position ${position.code} created`,
    });

    return position.toObject();
  }

  async updatePosition(positionId: string, dto: UpdatePositionDto) {
    const position = await this.positionModel.findById(positionId);
    if (!position) {
      throw new NotFoundException('Position not found');
    }

    const before = position.toObject();

    if (dto.departmentId && dto.departmentId !== String(position.departmentId)) {
      await this.ensureDepartmentExists(dto.departmentId);
      position.departmentId = new Types.ObjectId(dto.departmentId);
    }

    position.title = dto.title ?? position.title;
    position.description = dto.description ?? position.description;
    position.reportsToPositionId = dto.reportsToPositionId
      ? new Types.ObjectId(dto.reportsToPositionId)
      : position.reportsToPositionId;

    if (typeof dto.isActive === 'boolean') {
      position.isActive = dto.isActive;
    }

    await position.save();

    await this.logChange({
      action: ChangeLogAction.UPDATED,
      entityType: 'Position',
      entityId: position._id,
      performedByEmployeeId: dto.performedByEmployeeId,
      beforeSnapshot: before,
      afterSnapshot: position.toObject(),
      summary: `Position ${position.code} updated`,
    });

    return position.toObject();
  }

  async deactivatePosition(positionId: string, dto: DeactivateEntityDto) {
    const position = await this.positionModel.findById(positionId);
    if (!position) {
      throw new NotFoundException('Position not found');
    }

    if (!position.isActive) {
      return position.toObject();
    }

    const before = position.toObject();
    position.isActive = false;
    await position.save();

    const closureDate = dto.endDate ? new Date(dto.endDate) : new Date();

    await this.assignmentModel.updateMany(
      {
        positionId: position._id,
        $or: [{ endDate: { $exists: false } }, { endDate: null }],
      },
      { endDate: closureDate },
    );

    await this.logChange({
      action: ChangeLogAction.DEACTIVATED,
      entityType: 'Position',
      entityId: position._id,
      performedByEmployeeId: dto.performedByEmployeeId,
      beforeSnapshot: before,
      afterSnapshot: position.toObject(),
      summary:
        dto.reason || `Position ${position.code} deactivated and delimited`,
    });

    return position.toObject();
  }

  async createStructureChangeRequest(dto: CreateStructureChangeRequestDto) {
    const request = await this.changeRequestModel.create({
      requestNumber: dto.requestNumber,
      requestedByEmployeeId: dto.requestedByEmployeeId,
      requestType: dto.requestType,
      targetDepartmentId: dto.targetDepartmentId,
      targetPositionId: dto.targetPositionId,
      details: dto.details,
      reason: dto.reason,
      status: StructureRequestStatus.DRAFT,
    });

    await this.logChange({
      action: ChangeLogAction.CREATED,
      entityType: 'StructureChangeRequest',
      entityId: request._id,
      performedByEmployeeId: dto.requestedByEmployeeId,
      afterSnapshot: request.toObject(),
      summary: `Change request ${request.requestNumber} created`,
    });

    return request.toObject();
  }

  async submitStructureChangeRequest(
    requestId: string,
    dto: SubmitStructureChangeRequestDto,
  ) {
    const request = await this.changeRequestModel.findById(requestId);
    if (!request) {
      throw new NotFoundException('Structure change request not found');
    }

    if (request.status !== StructureRequestStatus.DRAFT) {
      throw new BadRequestException('Only drafts can be submitted');
    }

    const before = request.toObject();
    request.status = StructureRequestStatus.SUBMITTED;
    request.submittedByEmployeeId = new Types.ObjectId(
      dto.submittedByEmployeeId,
    );
    request.submittedAt = dto.submittedAt
      ? new Date(dto.submittedAt)
      : new Date();

    await request.save();

    await this.logChange({
      action: ChangeLogAction.UPDATED,
      entityType: 'StructureChangeRequest',
      entityId: request._id,
      performedByEmployeeId: dto.submittedByEmployeeId,
      beforeSnapshot: before,
      afterSnapshot: request.toObject(),
      summary: `Change request ${request.requestNumber} submitted`,
    });

    return request.toObject();
  }

  async updateStructureRequestStatus(
    requestId: string,
    dto: UpdateStructureRequestStatusDto,
  ) {
    const request = await this.changeRequestModel.findById(requestId);
    if (!request) {
      throw new NotFoundException('Structure change request not found');
    }

    this.ensureValidStatusTransition(request.status, dto.status);

    const before = request.toObject();
    request.status = dto.status;

    await request.save();

    await this.logChange({
      action: ChangeLogAction.UPDATED,
      entityType: 'StructureChangeRequest',
      entityId: request._id,
      performedByEmployeeId: dto.performedByEmployeeId,
      beforeSnapshot: before,
      afterSnapshot: request.toObject(),
      summary:
        dto.summary ||
        `Change request ${request.requestNumber} moved to ${dto.status}`,
    });

    return request.toObject();
  }

  async recordApprovalDecision(
    requestId: string,
    dto: RecordApprovalDecisionDto,
  ) {
    const requestExists = await this.changeRequestModel.exists({
      _id: requestId,
    });
    if (!requestExists) {
      throw new NotFoundException('Structure change request not found');
    }

    const decisionDate = dto.decidedAt ? new Date(dto.decidedAt) : new Date();

    const approval = await this.approvalModel
      .findOneAndUpdate(
        {
          changeRequestId: requestId,
          approverEmployeeId: dto.approverEmployeeId,
        },
        {
          changeRequestId: requestId,
          approverEmployeeId: dto.approverEmployeeId,
          decision: dto.decision,
          decidedAt: decisionDate,
          comments: dto.comments,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .lean()
      .exec();

    await this.logChange({
      action: ChangeLogAction.UPDATED,
      entityType: 'StructureApproval',
      entityId: approval._id,
      performedByEmployeeId: dto.approverEmployeeId,
      afterSnapshot: approval,
      summary: `Approval decision recorded as ${dto.decision}`,
    });

    return approval;
  }

  private async ensureDepartmentExists(departmentId: string) {
    const exists = await this.departmentModel.exists({ _id: departmentId });
    if (!exists) {
      throw new NotFoundException('Department not found');
    }
  }

  private ensureValidStatusTransition(
    current: StructureRequestStatus,
    next: StructureRequestStatus,
  ) {
    const allowed = OrganizationStructureService.REQUEST_TRANSITIONS[current];
    if (!allowed?.includes(next)) {
      throw new BadRequestException(
        `Cannot move request from ${current} to ${next}`,
      );
    }
  }

  private async logChange({
    action,
    entityType,
    entityId,
    performedByEmployeeId,
    beforeSnapshot,
    afterSnapshot,
    summary,
  }: {
    action: ChangeLogAction;
    entityType: string;
    entityId: Types.ObjectId;
    performedByEmployeeId?: string;
    beforeSnapshot?: unknown;
    afterSnapshot?: unknown;
    summary?: string;
  }) {
    await this.changeLogModel.create({
      action,
      entityType,
      entityId,
      performedByEmployeeId,
      beforeSnapshot: this.normalizeSnapshot(beforeSnapshot),
      afterSnapshot: this.normalizeSnapshot(afterSnapshot),
      summary,
    });
  }

  private normalizeSnapshot(
    snapshot?: unknown,
  ): Record<string, unknown> | undefined {
    if (!snapshot || typeof snapshot !== 'object') {
      return undefined;
    }

    return JSON.parse(JSON.stringify(snapshot)) as Record<string, unknown>;
  }
}
