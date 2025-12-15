import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import {
  ChangeLogAction,
  StructureRequestStatus,
} from './enums/organization-structure.enums';
import { Department, DepartmentDocument, DepartmentSchema } from './models/department.schema';
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
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  // ==================== DEPARTMENT METHODS ====================

  async createDepartment(dto: CreateDepartmentDto) {
      const existing = await this.departmentModel.findOne({ code: dto.code });
      if (existing) {
        throw new BadRequestException(
          `Department with code "${dto.code}" already exists`,
        );
      }

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

  async getAllDepartments() {
    return this.departmentModel.find({}).lean().exec();
  }

  async getDepartmentById(departmentId: string) {
    if (!Types.ObjectId.isValid(departmentId)) {
      throw new BadRequestException(`Invalid department ID format: "${departmentId}"`);
    }

    const department = await this.departmentModel.findById(departmentId).lean().exec();

    if (!department) {
      throw new NotFoundException(`Department with ID "${departmentId}" not found`);
    }

    return department;
  }

  async getDepartmentByName(departmentName: string) {
    try {
      if (!departmentName || departmentName.trim().length === 0) {
        throw new BadRequestException('Department name is required');
      }

      const db = this.connection.db;
      if (!db) {
        throw new BadRequestException('Database connection not available');
      }

      const collectionName = this.departmentModel.collection.collectionName;
      const nativeCollection = db.collection(collectionName);

      // Escape special regex characters
      const escapedName = departmentName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Find department by name (case-insensitive exact match)
      const department = await nativeCollection.findOne({
        name: { $regex: `^${escapedName}$`, $options: 'i' }
      });

      if (!department) {
        throw new NotFoundException(`Department with name "${departmentName}" not found`);
      }

      return department;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      // Handle buffering timeout errors
      if (error.message && error.message.includes('buffering timed out')) {
        throw new BadRequestException(
          'Database connection timeout. Please try again.',
        );
      }
      // Re-throw other errors
      throw error;
    }
  }

  async updateDepartment(departmentId: string, dto: UpdateDepartmentDto) {
      if (!Types.ObjectId.isValid(departmentId)) {
      throw new BadRequestException(`Invalid department ID format: "${departmentId}"`);
    }

    const department = await this.departmentModel.findById(departmentId);
    if (!department) {
      throw new NotFoundException(`Department with ID "${departmentId}" not found`);
    }

    const before = department.toObject();

    if (dto.name !== undefined) department.name = dto.name;
    if (dto.description !== undefined) department.description = dto.description;
    if (dto.headPositionId !== undefined) {
      department.headPositionId = dto.headPositionId
        ? new Types.ObjectId(dto.headPositionId)
        : undefined;
    }

    await department.save();

      await this.logChange({
        action: ChangeLogAction.UPDATED,
        entityType: 'Department',
      entityId: department._id,
        performedByEmployeeId: dto.performedByEmployeeId,
        beforeSnapshot: before,
      afterSnapshot: department.toObject(),
      summary: `Department ${department.code} updated`,
    });

    return department.toObject();
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
      summary: dto.reason || `Department ${department.code} deactivated`,
    });

    return department.toObject();
  }

  async reactivateDepartment(departmentId: string, dto: DeactivateEntityDto) {
    const department = await this.departmentModel.findById(departmentId);
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    if (department.isActive) {
      return department.toObject();
    }

    const before = department.toObject();
    department.isActive = true;
    await department.save();

    await this.logChange({
      action: ChangeLogAction.UPDATED,
      entityType: 'Department',
      entityId: department._id,
      performedByEmployeeId: dto.performedByEmployeeId,
      beforeSnapshot: before,
      afterSnapshot: department.toObject(),
      summary: dto.reason || `Department ${department.code} reactivated`,
    });

    return department.toObject();
  }

  // ==================== POSITION METHODS ====================

  async getAllPositions(names?: string | string[]) {
    try {
      const db = this.connection.db;
      if (!db) {
        throw new BadRequestException('Database connection not available');
      }

      const positionCollection = db.collection('positions');
      
      // Build query filter
      const filter: any = {};
      
      // If names provided, filter by title (case-insensitive)
      if (names) {
        const nameArray = Array.isArray(names) ? names : [names];
        if (nameArray.length > 0) {
          // Use case-insensitive regex for matching
          // If single name, use regex directly; if multiple, use $or with regex
          if (nameArray.length === 1) {
            const escapedName = nameArray[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.title = { $regex: `^${escapedName}$`, $options: 'i' };
          } else {
            // Multiple names - use $or with regex for each
            filter.$or = nameArray.map(name => {
              const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              return { title: { $regex: `^${escapedName}$`, $options: 'i' } };
            });
          }
        }
      }

      const positions = await positionCollection.find(filter).toArray();
      
      return positions;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Handle buffering timeout errors
      if (error.message && error.message.includes('buffering timed out')) {
        throw new BadRequestException(
          'Database connection timeout. Please try again.',
        );
      }
      // Re-throw other errors
      throw error;
    }
  }

  async getPositionById(positionId: string) {
    if (!Types.ObjectId.isValid(positionId)) {
      throw new BadRequestException(`Invalid position ID format: "${positionId}"`);
    }

    const position = await this.positionModel.findById(positionId).lean().exec();

    if (!position) {
      throw new NotFoundException(`Position with ID "${positionId}" not found`);
    }

    return position;
  }

  async getPositionByName(positionName: string) {
    try {
      if (!positionName || positionName.trim().length === 0) {
        throw new BadRequestException('Position name (title) is required');
      }

      const db = this.connection.db;
      if (!db) {
        throw new BadRequestException('Database connection not available');
      }

      const positionCollection = db.collection('positions');

      // Escape special regex characters
      const escapedName = positionName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Find position by title (case-insensitive exact match)
      const position = await positionCollection.findOne({
        title: { $regex: `^${escapedName}$`, $options: 'i' }
      });

      if (!position) {
        throw new NotFoundException(`Position with name "${positionName}" not found`);
      }

      return position;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      // Handle buffering timeout errors
      if (error.message && error.message.includes('buffering timed out')) {
        throw new BadRequestException(
          'Database connection timeout. Please try again.',
        );
      }
      // Re-throw other errors
      throw error;
    }
  }

  async createPosition(dto: CreatePositionDto) {
    try {
      // CRITICAL: The Position schema's pre-save hook (line 69) uses model(Department.name)
      // which requires Department to be registered in Mongoose's global registry.
      // We MUST ensure it's registered on BOTH the connection AND global registry
      const mongoose = require('mongoose');
      
      // Register on the connection first
      if (!this.connection.models[Department.name]) {
        this.connection.model(Department.name, DepartmentSchema);
      }
      
      // Also register in global registry (for the pre-save hook)
      if (!mongoose.models || !mongoose.models[Department.name]) {
        mongoose.model(Department.name, DepartmentSchema);
      }

      // Resolve department: if departmentName is provided, look it up; otherwise use departmentId
      let departmentId: string;
      if (dto.departmentName) {
        const department = await this.findDepartmentByName(dto.departmentName);
        if (!department) {
          throw new NotFoundException(
            `Department with name "${dto.departmentName}" not found`,
          );
        }
        departmentId = String(department._id);
      } else if (dto.departmentId) {
        departmentId = dto.departmentId;
      } else {
        throw new BadRequestException(
          'Either departmentId or departmentName must be provided',
        );
      }

      // Validate department exists using native MongoDB (bypasses buffering)
      // If this succeeds, the connection is definitely working
      await this.ensureDepartmentExists(departmentId);

      // Get the department head position to set reportsToPositionId
      // We'll calculate this ourselves to avoid the pre-save hook timeout
      let reportsToPositionId: Types.ObjectId | undefined = undefined;
      if (dto.reportsToPositionId) {
        reportsToPositionId = new Types.ObjectId(dto.reportsToPositionId);
        } else {
        // Get the department head position using native MongoDB to avoid timeout
        try {
          const db = this.connection.db;
          if (!db) {
            throw new BadRequestException('Database connection not available');
          }
          
          const collectionName = this.departmentModel.collection.collectionName;
          const nativeCollection = db.collection(collectionName);
          
          const department = await nativeCollection.findOne(
            { _id: new Types.ObjectId(departmentId) },
            { projection: { headPositionId: 1 } }
          );
          
          if (department?.headPositionId) {
            reportsToPositionId = department.headPositionId;
          }
        } catch (headQueryError) {
          console.error('Failed to fetch department head position:', headQueryError);
          // Don't fail here - we'll proceed without reportsToPositionId
        }
      }

      // Use native MongoDB insertion to bypass Mongoose pre-save hook that's causing timeouts
      // This avoids the timeout issue in the pre-save hook
      const db = this.connection.db;
      if (!db) {
        throw new BadRequestException('Database connection not available');
      }

      const positionCollection = db.collection('positions');
      
      // Check for duplicate code first
      const existingPosition = await positionCollection.findOne({ code: dto.code });
      if (existingPosition) {
        throw new BadRequestException(
          `Position with code "${dto.code}" already exists`,
        );
      }

      const positionData = {
        code: dto.code,
        title: dto.title,
        description: dto.description || null,
        departmentId: new Types.ObjectId(departmentId),
        reportsToPositionId: reportsToPositionId || null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Insert using native MongoDB
      let insertResult;
      try {
        insertResult = await positionCollection.insertOne(positionData);
      } catch (insertError) {
        // Handle duplicate key errors
        if (insertError.code === 11000) {
          const field = Object.keys(insertError.keyPattern || {})[0] || 'field';
          throw new BadRequestException(
            `Position with ${field} '${insertError.keyValue?.[field] || 'value'}' already exists`,
          );
        }
        throw insertError;
      }
      
      if (!insertResult.insertedId) {
        throw new BadRequestException('Failed to create position');
      }

      // Load the created position as a Mongoose document for return
      const position = await this.positionModel.findById(insertResult.insertedId);
      if (!position) {
        throw new BadRequestException('Position created but could not be retrieved');
      }

      await this.logChange({
        action: ChangeLogAction.CREATED,
        entityType: 'Position',
        entityId: position._id,
        performedByEmployeeId: dto.performedByEmployeeId,
        afterSnapshot: position.toObject(),
        summary: `Position ${position.code} created`,
      });

      return position.toObject();
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      // Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0] || 'field';
        throw new BadRequestException(
          `Position with ${field} '${error.keyValue?.[field] || 'value'}' already exists`,
        );
      }
      // Handle buffering timeout errors
      if (error.message && error.message.includes('buffering timed out')) {
        throw new BadRequestException(
          'Database connection timeout. Please ensure the department exists and try again.',
        );
      }
      // Re-throw other errors
      throw error;
    }
  }

  async updatePosition(positionId: string, dto: UpdatePositionDto) {
    try {
      if (!Types.ObjectId.isValid(positionId)) {
        throw new BadRequestException(`Invalid position ID format: "${positionId}"`);
      }

      // Get the current position to check if it exists and get the before snapshot
      const position = await this.positionModel.findById(positionId);
      if (!position) {
        throw new NotFoundException(`Position with ID "${positionId}" not found`);
      }

      const before = position.toObject();

      // Resolve department: try departmentId first, then fallback to departmentName
      let newDepartmentId: string | undefined;
      if (dto.departmentId) {
        try {
          // Try to find by ID first
        await this.ensureDepartmentExists(dto.departmentId);
          newDepartmentId = dto.departmentId;
        } catch (error) {
          // If departmentId not found and departmentName is provided, try by name
          if (dto.departmentName) {
            const department = await this.findDepartmentByName(dto.departmentName);
            if (!department) {
              throw new NotFoundException(
                `Department with ID "${dto.departmentId}" not found, and department with name "${dto.departmentName}" also not found`,
              );
            }
            newDepartmentId = String(department._id);
          } else {
            // Re-throw the original error if no departmentName to fallback to
            throw error;
          }
        }
      } else if (dto.departmentName) {
        // Only departmentName provided
        const department = await this.findDepartmentByName(dto.departmentName);
        if (!department) {
          throw new NotFoundException(
            `Department with name "${dto.departmentName}" not found`,
          );
        }
        newDepartmentId = String(department._id);
      }

      // Validate new department if provided
      if (newDepartmentId && newDepartmentId !== String(position.departmentId)) {
        await this.ensureDepartmentExists(newDepartmentId);
      }

      // Get the department head position if department changed and reportsToPositionId not provided
      let reportsToPositionId: Types.ObjectId | undefined | null = undefined;
      if (newDepartmentId && newDepartmentId !== String(position.departmentId)) {
        // Department changed - get the new department's head position
        try {
          const db = this.connection.db;
          if (!db) {
            throw new BadRequestException('Database connection not available');
          }
          
          const collectionName = this.departmentModel.collection.collectionName;
          const nativeCollection = db.collection(collectionName);
          
          const department = await nativeCollection.findOne(
            { _id: new Types.ObjectId(newDepartmentId) },
            { projection: { headPositionId: 1 } }
          );
          
          if (department?.headPositionId) {
            reportsToPositionId = department.headPositionId;
          } else {
            reportsToPositionId = null;
          }
        } catch (headQueryError) {
          console.error('Failed to fetch department head position:', headQueryError);
          reportsToPositionId = null;
        }
      } else if (dto.reportsToPositionId !== undefined) {
        // reportsToPositionId explicitly provided in DTO
        reportsToPositionId = dto.reportsToPositionId
          ? new Types.ObjectId(dto.reportsToPositionId)
          : null;
      }

      // Use native MongoDB update to bypass Mongoose pre-save hook
      const db = this.connection.db;
      if (!db) {
        throw new BadRequestException('Database connection not available');
      }

      const positionCollection = db.collection('positions');
      const updateData: any = {
        updatedAt: new Date(),
      };

      // Build update object
      if (newDepartmentId && newDepartmentId !== String(position.departmentId)) {
        updateData.departmentId = new Types.ObjectId(newDepartmentId);
      }
      if (dto.title !== undefined) {
        updateData.title = dto.title;
      }
      if (dto.description !== undefined) {
        updateData.description = dto.description || null;
      }
      if (reportsToPositionId !== undefined) {
        updateData.reportsToPositionId = reportsToPositionId;
      }
      if (typeof dto.isActive === 'boolean') {
        updateData.isActive = dto.isActive;
      }

      // Perform the update
      const updateResult = await positionCollection.updateOne(
        { _id: new Types.ObjectId(positionId) },
        { $set: updateData }
      );

      if (updateResult.matchedCount === 0) {
        throw new NotFoundException(`Position with ID "${positionId}" not found`);
      }

      // Load the updated position
      const updatedPosition = await this.positionModel.findById(positionId);
      if (!updatedPosition) {
        throw new BadRequestException('Position updated but could not be retrieved');
      }

      await this.logChange({
        action: ChangeLogAction.UPDATED,
        entityType: 'Position',
        entityId: updatedPosition._id,
        performedByEmployeeId: dto.performedByEmployeeId,
        beforeSnapshot: before,
        afterSnapshot: updatedPosition.toObject(),
        summary: `Position ${updatedPosition.code} updated`,
      });

      return updatedPosition.toObject();
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      // Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0] || 'field';
        throw new BadRequestException(
          `Position with ${field} '${error.keyValue?.[field] || 'value'}' already exists`,
        );
      }
      // Handle buffering timeout errors
      if (error.message && error.message.includes('buffering timed out')) {
        throw new BadRequestException(
          'Database connection timeout. Please try again.',
        );
      }
      // Re-throw other errors
      throw error;
    }
  }

  async deactivatePosition(positionId: string, dto: DeactivateEntityDto) {
    try {
      if (!Types.ObjectId.isValid(positionId)) {
        throw new BadRequestException(`Invalid position ID format: "${positionId}"`);
      }

      const position = await this.positionModel.findById(positionId);
      if (!position) {
        throw new NotFoundException(`Position with ID "${positionId}" not found`);
      }

      if (!position.isActive) {
        return position.toObject();
      }

      const before = position.toObject();

      // Use native MongoDB update to bypass Mongoose pre-save hook
      const db = this.connection.db;
      if (!db) {
        throw new BadRequestException('Database connection not available');
      }

      const positionCollection = db.collection('positions');
      const closureDate = dto.endDate ? new Date(dto.endDate) : new Date();

      // Update position to inactive
      const updateResult = await positionCollection.updateOne(
        { _id: new Types.ObjectId(positionId) },
        { 
          $set: { 
            isActive: false,
            updatedAt: new Date(),
          } 
        }
      );

      if (updateResult.matchedCount === 0) {
        throw new NotFoundException(`Position with ID "${positionId}" not found`);
      }

      // Update assignments
      await this.assignmentModel.updateMany(
        {
          positionId: position._id,
          $or: [{ endDate: { $exists: false } }, { endDate: null }],
        },
        { endDate: closureDate },
      );

      // Load the updated position
      const updatedPosition = await this.positionModel.findById(positionId);
      if (!updatedPosition) {
        throw new BadRequestException('Position deactivated but could not be retrieved');
      }

      await this.logChange({
        action: ChangeLogAction.DEACTIVATED,
        entityType: 'Position',
        entityId: updatedPosition._id,
        performedByEmployeeId: dto.performedByEmployeeId,
        beforeSnapshot: before,
        afterSnapshot: updatedPosition.toObject(),
        summary: dto.reason || `Position ${updatedPosition.code} deactivated`,
      });

      return updatedPosition.toObject();
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      // Handle buffering timeout errors
      if (error.message && error.message.includes('buffering timed out')) {
        throw new BadRequestException(
          'Database connection timeout. Please try again.',
        );
      }
      // Re-throw other errors
      throw error;
    }
  }

  async reactivatePosition(positionId: string, dto: DeactivateEntityDto) {
    try {
      if (!Types.ObjectId.isValid(positionId)) {
        throw new BadRequestException(`Invalid position ID format: "${positionId}"`);
      }

      const position = await this.positionModel.findById(positionId);
      if (!position) {
        throw new NotFoundException(`Position with ID "${positionId}" not found`);
      }

      if (position.isActive) {
        return position.toObject();
      }

      const before = position.toObject();

      // Use native MongoDB update to bypass Mongoose pre-save hook
      const db = this.connection.db;
      if (!db) {
        throw new BadRequestException('Database connection not available');
      }

      const positionCollection = db.collection('positions');

      // Update position to active
      const updateResult = await positionCollection.updateOne(
        { _id: new Types.ObjectId(positionId) },
        { 
          $set: { 
            isActive: true,
            updatedAt: new Date(),
          } 
        }
      );

      if (updateResult.matchedCount === 0) {
        throw new NotFoundException(`Position with ID "${positionId}" not found`);
      }

      // Load the updated position
      const updatedPosition = await this.positionModel.findById(positionId);
      if (!updatedPosition) {
        throw new BadRequestException('Position reactivated but could not be retrieved');
      }

      await this.logChange({
        action: ChangeLogAction.UPDATED,
        entityType: 'Position',
        entityId: updatedPosition._id,
        performedByEmployeeId: dto.performedByEmployeeId,
        beforeSnapshot: before,
        afterSnapshot: updatedPosition.toObject(),
        summary: dto.reason || `Position ${updatedPosition.code} reactivated`,
      });

      return updatedPosition.toObject();
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      // Handle buffering timeout errors
      if (error.message && error.message.includes('buffering timed out')) {
        throw new BadRequestException(
          'Database connection timeout. Please try again.',
        );
      }
      // Re-throw other errors
      throw error;
    }
  }

  // ==================== STRUCTURE CHANGE REQUEST METHODS ====================

  async createStructureChangeRequest(dto: CreateStructureChangeRequestDto) {
    try {
      // Resolve targetDepartmentId: try targetDepartmentId first, then fallback to targetDepartmentName
      let targetDepartmentId: Types.ObjectId | undefined = undefined;
      if (dto.targetDepartmentId) {
        try {
          // Validate ObjectId format first
          if (!Types.ObjectId.isValid(dto.targetDepartmentId)) {
            throw new BadRequestException(`Invalid department ID format: "${dto.targetDepartmentId}"`);
          }
          // Try to find by ID first
          await this.ensureDepartmentExists(dto.targetDepartmentId);
          targetDepartmentId = new Types.ObjectId(dto.targetDepartmentId);
        } catch (error) {
          // If targetDepartmentId not found and targetDepartmentName is provided, try by name
          if (dto.targetDepartmentName && (error instanceof NotFoundException || error instanceof BadRequestException)) {
            const department = await this.findDepartmentByName(dto.targetDepartmentName);
            if (!department) {
              throw new NotFoundException(
                `Department with ID "${dto.targetDepartmentId}" not found, and department with name "${dto.targetDepartmentName}" also not found`,
              );
            }
            targetDepartmentId = department._id;
          } else {
            // Re-throw the original error if no targetDepartmentName to fallback to
            throw error;
          }
        }
      } else if (dto.targetDepartmentName) {
        // Only targetDepartmentName provided
        const department = await this.findDepartmentByName(dto.targetDepartmentName);
        if (!department) {
          throw new NotFoundException(
            `Department with name "${dto.targetDepartmentName}" not found`,
          );
        }
        targetDepartmentId = department._id;
      }

      // Use native MongoDB insertion to avoid Mongoose save issues
      const db = this.connection.db;
      if (!db) {
        throw new BadRequestException('Database connection not available');
      }

      const collectionName = this.changeRequestModel.collection.collectionName;
      const requestCollection = db.collection(collectionName);

      // Check for duplicate requestNumber first
      const existingRequest = await requestCollection.findOne({ requestNumber: dto.requestNumber });
      if (existingRequest) {
        throw new BadRequestException(
          `Structure change request with number "${dto.requestNumber}" already exists`,
        );
      }

      const requestData = {
        requestNumber: dto.requestNumber,
        requestedByEmployeeId: new Types.ObjectId(dto.requestedByEmployeeId),
        requestType: dto.requestType,
        targetDepartmentId: targetDepartmentId || null,
        targetPositionId: dto.targetPositionId
          ? new Types.ObjectId(dto.targetPositionId)
          : null,
        details: dto.details || null,
        reason: dto.reason || null,
        status: StructureRequestStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Insert using native MongoDB
      let insertResult;
      try {
        insertResult = await requestCollection.insertOne(requestData);
      } catch (insertError) {
        // Handle duplicate key errors
        if (insertError.code === 11000) {
          const field = Object.keys(insertError.keyPattern || {})[0] || 'field';
          throw new BadRequestException(
            `Structure change request with ${field} '${insertError.keyValue?.[field] || 'value'}' already exists`,
          );
        }
        throw insertError;
      }

      if (!insertResult.insertedId) {
        throw new BadRequestException('Failed to create structure change request');
      }

      // Build the response object directly from inserted data
      const createdRequest = {
        _id: insertResult.insertedId,
        requestNumber: dto.requestNumber,
        requestedByEmployeeId: new Types.ObjectId(dto.requestedByEmployeeId),
        requestType: dto.requestType,
        targetDepartmentId: targetDepartmentId || null,
        targetPositionId: dto.targetPositionId
          ? new Types.ObjectId(dto.targetPositionId)
          : null,
        details: dto.details || null,
        reason: dto.reason || null,
        status: StructureRequestStatus.DRAFT,
        createdAt: requestData.createdAt,
        updatedAt: requestData.updatedAt,
      };

      await this.logChange({
        action: ChangeLogAction.CREATED,
        entityType: 'StructureChangeRequest',
        entityId: insertResult.insertedId,
        performedByEmployeeId: dto.requestedByEmployeeId,
        afterSnapshot: createdRequest,
        summary: `Change request ${dto.requestNumber} created`,
      });

      return createdRequest;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      // Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0] || 'field';
        throw new BadRequestException(
          `Structure change request with ${field} '${error.keyValue?.[field] || 'value'}' already exists`,
        );
      }
      // Handle validation errors
      if (error.message) {
        console.error('Error creating structure change request:', error.message);
        throw new BadRequestException(
          `Failed to create structure change request: ${error.message}`,
        );
      }
      // Re-throw other errors
      throw error;
    }
  }

  async submitStructureChangeRequest(
    requestId: string,
    dto: SubmitStructureChangeRequestDto,
  ) {
    try {
      if (!Types.ObjectId.isValid(requestId)) {
        throw new BadRequestException(`Invalid request ID format: "${requestId}"`);
      }

      // Use native MongoDB to find the request (since it might have been created with native insertion)
      const db = this.connection.db;
      if (!db) {
        throw new BadRequestException('Database connection not available');
      }

      const collectionName = this.changeRequestModel.collection.collectionName;
      const requestCollection = db.collection(collectionName);

      // Find the request using native MongoDB
      const requestDoc = await requestCollection.findOne({ _id: new Types.ObjectId(requestId) });
      if (!requestDoc) {
        throw new NotFoundException('Structure change request not found');
      }

      if (requestDoc.status !== StructureRequestStatus.DRAFT) {
        throw new BadRequestException('Only drafts can be submitted');
      }

      const before = { ...requestDoc };

      const submittedAt = dto.submittedAt ? new Date(dto.submittedAt) : new Date();

      const updateResult = await requestCollection.updateOne(
        { _id: new Types.ObjectId(requestId) },
        {
          $set: {
            status: StructureRequestStatus.SUBMITTED,
            submittedByEmployeeId: new Types.ObjectId(dto.submittedByEmployeeId),
            submittedAt: submittedAt,
            updatedAt: new Date(),
          },
        }
      );

      if (updateResult.matchedCount === 0) {
        throw new NotFoundException('Structure change request not found');
      }

      // Load the updated request using native MongoDB
      const updatedRequestDoc = await requestCollection.findOne({ _id: new Types.ObjectId(requestId) });
      if (!updatedRequestDoc) {
        throw new BadRequestException('Request updated but could not be retrieved');
      }

      await this.logChange({
        action: ChangeLogAction.UPDATED,
        entityType: 'StructureChangeRequest',
        entityId: updatedRequestDoc._id,
        performedByEmployeeId: dto.submittedByEmployeeId,
        beforeSnapshot: before,
        afterSnapshot: updatedRequestDoc,
        summary: `Change request ${updatedRequestDoc.requestNumber} submitted`,
      });

      return updatedRequestDoc;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      // Handle buffering timeout errors
      if (error.message && error.message.includes('buffering timed out')) {
        throw new BadRequestException(
          'Database connection timeout. Please try again.',
        );
      }
      // Re-throw other errors
      throw error;
    }
  }

  async updateStructureRequestStatus(
    requestId: string,
    dto: UpdateStructureRequestStatusDto,
  ) {
    try {
      if (!Types.ObjectId.isValid(requestId)) {
        throw new BadRequestException(`Invalid request ID format: "${requestId}"`);
      }

      // Use native MongoDB to find the request (since it might have been created with native insertion)
      const db = this.connection.db;
      if (!db) {
        throw new BadRequestException('Database connection not available');
      }

      const collectionName = this.changeRequestModel.collection.collectionName;
      const requestCollection = db.collection(collectionName);

      // Find the request using native MongoDB
      const requestDoc = await requestCollection.findOne({ _id: new Types.ObjectId(requestId) });
      if (!requestDoc) {
        throw new NotFoundException('Structure change request not found');
      }

      // Allow flexible status changes - no transition validation
      // The function is designed to change status flexibly

      const before = { ...requestDoc };

      const updateResult = await requestCollection.updateOne(
        { _id: new Types.ObjectId(requestId) },
        {
          $set: {
            status: dto.status,
            updatedAt: new Date(),
          },
        }
      );

      if (updateResult.matchedCount === 0) {
        throw new NotFoundException('Structure change request not found');
      }

      // Load the updated request using native MongoDB
      const updatedRequestDoc = await requestCollection.findOne({ _id: new Types.ObjectId(requestId) });
      if (!updatedRequestDoc) {
        throw new BadRequestException('Request updated but could not be retrieved');
      }

      await this.logChange({
        action: ChangeLogAction.UPDATED,
        entityType: 'StructureChangeRequest',
        entityId: updatedRequestDoc._id,
        performedByEmployeeId: dto.performedByEmployeeId,
        beforeSnapshot: before,
        afterSnapshot: updatedRequestDoc,
        summary: dto.summary || `Change request ${updatedRequestDoc.requestNumber} moved to ${dto.status}`,
      });

      return updatedRequestDoc;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      // Handle buffering timeout errors
      if (error.message && error.message.includes('buffering timed out')) {
        throw new BadRequestException(
          'Database connection timeout. Please try again.',
        );
      }
      // Re-throw other errors
      throw error;
    }
  }

  async recordApprovalDecision(
    requestId: string,
    dto: RecordApprovalDecisionDto,
  ) {
    try {
      if (!Types.ObjectId.isValid(requestId)) {
        throw new BadRequestException(`Invalid request ID format: "${requestId}"`);
      }

      // Use native MongoDB to verify the request exists (since it might have been created with native insertion)
      const db = this.connection.db;
      if (!db) {
        throw new BadRequestException('Database connection not available');
      }

      const requestCollectionName = this.changeRequestModel.collection.collectionName;
      const requestCollection = db.collection(requestCollectionName);

      // Check if request exists using native MongoDB
      const requestExists = await requestCollection.findOne({ _id: new Types.ObjectId(requestId) });
      if (!requestExists) {
        throw new NotFoundException('Structure change request not found');
      }

      // Use native MongoDB for approval upsert
      const approvalCollectionName = this.approvalModel.collection.collectionName;
      const approvalCollection = db.collection(approvalCollectionName);

      const changeRequestId = new Types.ObjectId(requestId);
      const approverEmployeeId = new Types.ObjectId(dto.approverEmployeeId);
      const decidedAt = dto.decidedAt ? new Date(dto.decidedAt) : new Date();

      // Find existing approval or prepare new one
      const existingApproval = await approvalCollection.findOne({
        changeRequestId: changeRequestId,
        approverEmployeeId: approverEmployeeId,
      });

      let approval;
      if (existingApproval) {
        // Update existing approval
        const updateResult = await approvalCollection.updateOne(
          {
            changeRequestId: changeRequestId,
            approverEmployeeId: approverEmployeeId,
          },
          {
            $set: {
            decision: dto.decision,
              decidedAt: decidedAt,
              comments: dto.comments || null,
              updatedAt: new Date(),
            },
          }
        );

        if (updateResult.matchedCount === 0) {
          throw new BadRequestException('Failed to update approval decision');
        }

        approval = await approvalCollection.findOne({
          changeRequestId: changeRequestId,
          approverEmployeeId: approverEmployeeId,
        });
      } else {
        // Insert new approval
        const approvalData = {
          changeRequestId: changeRequestId,
          approverEmployeeId: approverEmployeeId,
          decision: dto.decision,
          decidedAt: decidedAt,
          comments: dto.comments || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const insertResult = await approvalCollection.insertOne(approvalData);
        if (!insertResult.insertedId) {
          throw new BadRequestException('Failed to create approval decision');
        }

        approval = await approvalCollection.findOne({ _id: insertResult.insertedId });
      }

      if (!approval) {
        throw new BadRequestException('Approval decision recorded but could not be retrieved');
      }

      await this.logChange({
        action: ChangeLogAction.UPDATED,
        entityType: 'StructureApproval',
        entityId: approval._id,
        performedByEmployeeId: dto.approverEmployeeId,
        afterSnapshot: approval,
        summary: `Approval decision recorded as ${dto.decision}`,
      });

      return approval;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      // Handle buffering timeout errors
      if (error.message && error.message.includes('buffering timed out')) {
        throw new BadRequestException(
          'Database connection timeout. Please try again.',
        );
      }
      // Re-throw other errors
      throw error;
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private async ensureDepartmentExists(departmentId: string) {
    try {
      // Use native MongoDB collection to bypass Mongoose buffering
      const db = this.connection.db;
      if (!db) {
        throw new BadRequestException('Database connection not available');
      }

      const collectionName = this.departmentModel.collection.collectionName;
      const nativeCollection = db.collection(collectionName);

      const objectId = new Types.ObjectId(departmentId);
      const department = await nativeCollection.findOne({ _id: objectId });

      if (!department) {
        throw new NotFoundException('Department not found');
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      // Handle connection errors
      if (error.message && (error.message.includes('buffering timed out') ||
          error.message.includes('timeout'))) {
        throw new BadRequestException(
          'Database connection timeout. Please check your MongoDB connection and try again.',
        );
      }
      throw error;
    }
  }

  /**
   * Find a department by its name.
   * Uses native MongoDB to bypass Mongoose buffering issues.
   * @param departmentName - The name of the department to find
   * @returns The department document with _id, or null if not found
   */
  private async findDepartmentByName(departmentName: string): Promise<{ _id: Types.ObjectId; name: string } | null> {
    try {
      // Use native MongoDB collection to bypass Mongoose buffering
      const db = this.connection.db;
      if (!db) {
        throw new BadRequestException('Database connection not available');
      }

      const collectionName = this.departmentModel.collection.collectionName;
      const nativeCollection = db.collection(collectionName);

      // Find department by name (case-insensitive search)
      const department = await nativeCollection.findOne(
        { name: { $regex: new RegExp(`^${departmentName}$`, 'i') } },
        { projection: { _id: 1, name: 1 } }
      );

      if (!department) {
        return null;
      }

      return {
        _id: department._id,
        name: department.name,
      };
    } catch (error) {
      // Handle connection errors
      if (error.message && (error.message.includes('buffering timed out') ||
          error.message.includes('timeout'))) {
        throw new BadRequestException(
          'Database connection timeout. Please check your MongoDB connection and try again.',
        );
      }
      throw error;
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
    performedByEmployeeId?: string | Types.ObjectId;
    beforeSnapshot?: unknown;
    afterSnapshot?: unknown;
    summary?: string;
  }) {
    try {
      const convertedEmployeeId = performedByEmployeeId
        ? typeof performedByEmployeeId === 'string'
          ? Types.ObjectId.isValid(performedByEmployeeId)
            ? new Types.ObjectId(performedByEmployeeId)
            : undefined
          : performedByEmployeeId
        : undefined;

      const changeLogData = {
        action,
        entityType,
        entityId: entityId instanceof Types.ObjectId ? entityId : new Types.ObjectId(entityId),
        performedByEmployeeId: convertedEmployeeId,
        beforeSnapshot: this.normalizeSnapshot(beforeSnapshot),
        afterSnapshot: this.normalizeSnapshot(afterSnapshot),
        summary,
      };

      const db = this.connection.db;
      if (!db) {
        throw new Error('Database connection not available');
      }

      const collectionName = this.changeLogModel.collection.collectionName;
      const nativeCollection = db.collection(collectionName);
      await nativeCollection.insertOne(changeLogData);
    } catch (error) {
      console.error('Error creating change log:', error);
    }
  }

  private normalizeSnapshot(
    snapshot?: unknown,
  ): Record<string, unknown> | undefined {
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
      return undefined;
    }
    return snapshot as Record<string, unknown>;
  }
}

