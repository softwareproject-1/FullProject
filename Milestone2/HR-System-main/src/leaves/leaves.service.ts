import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { LeaveType, LeaveTypeDocument } from './schemas/leave-type.schema';
import { LeaveCategory, LeaveCategoryDocument } from './schemas/leave-category.schema';
import { LeaveEntitlement, LeaveEntitlementDocument } from './schemas/leave-entitlement.schema';
import { LeavePolicy, LeavePolicyDocument } from './schemas/leave-policy.schema';
import { LeaveAdjustment, LeaveAdjustmentDocument } from './schemas/leave-adjustment.schema';
import { AdjustmentType } from './enums/adjustment-type.enum';
import { AddHolidayDto } from './dtos/add-holiday.dto';
import { BlockedDayDto } from './dtos/blocked-day.dto';
import { CreateLeaveTypeDto, ApprovalStepDto } from './dtos/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dtos/update-leave-type.dto';
import { EntitlementRuleDto } from './dtos/entitlement-rule.dto';
import { AccrualPolicyDto } from './dtos/accrual-policy.dto';
import { Calendar, CalendarDocument } from './schemas/calendar.schema';
import { LeaveRequest, LeaveRequestSchema } from './schemas/leave-request.schema';
import { AccrualMethod } from './enums/accrual-method.enum';
import { RoundingRule } from './enums/rounding-rule.enum';
// Seif's work - Additional imports
import { LeaveStatus } from './enums/leave-status.enum';
import { Attachment, AttachmentDocument } from './schemas/attachment.schema';
import { LeaveRequestDocument } from './schemas/leave-request.schema';
import { EmployeeProfileService } from '../employee-profile/employee-profile.service';
import { TimeManagementService } from '../time-management/time-management.service';
import { TimeExceptionType, ShiftAssignmentStatus } from '../time-management/models/enums/index';
import { employeePenalties, employeePenaltiesDocument } from '../payroll-execution/models/employeePenalties.schema';
import { payGrade, payGradeDocument } from '../payroll-configuration/models/payGrades.schema';
import { Position, PositionDocument } from '../organization-structure/models/position.schema';
import { Department, DepartmentDocument } from '../organization-structure/models/department.schema';
import { AttendanceRecord, AttendanceRecordDocument } from '../time-management/models/attendance-record.schema';
import { EmployeeProfile, EmployeeProfileDocument } from '../employee-profile/models/employee-profile.schema';
import { ContractType } from '../employee-profile/enums/employee-profile.enums';

import { PositionAssignment, PositionAssignmentDocument } from '../organization-structure/models/position-assignment.schema';
import { forwardRef, Inject } from '@nestjs/common';
//import { Model } from 'mongoose';
//import { NotFoundException, BadRequestException } from '@nestjs/common';



@Injectable()
export class LeavesService {
  constructor(
    // Omar's work - Original model injections
    @InjectModel(LeaveType.name)
    private leaveTypeModel: Model<LeaveTypeDocument>,
    @InjectModel(LeaveCategory.name)
    private leaveCategoryModel: Model<LeaveCategoryDocument>,
    @InjectModel(LeaveEntitlement.name)
    private leaveEntitlementModel: Model<LeaveEntitlementDocument>,
    @InjectModel(LeavePolicy.name)
    private leavePolicyModel: Model<LeavePolicyDocument>,
    @InjectModel(Calendar.name) // ✅ inject the calendar schema
    private calendarModel: Model<CalendarDocument>,
    @InjectModel(LeaveRequest.name)
    private leaveRequestModel: Model<LeaveRequest>,
    @InjectModel(LeaveAdjustment.name)
    private leaveAdjustmentModel: Model<LeaveAdjustmentDocument>,
    // Seif's work - Additional model injections
    @Inject(forwardRef(() => TimeManagementService))
    private timeManagementService: TimeManagementService,
    @InjectModel(Attachment.name)
    private attachmentModel: Model<AttachmentDocument>,
    @InjectModel(employeePenalties.name)
    private employeePenaltiesModel: Model<employeePenaltiesDocument>,
    @InjectModel(payGrade.name)
    private payGradeModel: Model<payGradeDocument>,
    @InjectModel(Position.name)
    private positionModel: Model<PositionDocument>,
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
    @InjectModel(AttendanceRecord.name)
    private attendanceRecordModel: Model<AttendanceRecordDocument>,
    @InjectModel(EmployeeProfile.name)
    private employeeModel: Model<EmployeeProfileDocument>,
    @InjectModel(PositionAssignment.name)
    private positionAssignmentModel: Model<PositionAssignmentDocument>,
    @InjectModel(EmployeeProfile.name)
    private readonly employeeProfileModel: Model<EmployeeProfileDocument>,
    // Seif's work - Service injections with forwardRef
    @Inject(forwardRef(() => EmployeeProfileService))
    private employeeProfileService: EmployeeProfileService,

    //private readonly employeeProfileService: EmployeeProfileService

  ) { }

  // ========== DELEGATION MAP (In-Memory) ==========
  // Stores delegation assignments: managerId -> delegation info
  // This avoids schema changes as per user requirement
  private delegationMap: Map<string, {
    managerId: string;
    delegateId: string;
    startDate: Date;
    endDate: Date | null; // null = indefinite
    isActive: boolean;
    status: 'pending' | 'accepted' | 'rejected'; // Delegation status: pending by default
  }> = new Map();

  // ========== DELEGATION METHODS ==========

  /**
   * Set delegation: Manager delegates approval authority to another employee
   * Uses in-memory map - no schema changes needed
   */
  async setDelegation(
    managerId: string,
    delegateId: string,
    startDate?: Date,
    endDate?: Date | null,
  ) {
    // Validate both employees exist
    // Normalize IDs to handle both string and ObjectId formats
    const normalizedManagerId = managerId.toString().trim();
    const normalizedDelegateId = delegateId.toString().trim();

    const [manager, delegate] = await Promise.all([
      this.employeeModel.findById(normalizedManagerId).exec(),
      this.employeeModel.findById(normalizedDelegateId).exec(),
    ]);

    if (!manager) {
      console.error(`Manager not found with ID: ${normalizedManagerId}`);
      throw new NotFoundException(`Manager not found with ID: ${normalizedManagerId}. Please verify the employee ID exists in the system.`);
    }
    if (!delegate) {
      console.error(`Delegate not found with ID: ${normalizedDelegateId}`);
      throw new NotFoundException(`Delegate employee not found with ID: ${normalizedDelegateId}. Please verify the employee ID exists in the system.`);
    }

    // Check if manager is actually a manager (has employees reporting to them)
    // This is optional validation - you can remove if not needed
    const hasReports = await this.employeeModel.findOne({
      supervisorPositionId: manager.primaryPositionId,
      status: 'ACTIVE'
    });

    if (!hasReports) {
      console.warn(`Manager ${normalizedManagerId} has no direct reports. Delegation still set.`);
    }

    // Normalize IDs for consistent storage and retrieval
    // Ensure dates are Date objects, not strings
    const normalizedStartDate = startDate ? (startDate instanceof Date ? startDate : new Date(startDate)) : new Date();
    const normalizedEndDate = endDate ? (endDate instanceof Date ? endDate : new Date(endDate)) : null;
    
    const key = normalizedManagerId;
    this.delegationMap.set(key, {
      managerId: normalizedManagerId,
      delegateId: normalizedDelegateId,
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      isActive: true,
      status: 'pending', // Default status when delegation is created
    });

    console.log(`Delegation set: Manager ${normalizedManagerId} -> Delegate ${normalizedDelegateId}`);
    console.log(`Delegation dates: Start=${normalizedStartDate.toISOString()}, End=${normalizedEndDate ? normalizedEndDate.toISOString() : 'null'}`);

    return {
      managerId: normalizedManagerId,
      delegateId: normalizedDelegateId,
      startDate: startDate || new Date(),
      endDate: endDate || null,
      status: 'pending',
      message: 'Delegation set successfully',
    };
  }

  /**
   * Revoke delegation for a manager
   * Revokes both in-memory and persistent delegations
   */
  async revokeDelegation(managerId: string) {
    const normalizedManagerId = managerId.toString().trim();
    const key = normalizedManagerId;
    
    // Revoke in-memory delegation
    const delegation = this.delegationMap.get(key);
    if (!delegation) {
      throw new NotFoundException(`No active delegation found for manager ${normalizedManagerId}`);
    }

    delegation.isActive = false;
    this.delegationMap.set(key, delegation);
    console.log(`Delegation revoked for manager ${normalizedManagerId}`);

    return { message: 'Delegation revoked successfully' };
  }

  /**
   * Accept delegation: Delegate accepts the delegation request
   * Only the delegate can accept their own delegation
   */
  async acceptDelegation(managerId: string, delegateId: string) {
    const normalizedManagerId = managerId.toString().trim();
    const normalizedDelegateId = delegateId.toString().trim();
    const key = normalizedManagerId;
    
    // Get delegation
    const delegation = this.delegationMap.get(key);
    if (!delegation) {
      throw new NotFoundException(`No delegation found for manager ${normalizedManagerId}`);
    }

    // Verify that the delegateId matches
    if (delegation.delegateId !== normalizedDelegateId) {
      throw new BadRequestException(`Delegation delegate ID does not match. Expected ${delegation.delegateId}, got ${normalizedDelegateId}`);
    }

    // Check if delegation is already rejected
    if (delegation.status === 'rejected') {
      throw new BadRequestException('Cannot accept a rejected delegation');
    }

    // Update status to accepted
    delegation.status = 'accepted';
    this.delegationMap.set(key, delegation);
    console.log(`Delegation accepted: Manager ${normalizedManagerId} -> Delegate ${normalizedDelegateId}`);

    return {
      managerId: normalizedManagerId,
      delegateId: normalizedDelegateId,
      status: 'accepted',
      message: 'Delegation accepted successfully',
    };
  }

  /**
   * Reject delegation: Delegate rejects the delegation request
   * Only the delegate can reject their own delegation
   */
  async rejectDelegation(managerId: string, delegateId: string) {
    const normalizedManagerId = managerId.toString().trim();
    const normalizedDelegateId = delegateId.toString().trim();
    const key = normalizedManagerId;
    
    // Get delegation
    const delegation = this.delegationMap.get(key);
    if (!delegation) {
      throw new NotFoundException(`No delegation found for manager ${normalizedManagerId}`);
    }

    // Verify that the delegateId matches
    if (delegation.delegateId !== normalizedDelegateId) {
      throw new BadRequestException(`Delegation delegate ID does not match. Expected ${delegation.delegateId}, got ${normalizedDelegateId}`);
    }

    // Update status to rejected
    delegation.status = 'rejected';
    delegation.isActive = false; // Deactivate when rejected
    this.delegationMap.set(key, delegation);
    console.log(`Delegation rejected: Manager ${normalizedManagerId} -> Delegate ${normalizedDelegateId}`);

    return {
      managerId: normalizedManagerId,
      delegateId: normalizedDelegateId,
      status: 'rejected',
      message: 'Delegation rejected successfully',
    };
  }

  /**
   * Get active delegate for a manager at a given date
   * Returns delegateId if delegation is active and accepted, otherwise returns managerId
   * Checks both in-memory and persistent delegations
   * This is used when setting approvalFlow[].decidedBy
   */
  private async getActiveDelegate(managerId: string, checkDate: Date = new Date()): Promise<string> {
    const normalizedManagerId = managerId.toString().trim();
    const key = normalizedManagerId;
    
    // Check in-memory delegation
    const inMemoryDelegation = this.delegationMap.get(key);
    if (inMemoryDelegation && inMemoryDelegation.isActive && inMemoryDelegation.status === 'accepted') {
      // Ensure dates are Date objects for comparison
      const startDate = inMemoryDelegation.startDate instanceof Date 
        ? inMemoryDelegation.startDate 
        : new Date(inMemoryDelegation.startDate);
      const endDate = inMemoryDelegation.endDate === null || inMemoryDelegation.endDate === undefined
        ? null
        : (inMemoryDelegation.endDate instanceof Date 
            ? inMemoryDelegation.endDate 
            : new Date(inMemoryDelegation.endDate));
      
      // Check date range
      if (checkDate >= startDate &&
          (endDate === null || checkDate <= endDate)) {
        return inMemoryDelegation.delegateId;
      }
    }

    // No active delegation found - return managerId
    return normalizedManagerId;
  }

  /**
   * Helper: Find manager for an employee and apply delegation if active
   * Returns the approver ID (manager or delegate) to be stored in approvalFlow[].decidedBy
   */
  private async findApproverWithDelegation(
    employeeId: string,
    requestDate: Date = new Date(),
  ): Promise<Types.ObjectId> {
    // Get employee profile
    const employee = await this.employeeModel
      .findById(employeeId)
      .populate('supervisorPositionId')
      .exec();

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Find manager through supervisor position
    const supervisorPosition = employee.supervisorPositionId;
    if (!supervisorPosition) {
      throw new BadRequestException('Employee has no supervisor assigned');
    }

    // Extract the ID safely (handle populated object vs raw ID)
    const supervisorPositionId = (supervisorPosition as any)._id
      ? (supervisorPosition as any)._id
      : supervisorPosition;

    // Find employee(s) in that supervisor position (Try both ObjectId and String to be safe)
    const managers = await this.employeeModel
      .find({
        $or: [
          { primaryPositionId: supervisorPositionId },
          { primaryPositionId: supervisorPositionId.toString() }
        ]
      })
      .exec();

    if (managers.length === 0) {
      // If no direct manager found, traverse up the hierarchy
      return await this.findUpperManagerInHierarchy(supervisorPositionId, requestDate);
    }

    // Use first manager
    const managerId = managers[0]._id.toString();

    // Check for active delegation - returns delegateId if active, otherwise managerId
    const actualApproverId = await this.getActiveDelegate(managerId, requestDate);

    // If delegation exists and delegate is different from manager, return delegate
    if (actualApproverId !== managerId) {
      return new Types.ObjectId(actualApproverId);
    }

    // If no delegation or delegate is same as manager, check if we should go up hierarchy
    // For now, return the manager. Hierarchy fallback can be added if needed.
    return new Types.ObjectId(managerId);
  }

  /**
   * Find upper manager in HR hierarchy when direct manager has no delegation
   * Traverses up the position hierarchy to find the next approver
   */
  private async findUpperManagerInHierarchy(
    positionId: any,
    requestDate: Date = new Date(),
    currentManagerId?: string,
  ): Promise<Types.ObjectId> {
    let currentPositionId = positionId;
    let depth = 0;
    const MAX_DEPTH = 5; // Prevent infinite loops

    while (currentPositionId && depth < MAX_DEPTH) {
      const position = await this.positionModel.findById(currentPositionId).exec();
      if (!position || !position.reportsToPositionId) {
        // Reached top of hierarchy - use current manager or throw error
        if (currentManagerId) {
          return new Types.ObjectId(currentManagerId);
        }
        throw new NotFoundException('No manager found in hierarchy');
      }

      // Find manager in the upper position
      const upperManagers = await this.employeeModel
        .find({ primaryPositionId: position.reportsToPositionId })
        .exec();

      if (upperManagers.length > 0) {
        const upperManagerId = upperManagers[0]._id.toString();
        
        // Check if upper manager has delegation
        const delegateId = await this.getActiveDelegate(upperManagerId, requestDate);
        
        if (delegateId !== upperManagerId) {
          // Upper manager has delegation - return delegate
          return new Types.ObjectId(delegateId);
        }
        
        // Upper manager has no delegation - return upper manager
        return new Types.ObjectId(upperManagerId);
      } else {
        // No manager in upper position - continue up
        currentPositionId = position.reportsToPositionId;
        depth++;
      }
    }

    // If we reach here and have a manager, return it
    if (currentManagerId) {
      return new Types.ObjectId(currentManagerId);
    }

    throw new NotFoundException('No manager found in hierarchy');
  }

  /**
   * Get delegation status for a manager
   * Checks both in-memory delegation and persistent delegation (PositionAssignment)
   */
  async getDelegationStatus(managerId: string) {
    const normalizedManagerId = managerId.toString().trim();
    const key = normalizedManagerId;
    
    console.log(`[DEBUG] getDelegationStatus called for managerId: ${normalizedManagerId}`);
    console.log(`[DEBUG] DelegationMap size: ${this.delegationMap.size}`);
    console.log(`[DEBUG] DelegationMap keys:`, Array.from(this.delegationMap.keys()));
    
    // Check in-memory delegation first
    const inMemoryDelegation = this.delegationMap.get(key);
    
    console.log(`[DEBUG] Found delegation:`, inMemoryDelegation ? 'YES' : 'NO');
    
    if (inMemoryDelegation) {
      console.log(`[DEBUG] Delegation details:`, {
        isActive: inMemoryDelegation.isActive,
        startDate: inMemoryDelegation.startDate,
        endDate: inMemoryDelegation.endDate,
        startDateType: typeof inMemoryDelegation.startDate,
        endDateType: typeof inMemoryDelegation.endDate,
      });
    }
    
    if (inMemoryDelegation && inMemoryDelegation.isActive) {
      const now = new Date();
      // Ensure dates are Date objects for comparison
      const startDate = inMemoryDelegation.startDate instanceof Date 
        ? inMemoryDelegation.startDate 
        : new Date(inMemoryDelegation.startDate);
      const endDate = inMemoryDelegation.endDate === null || inMemoryDelegation.endDate === undefined
        ? null
        : (inMemoryDelegation.endDate instanceof Date 
            ? inMemoryDelegation.endDate 
            : new Date(inMemoryDelegation.endDate));
      
      const isDateActive = now >= startDate &&
        (endDate === null || now <= endDate);

      console.log(`[DEBUG] Date check:`, {
        now: now.toISOString(),
        startDate: startDate.toISOString(),
        endDate: endDate ? endDate.toISOString() : 'null',
        isDateActive,
      });

      if (isDateActive) {
        return {
          hasDelegation: true,
          type: 'in-memory',
          isActive: true,
          status: inMemoryDelegation.status, // Include delegation status
          managerId: inMemoryDelegation.managerId,
          delegateId: inMemoryDelegation.delegateId,
          startDate: inMemoryDelegation.startDate,
          endDate: inMemoryDelegation.endDate,
        };
      } else {
        console.log(`[DEBUG] Delegation found but date check failed - delegation expired or not yet active`);
        // Return delegation info even if date check failed, but mark as inactive
        return {
          hasDelegation: true,
          type: 'in-memory',
          isActive: false,
          status: inMemoryDelegation.status,
          managerId: inMemoryDelegation.managerId,
          delegateId: inMemoryDelegation.delegateId,
          startDate: inMemoryDelegation.startDate,
          endDate: inMemoryDelegation.endDate,
        };
      }
    } else if (inMemoryDelegation) {
      // Delegation exists but is inactive
      console.log(`[DEBUG] Delegation found but is inactive`);
      return {
        hasDelegation: true,
        type: 'in-memory',
        isActive: false,
        status: inMemoryDelegation.status,
        managerId: inMemoryDelegation.managerId,
        delegateId: inMemoryDelegation.delegateId,
        startDate: inMemoryDelegation.startDate,
        endDate: inMemoryDelegation.endDate,
      };
    } else {
      console.log(`[DEBUG] No delegation found`);
    }

    return { hasDelegation: false };
  }

  //============================== Omar service methods ============================//
  //leave types(point 1)
  async createLeaveType(dto: CreateLeaveTypeDto) {
    // make sure the input category is an existing category if not found will throw error
    const category = await this.leaveCategoryModel.findById(dto.categoryId);
    if (!category) throw new BadRequestException('Leave category not found');

    // a method creating all leave type     
    const leaveType = new this.leaveTypeModel({
      ...dto, //take all the properties(attributes) from dto
      categoryId: new Types.ObjectId(dto.categoryId), //convert the string in categoryId to ObjectId
      attachmentType: dto.attachmentType ?? undefined, //if the attachement is not given it is set to undefined
    });
    return leaveType.save();
  }

  // Get all leave types
  async findAllLeaveTypes() {
    return this.leaveTypeModel.find().exec();
  }

  // Update leave type (Partial update)
  async updateLeaveType(id: string, dto: UpdateLeaveTypeDto) {
    // If categoryId is being updated, verify it exists
    if (dto.categoryId) {
      const category = await this.leaveCategoryModel.findById(dto.categoryId);
      if (!category) throw new BadRequestException('Leave category not found');
    }

    const updatedLeaveType = await this.leaveTypeModel.findByIdAndUpdate(
      id,
      {
        ...dto,
        // Convert categoryId to ObjectId if present
        ...(dto.categoryId && { categoryId: new Types.ObjectId(dto.categoryId) }),
      },
      { new: true }
    );

    if (!updatedLeaveType) {
      throw new NotFoundException('Leave type not found');
    }

    return updatedLeaveType;
  }


  //entitlement rules(point 2)
  //a method to set entitlement rule for a given leave type it take the leavetypeId and the entitlement rule dto as inputs
  async setEntitlementRule(leaveTypeId: string, dto: EntitlementRuleDto) {
    // Make sure the referenced leave type exists
    let leaveType;
    if (Types.ObjectId.isValid(leaveTypeId)) {
      leaveType = await this.leaveTypeModel.findById(leaveTypeId);
    } else {
      leaveType = await this.leaveTypeModel.findOne({ code: leaveTypeId });
    }

    if (!leaveType) {
      throw new NotFoundException('Leave type not found');
    }

    // Compose eligibility object from DTO - now includes ALL criteria
    const eligibility: Record<string, any> = {};

    if (dto.eligibilityCriteria) {
      // Tenure
      if (dto.eligibilityCriteria.minTenure !== undefined) {
        eligibility.minTenureMonths = dto.eligibilityCriteria.minTenure;
      }

      // Contract Type
      if (dto.eligibilityCriteria.contractType) {
        eligibility.contractTypesAllowed = [dto.eligibilityCriteria.contractType];
      }

      // Job Grade
      if (dto.eligibilityCriteria.grade) {
        eligibility.grade = dto.eligibilityCriteria.grade;
      }

      // Position (NEW)
      if (dto.eligibilityCriteria.positionsAllowed && dto.eligibilityCriteria.positionsAllowed.length > 0) {
        eligibility.positionsAllowed = dto.eligibilityCriteria.positionsAllowed;
      }

      // Location (NEW)
      if (dto.eligibilityCriteria.locationsAllowed && dto.eligibilityCriteria.locationsAllowed.length > 0) {
        eligibility.locationsAllowed = dto.eligibilityCriteria.locationsAllowed;
      }
    }

    //defines the leave policy based on leaveTypeId and eligibility criteria
    const leavePolicy = await this.leavePolicyModel.findOneAndUpdate(
      {
        //It finds an existing leave policy that matches both the leaveTypeId and the same eligibility rules.
        // If no such policy exists, a new one is created.
        leaveTypeId: leaveType._id,
        eligibility: eligibility,
      },
      {
        leaveTypeId: leaveType._id, //sets the leaveTypeId
        yearlyRate: dto.daysPerYear, //sets the days per year from dto
        eligibility: eligibility, //sets the eligibility criteria (now includes position & location)

        // ...add any other fields to set, such as accrual, etc.
      },
      { upsert: true, new: true } //creates a new leave policy if not found
    );
    return leavePolicy;
  }




  //personalized entitlement rules(point 2)
  async setPersonalizedEntitlement(
    employeeId: string,
    leaveTypeId: string,
    yearlyEntitlement: number,
    reason?: string
  ) {
    // Basic check if leave type exists (optional)
    //chcecks the leave type id is valid
    let leaveType;
    if (Types.ObjectId.isValid(leaveTypeId)) {
      leaveType = await this.leaveTypeModel.findById(leaveTypeId);
    } else {
      leaveType = await this.leaveTypeModel.findOne({ code: leaveTypeId });
    }

    if (!leaveType) {
      throw new NotFoundException('Leave type not found');
    }

    // Upsert LeaveEntitlement for employee+leaveType
    const updateData: any = {
      yearlyEntitlement, //takes the yearly entitlement as an a personalized exception
    };

    // Add reason if provided (for audit trail)
    if (reason) {
      updateData.reason = reason;
    }

    const entitlement = await this.leaveEntitlementModel.findOneAndUpdate(
      {
        //checks if the employeeId and leaveTypeId combination already exists
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: leaveType._id,
      },
      updateData,
      { new: true, upsert: true } // creates a new entitlement if not found (no valid employeeID or leaveTypeID)
    );
    return entitlement;
  }

  /**
   * Helper: Resolve employee IDs based on group criteria
   * Queries EmployeeProfile collection with filters for department, position, location, contract type
   */
  private async resolveEmployeesByGroup(criteria: any): Promise<string[]> {
    const query: any = { status: 'ACTIVE' }; // Only active employees

    // Filter by department IDs
    if (criteria.departmentIds && criteria.departmentIds.length > 0) {
      query.primaryDepartmentId = {
        $in: criteria.departmentIds.map(id => new Types.ObjectId(id))
      };
    }

    // Filter by position IDs
    if (criteria.positionIds && criteria.positionIds.length > 0) {
      query.primaryPositionId = {
        $in: criteria.positionIds.map(id => new Types.ObjectId(id))
      };
    }

    // Filter by locations (country field in address)
    if (criteria.locations && criteria.locations.length > 0) {
      query['address.country'] = { $in: criteria.locations };
    }

    // Filter by contract types
    if (criteria.contractTypes && criteria.contractTypes.length > 0) {
      query.contractType = { $in: criteria.contractTypes };
    }

    // Explicit employee IDs list (overrides other filters if provided)
    if (criteria.employeeIds && criteria.employeeIds.length > 0) {
      query._id = { $in: criteria.employeeIds.map(id => new Types.ObjectId(id)) };
    }

    const employees = await this.employeeModel.find(query).select('_id').exec();
    return employees.map(emp => emp._id.toString());
  }

  /**
   * Set personalized entitlement for a group of employees
   * Supports both individual assignment and group-based bulk assignment
   */
  async setPersonalizedEntitlementForGroup(dto: any): Promise<{
    assigned: number;
    employeeIds: string[];
    message: string;
  }> {
    let employeeIds: string[] = [];

    // Determine if this is individual or group assignment
    if (dto.employeeId) {
      // Individual assignment
      employeeIds = [dto.employeeId];
    } else if (dto.groupCriteria) {
      // Group assignment - resolve employees
      employeeIds = await this.resolveEmployeesByGroup(dto.groupCriteria);

      if (employeeIds.length === 0) {
        throw new BadRequestException('No employees match the specified group criteria');
      }
    } else {
      throw new BadRequestException('Either employeeId or groupCriteria must be provided');
    }

    // Apply personalized entitlement to all resolved employees
    const results: any[] = []; // Explicitly type to avoid 'never[]' inference
    for (const empId of employeeIds) {
      const entitlement = await this.setPersonalizedEntitlement(
        empId,
        dto.leaveTypeId,
        dto.yearlyEntitlement,
        dto.reason
      );
      results.push(entitlement);
    }

    return {
      assigned: employeeIds.length,
      employeeIds,
      message: `Successfully assigned personalized entitlement to ${employeeIds.length} employee(s)`,
    };
  }






  async getUnpaidLeaveMonths(employeeId: string): Promise<number> {
    let targetEmployeeId = employeeId;

    // Resolve employee ID if it's not a valid ObjectId (assuming it's an employeeNumber)
    if (!Types.ObjectId.isValid(employeeId)) {
      const emp = await this.employeeProfileModel.findOne({ employeeNumber: employeeId }).select('_id');
      if (emp) {
        targetEmployeeId = emp._id.toString();
      }
      // If not found, we let the query below run (it might return empty), 
      // or we could throw. But existing behavior implies we just count leaves.
      // However, passing invalid string to ObjectId in query will crash.
      // So we MUST have a valid ID here.
    }

    if (!Types.ObjectId.isValid(targetEmployeeId)) {
      // If we still don't have a valid ObjectId, return 0 (no leaves found for invalid user)
      return 0;
    }

    const unpaidLeaves = await this.leaveRequestModel.find({
      employeeId: new Types.ObjectId(targetEmployeeId),
      status: 'APPROVED',
      leaveType: 'UNPAID', // or match your unpaid leave type
    });

    let months = 0;
    unpaidLeaves.forEach((leave) => {
      const start = new Date(leave.dates.from);
      const end = new Date(leave.dates.to);
      months += (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    });

    return months;
  }















  // //accrual policy(point 3)
  // async calculateAccruedLeave(employeeId: string, leaveTypeId: string, monthsWorked: number, pauseDuringUnpaid: boolean) {
  //   const leavePolicy = await this.leavePolicyModel.findOne({ leaveTypeId: leaveTypeId });

  //   if (!leavePolicy) throw new NotFoundException('Leave policy not found');

  //   let accrued = 0;

  //   if (leavePolicy.accrualMethod === AccrualMethod.MONTHLY) {
  //     accrued = monthsWorked; // example: 1 day per month
  //   }

  //   // Pause accrual during unpaid leave
  //   const unpaidMonths = await this.getUnpaidLeaveMonths(employeeId); // fetch from leave requests
  //   if (pauseDuringUnpaid) { // runtime flag from DTO or cache
  //     accrued -= unpaidMonths;
  //   }

  //   return accrued;
  // }












  // employee-profile.service.ts
  async getEmployeeType(employeeId: string): Promise<'PERMANENT' | 'CONTRACT'> {
    let employee;
    if (Types.ObjectId.isValid(employeeId)) {
      employee = await this.employeeProfileModel.findById(employeeId);
    } else {
      employee = await this.employeeProfileModel.findOne({ employeeNumber: employeeId });
    }

    if (!employee) throw new NotFoundException('Employee not found');

    if (!employee.contractType) {
      return 'PERMANENT'; // default
    }

    // Map enum values to logical types
    switch (employee.contractType) {
      case ContractType.FULL_TIME_CONTRACT:
        return 'PERMANENT';
      case ContractType.PART_TIME_CONTRACT:
        return 'CONTRACT';
      default:
        throw new BadRequestException('Unknown contract type');
    }
  }



  //?? the selection criteria is not added in the schema how to add it or handle it ?
  // private pauseDuringUnpaidMap: Record<string, boolean> = {};
  // async configureAccrualPolicy(
  //   employeeId: string,
  //   leaveTypeId: string,
  //   monthsWorked: number,
  //   dto: AccrualPolicyDto
  // ) {
  //   const leaveType = await this.leaveTypeModel.findById(leaveTypeId);
  //   if (!leaveType) throw new NotFoundException('LeaveType not found');

  //   // Map resetDateType to numeric months if needed
  //   let expiryAfterMonths: number | undefined;
  //   switch (dto.resetDateType) {
  //     case 'annual':
  //       expiryAfterMonths = 12;
  //       break;
  //     case 'quarterly':
  //       expiryAfterMonths = 3;
  //       break;
  //     case 'monthly':
  //       expiryAfterMonths = 1;
  //       break;
  //     default:
  //       expiryAfterMonths = undefined;
  //   }

  //   const updateFields: any = {
  //     leaveTypeId: new Types.ObjectId(leaveTypeId),
  //     accrualMethod: dto.accrualRate,
  //     carryForwardAllowed: dto.carryOverCap > 0,
  //     maxCarryForward: dto.carryOverCap,
  //     expiryAfterMonths, // mapped value
  //     pauseDuringUnpaid: dto.pauseDuringUnpaid, // store flag in LeavePolicy
  //   };

  //   const netAccrued = await this.calculateAccruedLeave(
  //     employeeId,
  //     leaveTypeId,
  //     monthsWorked,
  //     dto.pauseDuringUnpaid
  //   );

  //   // Upsert LeavePolicy document with the new fields
  //   const res = await this.leavePolicyModel.findOneAndUpdate(
  //     { leaveTypeId: new Types.ObjectId(leaveTypeId) },
  //     updateFields,
  //     { upsert: true, new: true }
  //   );

  //   return res;
  // }



  private applyRounding(value: number, rule: RoundingRule = RoundingRule.NONE): number {
    switch (rule) {
      case RoundingRule.ROUND:
        return Math.round(value);
      case RoundingRule.ROUND_UP:
        return Math.ceil(value);
      case RoundingRule.ROUND_DOWN:
        return Math.floor(value);
      case RoundingRule.NONE:
      default:
        return value;
    }
  }



  async configureAccrualPolicy(
    employeeId: string,
    leaveTypeId: string,
    monthsWorked: number,
    dto: AccrualPolicyDto
  ) {
    let leaveType;
    if (Types.ObjectId.isValid(leaveTypeId)) {
      leaveType = await this.leaveTypeModel.findById(leaveTypeId);
    } else {
      // Robust lookup: Trim whitespace and use case-insensitive regex
      const safeCode = leaveTypeId.trim();
      leaveType = await this.leaveTypeModel.findOne({
        code: { $regex: new RegExp(`^${safeCode}`, 'i') }
      });
      // Fallback: strict match if regex fails surprisingly or for exactness
      if (!leaveType) {
        leaveType = await this.leaveTypeModel.findOne({ code: leaveTypeId });
      }
    }
    if (!leaveType) throw new NotFoundException(`LeaveType '${leaveTypeId}' not found`);

    const leavePolicy =
      (await this.leavePolicyModel.findOne({ leaveTypeId: leaveType._id })) ||
      new this.leavePolicyModel({ leaveTypeId: leaveType._id });

    // Resolve employee ID
    let targetEmployeeId = employeeId;
    if (!Types.ObjectId.isValid(employeeId)) {
      const emp = await this.employeeProfileModel.findOne({ employeeNumber: employeeId });
      if (!emp) throw new NotFoundException('Employee not found');
      targetEmployeeId = emp._id.toString();
    } else {
      // Evaluate existence even if it is a valid object ID
      const emp = await this.employeeProfileModel.findById(employeeId);
      if (!emp) throw new NotFoundException('Employee not found');
    }

    // Now use targetEmployeeId for everything
    const employeeType = await this.getEmployeeType(targetEmployeeId);

    // Adjust accrual rate
    let accrualRate = Number(dto.accrualRate);
    if (employeeType === 'CONTRACT') accrualRate *= 0.8;

    // Calculate pre-rounded leave
    let accruedPreRounded: number = monthsWorked * accrualRate;

    // Pause for unpaid leave
    if (dto.pauseDuringUnpaid) {
      const unpaidMonths = await this.getUnpaidLeaveMonths(employeeId);
      accruedPreRounded -= unpaidMonths * accrualRate;
    }

    // Runtime rounding (not saved in schema)
    // const roundingMethod = dto.roundingRule || RoundingRule.NONE;
    const accruedRounded = this.applyRounding(accruedPreRounded, dto.roundingRule);

    // Map resetDateType to numeric months
    let expiryAfterMonths: number | undefined;
    switch (dto.resetDateType) {
      case 'annual':
        expiryAfterMonths = 12;
        break;
      case 'quarterly':
        expiryAfterMonths = 3;
        break;
      case 'monthly':
        expiryAfterMonths = 1;
        break;
    }

    // Map DTO accrualRate to schema enum
    const accrualMethodMap = {
      MONTHLY: 'monthly',
      YEARLY: 'yearly',
      PER_TERM: 'per-term',
    };

    // Save only fields that exist in schema
    leavePolicy.accrualMethod =
      accrualMethodMap[dto.accrualRate as AccrualMethod];
    leavePolicy.carryForwardAllowed = dto.carryOverCap > 0;
    leavePolicy.maxCarryForward = dto.carryOverCap;
    leavePolicy.expiryAfterMonths = expiryAfterMonths;
    leavePolicy.roundingRule = dto.roundingRule || RoundingRule.NONE;

    await leavePolicy.save();

    // Return runtime-calculated values without saving them
    return {
      leavePolicy,
      accruedPreRounded,
      accruedRounded,
      pauseDuringUnpaid: dto.pauseDuringUnpaid,
    };
  }


  //point 4 approval workflows
  //take as inputs the leave type id , approval workflow array and payroll code   
  //???????the integration service is not defined how to define it ?       




  private approvalWorkflowMap: Record<string, ApprovalStepDto[]> = {};
  private payrollCodeMap: Record<string, string> = {};
  async configureApprovalWorkflowAndPayrollIntegration(
    leaveTypeId: string,
    approvalWorkflow: ApprovalStepDto[],
    payrollCode: string
  ) {
    let leaveType;
    if (Types.ObjectId.isValid(leaveTypeId)) {
      leaveType = await this.leaveTypeModel.findById(leaveTypeId);
    } else {
      leaveType = await this.leaveTypeModel.findOne({ code: leaveTypeId });
    }
    if (!leaveType) throw new NotFoundException('LeaveType not found');

    // Store workflow configuration in memory maps
    // These will be used as templates when creating new leave requests
    this.approvalWorkflowMap[leaveTypeId] = approvalWorkflow;
    this.payrollCodeMap[leaveTypeId] = payrollCode;

    return {
      leaveType,
      approvalWorkflow,
      payrollCode,
      message: 'Approval workflow and payroll code configured successfully'
    };
  }




  //point 5 holiday calendar management 


  async addHoliday(year: number, dto: AddHolidayDto) {
    let calendar = await this.calendarModel.findOne({ year });
    if (!calendar) {
      calendar = new this.calendarModel({ year, holidays: [], blockedPeriods: [] });
    }

    // Handle recurring holidays → apply the year from the argument
    const holidayDate = new Date(dto.date);
    if (dto.isRecurring) {
      holidayDate.setFullYear(year);
    }

    // Convert holiday date → ObjectId with matching timestamp
    const seconds = Math.floor(holidayDate.getTime() / 1000);
    const hex = seconds.toString(16).padStart(8, '0');
    const holidayObjectId = new Types.ObjectId(hex + "0000000000000000");

    // Store holiday date encoded in ObjectId
    calendar.holidays.push(holidayObjectId);

    await calendar.save();
    return calendar;
  }


  //blocked days that cant be holidays in the calendar
  async addBlockedPeriod(year: number, dto: BlockedDayDto) {
    //finds a calendar if not found it create a new calendar
    let calendar = await this.calendarModel.findOne({ year });
    if (!calendar) {
      calendar = new this.calendarModel({ year, holidays: [], blockedPeriods: [] });
    }

    //pushes in the calendar blocked periods where it has a range(start->end) and a reason for blocking
    calendar.blockedPeriods.push({
      from: new Date(dto.startDate),
      to: new Date(dto.endDate),
      reason: dto.reason || dto.name,
    });

    await calendar.save(); //save the calendar with the blocked periods
    return calendar;
  }

  // //calculate the netLeaveDays
  // //input of startDate , endDate and year returns a number
  // //this number is the net leave duration without the holidays and blocked days and weekend
  // async calculateNetLeaveDuration(
  //   startDate: string,
  //   endDate: string,
  //   year: number,
  // ): Promise<number> {
  //   // REQ-010: Fetch holidays and blocked days from TimeManagement module
  //   const holidays = await this.timeManagementService.findAllHolidays({
  //     year,
  //     activeOnly: true,
  //   });

  //   //convert inputs to date objects(to iterate through)
  //   //makes a totalDay counter = 0 to iterate for the total net days
  //   const start = new Date(startDate);
  //   const end = new Date(endDate);
  //   let totalDays = 0;

  //   //loop from the start date to the end date
  //   for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
  //     // skip weekends
  //     const dayOfWeek = d.getDay();
  //     if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends (Sunday=0, Saturday=6)

  //     // skip holidays (checks if current day falls within any holiday range)
  //     const isHoliday = holidays.some((h) => {
  //       const hStart = new Date(h.startDate);
  //       const hEnd = h.endDate ? new Date(h.endDate) : hStart;
  //       // Normalize dates to ignore time for accurate comparison
  //       hStart.setHours(0, 0, 0, 0);
  //       hEnd.setHours(23, 59, 59, 999);
  //       const currentMs = d.getTime();
  //       return currentMs >= hStart.getTime() && currentMs <= hEnd.getTime();
  //     });

  //     if (isHoliday) continue;

  //     totalDays += 1;
  //   }

  //   return totalDays;
  // }

  /**
   * Helper: Parse schedule pattern string to array of allowed day indices (0-6)
   * Pattern examples: "MON-FRI", "SUN-THU", "MON,WED,FRI"
   */
  private parseSchedulePattern(pattern: string): number[] {
    if (!pattern) return [1, 2, 3, 4, 5]; // Default Mon-Fri

    const daysMap: { [key: string]: number } = {
      'SUN': 0, 'MON': 1, 'TUE': 2, 'WED': 3, 'THU': 4, 'FRI': 5, 'SAT': 6
    };

    const normalizedPattern = pattern.toUpperCase().trim();

    // Check for range format (e.g. "MON-FRI")
    if (normalizedPattern.includes('-')) {
      const [startStr, endStr] = normalizedPattern.split('-');
      const startDay = daysMap[startStr.trim()];
      const endDay = daysMap[endStr.trim()];

      if (startDay !== undefined && endDay !== undefined) {
        const result: number[] = [];
        // Handle wrapping (e.g. FRI-MON) although rare in typical business weeks
        if (startDay <= endDay) {
          for (let i = startDay; i <= endDay; i++) result.push(i);
        } else {
          for (let i = startDay; i <= 6; i++) result.push(i);
          for (let i = 0; i <= endDay; i++) result.push(i);
        }
        return result;
      }
    }

    // Check for comma-separated list (e.g. "MON,WED,FRI")
    if (normalizedPattern.includes(',')) {
      return normalizedPattern.split(',')
        .map(d => daysMap[d.trim()])
        .filter(d => d !== undefined);
    }

    // Single day?? Fallback
    const singleDay = daysMap[normalizedPattern];
    if (singleDay !== undefined) return [singleDay];

    return [1, 2, 3, 4, 5]; // Fallback default
  }


  // Calculate Net Duration (Excluding non-working days & Holidays) + Enforce Blocked Days
  async calculateNetLeaveDuration(startDate: string, endDate: string, year: number, employeeId?: string): Promise<number> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 1. Fetch Calendar for Holidays & Blocked Periods
    const calendar = await this.calendarModel.findOne({ year }).populate('holidays');

    // 2. ENFORCEMENT: Check Blocked Periods
    // If any part of the requested duration falls in a blocked period, we REJECT it.
    if (calendar && calendar.blockedPeriods && calendar.blockedPeriods.length > 0) {
      const isBlocked = calendar.blockedPeriods.some(period => {
        const blockStart = new Date(period.from);
        const blockEnd = new Date(period.to);
        blockStart.setHours(0, 0, 0, 0);
        blockEnd.setHours(23, 59, 59, 999);

        // Check overlap
        return (start <= blockEnd && end >= blockStart);
      });

      if (isBlocked) {
        throw new BadRequestException('Selected dates fall within a Blocked Period (e.g. Company Closing). Request Rejected.');
      }
    }

    // 3. Holidays Map
    //const holidays = calendar ? (calendar.holidays as unknown as any[]) : [];
    const holidays = await this.timeManagementService.findAllHolidays({
      year,
      activeOnly: true
    });

    let totalDays = 0;
    // Iterate days
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();

      // A. Basic Weekend Check (Fri/Sat or Sat/Sun - defaulting to Fri/Sat for this region if not specified, 
      // but simplistic approach: Exclude Fri(5) and Sat(6) is common in MENA, or Sat(6)/Sun(0) elsewhere.
      // Keeping it simple: Assume Work is Mon-Fri -> Exclude 0,6
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      // B. Public Holiday Check
      const isHoliday = holidays.some(h => {
        const hStart = new Date(h.startDate);
        const hEnd = h.endDate ? new Date(h.endDate) : hStart;
        hStart.setHours(0, 0, 0, 0);
        hEnd.setHours(23, 59, 59, 999);
        return d.getTime() >= hStart.getTime() && d.getTime() <= hEnd.getTime();
      });
      if (isHoliday) continue;

      totalDays++;
    }

    return totalDays;
  }

  /**
   * Determine the "Start Date" of the Leave Year based on business logic rules.
   * This implements the "Criterion Date" requirement without schema changes.
   */
  private async getLeaveYearStartDate(employee: any, leaveType: any): Promise<Date> {
    // 1. Default Rule: Hire Date
    let criterionDate = new Date(employee.dateOfHire);

    // 2. Logic Switch based on Leave Type Code (Convention)
    const code = leaveType.code.toUpperCase();

    // RULE: If Code ends with '_FV' -> Criterion is "First Vacation Date"
    if (code.endsWith('_FV')) {
      const firstLeave = await this.leaveRequestModel.findOne({
        employeeId: employee._id,
        leaveTypeId: leaveType._id,
        status: LeaveStatus.APPROVED
      }).sort({ 'dates.from': 1 }); // Oldest first

      if (firstLeave) {
        criterionDate = new Date(firstLeave.dates.from);
      } else {
        // If no vacation taken yet, fallback to Hire Date (or could be "Wait for first vacation")
        // For now, using Hire Date as the anchor until a vacation is taken.
      }
    }

    // RULE: If Code ends with '_WRD' -> Criterion is "Work Receiving Date" (Contract Date)
    else if (code.endsWith('_WRD')) {
      // Assuming 'contractDate' exists or using 'probationEndDate' as proxy
      if (employee.contractDate) {
        criterionDate = new Date(employee.contractDate);
      }
    }

    // RULE: If Code ends with '_RHD' -> Criterion is "Revised Hire Date"
    else if (code.endsWith('_RHD')) {
      // Mocking logic or looking for specific field
      // criterionDate = employee.revisedHireDate ...
    }

    return criterionDate;
  }

  /**
   * Calculate the NEXT reset date based on the Criterion Date
   */
  async calculateNextResetDate(employeeId: string, leaveTypeId: string): Promise<Date> {
    const employee = await this.employeeProfileService.getProfileById(employeeId);
    const leaveType = await this.leaveTypeModel.findById(leaveTypeId);

    if (!employee || !leaveType) return new Date(); // Safety fallback

    const startDate = await this.getLeaveYearStartDate(employee, leaveType);
    const now = new Date();

    // Calculate next anniversary of the Start Date
    const currentYear = now.getFullYear();
    let nextReset = new Date(startDate);
    nextReset.setFullYear(currentYear);

    // If anniversary for this year has passed, move to next year
    if (nextReset <= now) {
      nextReset.setFullYear(currentYear + 1);
    }

    return nextReset;
  }

//============================== End of Omar service methods ============================//

// // ============================ Phase 2: Leave Request and Approval (Seif's Work) ============================

  async calculateAccruedLeave(employeeId: string, leaveTypeId: string, monthsWorked: number, pauseDuringUnpaid: boolean) {
    const leavePolicy = await this.leavePolicyModel.findOne({ leaveTypeId: new Types.ObjectId(leaveTypeId) });

    if (!leavePolicy) throw new NotFoundException('Leave policy not found');

    let accrued = 0;

    if (leavePolicy.accrualMethod === AccrualMethod.MONTHLY) {
      accrued = monthsWorked; // example: 1 day per month
    }

    // Pause accrual during unpaid leave
    const unpaidMonths = await this.getUnpaidLeaveMonths(employeeId); // fetch from leave requests
    if (pauseDuringUnpaid) { // runtime flag from DTO or cache
      accrued -= unpaidMonths;
    }

    return accrued;
  }

  async getLeaveBalance(employeeId: string, leaveTypeId: string): Promise<number> {
    const employee = await this.employeeProfileService.getProfileById(employeeId);
    if (!employee) throw new NotFoundException('Employee not found');

    const now = new Date();
    const hireDate = new Date(employee.dateOfHire);
    const monthsWorked = (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth());

    // Fetch policy to check pauseDuringUnpaid preference if possible, or default to true (BR 11)
    // const policy = await this.leavePolicyModel.findOne({ leaveTypeId: new Types.ObjectId(leaveTypeId) });
    const pauseDuringUnpaid = true; // Default to true as per BR 11 and schema limitation

    const accrued = await this.calculateAccruedLeave(employeeId, leaveTypeId, monthsWorked, pauseDuringUnpaid);

    const takenRequests = await this.leaveRequestModel.find({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
      status: LeaveStatus.APPROVED,
    });

    const taken = takenRequests.reduce((sum, req) => sum + req.durationDays, 0);

    return accrued - taken;
  }

  async submitLeaveRequest(
    employeeId: string,
    leaveTypeId: string,
    dates: { from: Date; to: Date },
    justification: string,
    attachmentId?: string,
  ) {
    const fromDate = new Date(dates.from);
    const toDate = new Date(dates.to);

    if (fromDate > toDate) throw new BadRequestException('Invalid date range');

    // 1. Validate Leave Type & Policy Rules
    const leaveType = await this.leaveTypeModel.findById(leaveTypeId);
    if (!leaveType) throw new NotFoundException('Leave type not found');

    const policy = await this.leavePolicyModel.findOne({ leaveTypeId: new Types.ObjectId(leaveTypeId) });

    // BR 8: Eligibility Validation - Check tenure, contract type, position
    const employee = await this.employeeProfileService.getProfileById(employeeId);
    if (!employee) throw new NotFoundException('Employee not found');

    // Check minimum tenure requirement
    if (leaveType.minTenureMonths) {
      const hireDate = new Date(employee.dateOfHire);
      const now = new Date();
      const tenureMonths = (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth());

      if (tenureMonths < leaveType.minTenureMonths) {
        throw new BadRequestException(
          `Minimum tenure of ${leaveType.minTenureMonths} months required for ${leaveType.name}. Current tenure: ${tenureMonths} months`
        );
      }
    }

    // Check contract type eligibility (if policy has restrictions)
    if (policy && policy.eligibility && policy.eligibility.contractTypesAllowed) {
      const allowedTypes = policy.eligibility.contractTypesAllowed;
      if (allowedTypes.length > 0 && !allowedTypes.includes(employee.contractType)) {
        throw new BadRequestException(
          `Leave type ${leaveType.name} is not available for ${employee.contractType} contract type`
        );
      }
    }

    // Check position eligibility (if policy has restrictions)
    if (policy && policy.eligibility && policy.eligibility.positionsAllowed) {
      const allowedPositions = policy.eligibility.positionsAllowed;
      if (allowedPositions.length > 0 && employee.primaryPositionId) {
        const positionIdStr = employee.primaryPositionId.toString();
        if (!allowedPositions.includes(positionIdStr)) {
          throw new BadRequestException(
            `Leave type ${leaveType.name} is not available for your position`
          );
        }
      }
    }

    // REQ-016 & REQ-028: Attachment Validation
    if (leaveType.requiresAttachment && !attachmentId) {
      throw new BadRequestException(`Attachment is required for ${leaveType.name}`);
    }

    // REQ-028: Validate attachment content if provided
    if (attachmentId) {
      await this.validateAttachment(attachmentId, leaveType);
    }

    // REQ-031: Grace Period & Notice Validation
    const now = new Date();
    const diffTime = fromDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (policy && policy.minNoticeDays > 0) { // Only check notice period if policy defines it
      // Check if it's a post-leave request (grace period logic)
      const allowedGraceDays = 30; // Hardcoded configuration since schema changes are restricted
      if (diffDays < -allowedGraceDays) {
        throw new BadRequestException(`Request is outside the allowed grace period of ${allowedGraceDays} days.`);
      }
      // If it's a future request but violates notice period
      if (diffDays >= 0 && diffDays < policy.minNoticeDays) {
        throw new BadRequestException(`Minimum notice period of ${policy.minNoticeDays} days required.`);
      }
    }

    // BR 41: Max Consecutive Days
    const duration = await this.calculateNetLeaveDuration(fromDate.toISOString(), toDate.toISOString(), fromDate.getFullYear());

    // Initialize approval flow early for reuse in split requests
    const approvalFlow: {
      role: string;
      status: string;
      decidedBy?: Types.ObjectId;
      decidedAt?: Date | null;
    }[] = [];

    // Add manager approval step
    const approverId = await this.findApproverWithDelegation(employeeId, fromDate);
    approvalFlow.push({
      role: 'MANAGER',
      status: LeaveStatus.PENDING,
      decidedBy: approverId,
      decidedAt: null,
    });

    if (policy && policy.maxConsecutiveDays && duration > policy.maxConsecutiveDays) {
      throw new BadRequestException(`Leave exceeds maximum consecutive days limit of ${policy.maxConsecutiveDays}`);
    }

    // BR 41: Cumulative Yearly Limit Validation
    await this.validateCumulativeLimit(employeeId, leaveTypeId, duration, fromDate.getFullYear());

    // Check overlap
    const overlap = await this.leaveRequestModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      status: { $in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
      $or: [
        { 'dates.from': { $lte: toDate }, 'dates.to': { $gte: fromDate } },
      ],
    });
    if (overlap) throw new BadRequestException('Leave request overlaps with existing leave');

    // Check balance (BR 31)
    const balance = await this.getLeaveBalance(employeeId, leaveTypeId);

    // BR 29: Excess-to-Unpaid Conversion - FULL IMPLEMENTATION
    if (balance < duration) {
      const paidDays = balance;
      const unpaidDays = duration - balance;

      // Find or create unpaid leave type
      const unpaidLeaveType = await this.leaveTypeModel.findOne({ code: 'UNPAID' });
      if (!unpaidLeaveType) {
        throw new BadRequestException(
          `Insufficient balance (${balance} days available, ${duration} requested). Unpaid leave type not configured.`
        );
      }

      // Create the paid portion (using available balance)
      if (paidDays > 0) {
        const paidRequest = new this.leaveRequestModel({
          employeeId: new Types.ObjectId(employeeId),
          leaveTypeId: new Types.ObjectId(leaveTypeId),
          dates: { from: fromDate, to: toDate },
          durationDays: paidDays,
          justification: `${justification} (Paid portion: ${paidDays} days)`,
          attachmentId: attachmentId ? new Types.ObjectId(attachmentId) : undefined,
          status: LeaveStatus.PENDING,
          approvalFlow // Reuse approval flow
        });
        await paidRequest.save();
      }

      // Create the unpaid portion (excess days)
      const unpaidRequest = new this.leaveRequestModel({
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: unpaidLeaveType._id,
        dates: { from: fromDate, to: toDate },
        durationDays: unpaidDays,
        justification: `${justification} (Unpaid portion: ${unpaidDays} days - converted from ${leaveType.name})`,
        attachmentId: attachmentId ? new Types.ObjectId(attachmentId) : undefined,
        status: LeaveStatus.PENDING,
        approvalFlow // Reuse approval flow
      });

      console.log(`Split request created: ${paidDays} paid days + ${unpaidDays} unpaid days`);
      return unpaidRequest.save();
    }

    // Team Scheduling Conflicts (BR 28) - Warning/Validation
    // Note: employee already fetched above for eligibility check
    if (employee && employee.primaryDepartmentId) {
      // Seif's work - Get department members directly from model
      const teamMembers = await this.employeeModel.find({
        primaryDepartmentId: new Types.ObjectId(employee.primaryDepartmentId.toString()),
        status: 'ACTIVE'
      }).exec();
      const teamMemberIds = teamMembers.map((m) => m._id);

      const teamLeaves = await this.leaveRequestModel.countDocuments({
        employeeId: { $in: teamMemberIds, $ne: new Types.ObjectId(employeeId) },
        status: LeaveStatus.APPROVED,
        $or: [
          { 'dates.from': { $lte: toDate }, 'dates.to': { $gte: fromDate } },
        ],
      });

      if (teamLeaves > 0) {
        console.warn(`Potential team scheduling conflict: ${teamLeaves} other members on leave.`);
      }
    }

    // Build approval flow based on workflow configuration
    // (Already initialized above for Excess-to-Unpaid support)

    const request = new this.leaveRequestModel({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
      dates: { from: fromDate, to: toDate },
      durationDays: duration,
      justification,
      attachmentId: attachmentId ? new Types.ObjectId(attachmentId) : undefined,
      status: LeaveStatus.PENDING,
      approvalFlow,
    });

    return request.save();
  }

  async approveLeaveRequest(requestId: string, managerId: string, status: LeaveStatus, reason?: string) {
    const request = await this.leaveRequestModel.findById(requestId);
    if (!request) throw new NotFoundException('Leave request not found');

    if (request.status !== LeaveStatus.PENDING) throw new BadRequestException('Request is not pending');

    // REQ-020: Manager Verification - Complete Implementation
    // Use findById directly to avoid exception handling issues
    const employee = await this.employeeModel.findById(request.employeeId).exec();
    if (!employee) throw new NotFoundException('Employee not found');

    // REQ-023: Manager Delegation - Check if manager is the supervisor or a valid delegate
    const isAuthorized = await this.verifyManagerAuthorization(employee, managerId);
    if (!isAuthorized) {
      throw new BadRequestException('Manager is not authorized to approve this request');
    }

    request.approvalFlow.push({
      role: 'MANAGER',
      status: status,
      decidedBy: new Types.ObjectId(managerId),
      decidedAt: new Date(),
    });

    if (status === LeaveStatus.REJECTED) {
      request.status = LeaveStatus.REJECTED;
    }
    // If Approved, status remains PENDING for HR review

    return request.save();
  }

  async reviewLeaveRequest(requestId: string, hrId: string, status: LeaveStatus, overrideReason?: string) {
    const request = await this.leaveRequestModel.findById(requestId);
    if (!request) throw new NotFoundException('Leave request not found');

    const leaveType = await this.leaveTypeModel.findById(request.leaveTypeId);
    if (!leaveType) throw new NotFoundException('Leave type not found');

    // REQ-025: Compliance Review
    if (status === LeaveStatus.APPROVED) {
      // 1. Validate Attachment (REQ-028)
      if (leaveType.requiresAttachment && request.attachmentId) {
        // Re-validate attachment in case it changed or wasn't fully checked
        await this.validateAttachment(request.attachmentId.toString(), leaveType);
      }

      // 2. Validate Cumulative Limits (BR 41)
      const year = new Date(request.dates.from).getFullYear();
      await this.validateCumulativeLimit(request.employeeId.toString(), request.leaveTypeId.toString(), request.durationDays, year);

      // 3. Ensure Policy Alignment
      // (This is implicitly covered by re-running validations such as balance, but explicitly noted here)
      const balance = await this.getLeaveBalance(request.employeeId.toString(), request.leaveTypeId.toString());
      if (balance < request.durationDays) {
        // If HR overrides, they might allow negative balance, but standard flow warns/blocks.
        // For 'override', we log a warning but proceed if it's an override.
        // If it's a standard approval, we should block.
        if (!overrideReason) {
          throw new BadRequestException(`Insufficient balance for approval: ${balance} days available.`);
        } else {
          console.warn(`HR Override Warning: Approving leave with insufficient balance (${balance} vs ${request.durationDays}). Reason: ${overrideReason}`);
        }
      }
    }

    // REQ-026: HR Override
    // HR can act even if status is REJECTED (by manager) to override it to APPROVED
    // Or if status is PENDING (manager approved)

    request.approvalFlow.push({
      role: 'HR',
      status: status,
      decidedBy: new Types.ObjectId(hrId),
      decidedAt: new Date(),
      // comments: overrideReason // Assuming we might add comments field to approvalFlow later
    });

    if (overrideReason) {
      // Log override action for audit
      console.log(`HR Override applied for Request ${requestId} by ${hrId}. Reason: ${overrideReason}`);
    }

    if (status === LeaveStatus.APPROVED) {
      request.status = LeaveStatus.APPROVED;
      await this.finalizeLeaveRequest(request);
    } else {
      request.status = LeaveStatus.REJECTED;
    }

    return request.save();
  }


  private async finalizeLeaveRequest(request: LeaveRequestDocument) {
    // 1. Update real-time balance in LeaveEntitlement
    await this.updateLeaveBalance(request.employeeId.toString(), request.leaveTypeId.toString(), request.durationDays);

    // 2. Notify stakeholders (INTEGRATED)
    try {
      await this.timeManagementService.createNotification({
        to: request.employeeId.toString(),
        type: 'LEAVE_APPROVED',
        message: `Leave request ${request._id} has been approved.`,
      });
      console.log(`Notification sent for leave ${request._id}`);
    } catch (error) {
      console.error(`Failed to send notification for leave ${request._id}:`, error);
    }

    // 3. Block attendance (INTEGRATED)
    try {
      // Find or create attendance record for the start date to attach the exception
      const startDate = new Date(request.dates.from);
      startDate.setHours(0, 0, 0, 0);

      // Try to find existing record
      let attendanceRecord = await this.attendanceRecordModel.findOne({
        employeeId: new Types.ObjectId(request.employeeId.toString()),
        createdAt: {
          $gte: startDate,
          $lt: new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      // If not found, create a placeholder record
      if (!attendanceRecord) {
        console.log(`Creating placeholder attendance record for leave exception on ${startDate.toISOString()}`);
        // We use 'as any' here because we are injecting the model directly and bypassing the service wrapper
        // which might have different return types or strict checks.
        attendanceRecord = await this.timeManagementService.createAttendanceRecord({
          employeeId: request.employeeId.toString(),
          punches: [],
          exceptionIds: []
        }) as any;
      }

      if (attendanceRecord) {
        await this.timeManagementService.createTimeException({
          employeeId: request.employeeId.toString(),
          type: TimeExceptionType.MANUAL_ADJUSTMENT,
          attendanceRecordId: attendanceRecord._id.toString(),
          assignedTo: request.employeeId.toString(),
          reason: `Approved Leave: ${request.justification}`,
          status: undefined // Default to OPEN
        });
        console.log(`Attendance blocked from ${request.dates.from} to ${request.dates.to}`);
      }
    } catch (error) {
      console.warn(`Could not create time exception:`, error);
    }

    // 4. Adjust payroll (INTEGRATED)
    try {
      // Check if this is unpaid leave
      const leaveType = await this.leaveTypeModel.findById(request.leaveTypeId);

      if (leaveType && (leaveType.code === 'UNPAID' || leaveType.name.toLowerCase().includes('unpaid'))) {
        // Get employee details to calculate deduction amount
        const employee = await this.employeeProfileService.getProfileById(request.employeeId.toString());

        if (employee && employee.payGradeId) {
          // Fetch the payGrade to get baseSalary
          const payGrade = await this.payGradeModel.findById(employee.payGradeId);

          if (payGrade && payGrade.baseSalary) {
            // Calculate deduction: (baseSalary / 22 working days) * leave duration
            const workingDaysPerMonth = 22;
            const dailyRate = payGrade.baseSalary / workingDaysPerMonth;
            const deductionAmount = request.durationDays * dailyRate;

            // Record penalty in employeePenalties collection
            await this.employeePenaltiesModel.findOneAndUpdate(
              { employeeId: request.employeeId },
              {
                $push: {
                  penalties: {
                    amount: deductionAmount,
                    reason: `Unpaid leave deduction: ${request.dates.from.toISOString().split('T')[0]} to ${request.dates.to.toISOString().split('T')[0]} (${request.durationDays} days)`,
                    date: new Date(),
                    type: 'UNPAID_LEAVE'
                  }
                }
              },
              { upsert: true, new: true }
            );

            console.log(`Penalty recorded for unpaid leave: Employee ${request.employeeId}, Amount: ${deductionAmount.toFixed(2)}, Days: ${request.durationDays}`);
          } else {
            console.warn(`Could not calculate unpaid leave deduction: Employee ${request.employeeId} has no pay grade or base salary`);
          }
        } else {
          console.warn(`Could not calculate unpaid leave deduction: Employee ${request.employeeId} has no pay grade assigned`);
        }
      }
    } catch (error) {
      console.error(`Failed to record unpaid leave penalty:`, error);
    }
  }

  // Real-time balance update method
  private async updateLeaveBalance(employeeId: string, leaveTypeId: string, durationDays: number): Promise<void> {
    const entitlement = await this.leaveEntitlementModel.findOne({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
    });

    if (entitlement) {
      // Update taken and remaining fields
      entitlement.taken = (entitlement.taken || 0) + durationDays;
      entitlement.remaining = (entitlement.yearlyEntitlement || 0) - entitlement.taken;
      await entitlement.save();
      console.log(`Updated balance for employee ${employeeId}: taken=${entitlement.taken}, remaining=${entitlement.remaining}`);
    } else {
      // Create new entitlement record if it doesn't exist
      await this.leaveEntitlementModel.create({
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: new Types.ObjectId(leaveTypeId),
        taken: durationDays,
        remaining: -durationDays, // Negative indicates over-usage
      });
      console.log(`Created new entitlement record for employee ${employeeId}`);
    }
  }

  // BR 28: Auto-Escalation
  async checkAutoEscalation() {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const pendingRequests = await this.leaveRequestModel.find({
      status: LeaveStatus.PENDING,
      createdAt: { $lt: fortyEightHoursAgo },
      'approvalFlow.role': { $ne: 'MANAGER' } // Manager hasn't acted yet
    });

    for (const req of pendingRequests) {
      console.log(`Escalating request ${req._id} due to manager inactivity.`);

      // Logic to notify skip-level manager
      try {
        const employee = await this.employeeProfileService.getProfileById(req.employeeId.toString());
        if (employee && employee.supervisorPositionId) {
          // 1. Get Supervisor Position
          const supervisorPosition = await this.positionModel.findById(employee.supervisorPositionId);

          if (supervisorPosition && supervisorPosition.reportsToPositionId) {
            // 2. Get Skip-Level Supervisor Position (Grand-Supervisor)
            const skipLevelPositionId = supervisorPosition.reportsToPositionId;

            // 3. Find employee holding this position
            // Note: This assumes one employee per position or takes the first one found
            const skipLevelManager = await this.employeeModel.findOne({
              primaryPositionId: skipLevelPositionId,
              status: 'ACTIVE'
            });

            if (skipLevelManager) {
              await this.timeManagementService.createNotification({
                to: skipLevelManager._id.toString(),
                type: 'LEAVE_ESCALATION',
                message: `ESCALATION: Leave request ${req._id} for ${employee.firstName} ${employee.lastName} is pending approval > 48h.`
              });
              console.log(`Escalation notification sent to skip-level manager ${skipLevelManager._id}`);
            } else {
              console.warn(`No skip-level manager found for position ${skipLevelPositionId}`);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to process escalation for request ${req._id}:`, error);
      }
    }
    return pendingRequests.length;
  }

  // BR 19: Retroactive Deductions
  async applyRetroactiveDeduction(employeeId: string, leaveTypeId: string, dates: { from: Date; to: Date }, reason: string) {
    try {
      console.log(`[DEBUG] applyRetroactiveDeduction input dates:`, JSON.stringify(dates));

      if (!dates || !dates.from || !dates.to) {
        throw new Error(`Invalid dates payload: ${JSON.stringify(dates)}`);
      }

      const fromDate = new Date(dates.from);
      const toDate = new Date(dates.to);

      console.log(`[DEBUG] Parsed: From=${fromDate.toString()}, To=${toDate.toString()}`);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        throw new Error(`Invalid date format parsed. From: ${dates.from}, To: ${dates.to}`);
      }

      // Use the robust calculateNetLeaveDuration which now accepts string or Date (via normalization)
      const duration = await this.calculateNetLeaveDuration(fromDate.toISOString(), toDate.toISOString(), fromDate.getFullYear());

      const request = new this.leaveRequestModel({
        employeeId: new Types.ObjectId(employeeId),
        leaveTypeId: new Types.ObjectId(leaveTypeId),
        dates: dates,
        durationDays: duration,
        justification: `Retroactive Deduction: ${reason}`,
        status: LeaveStatus.APPROVED, // Automatically approved
        approvalFlow: [{
          role: 'HR_SYSTEM',
          status: LeaveStatus.APPROVED,
          decidedAt: new Date(),
        }]
      });

      await request.save();
      await this.finalizeLeaveRequest(request);
      return request;
    } catch (error) {
      console.error('Retroactive deduction error:', error);
      throw new InternalServerErrorException(`Failed to apply retroactive deduction: ${error.message}`);
    }
  }

  // REQ-020 & REQ-023: Manager Verification and Delegation - FULL IMPLEMENTATION
  private async verifyManagerAuthorization(employee: any, managerId: string): Promise<boolean> {
    // Use findById directly to avoid throwing exception when manager not found
    // getProfileById throws NotFoundException, but we want to return false instead
    try {
      const manager = await this.employeeModel.findById(managerId).exec();
      if (!manager) {
        console.warn(`Manager not found: ${managerId}`);
        return false;
      }
      if (!manager.primaryPositionId) {
        console.warn(`Manager ${managerId} has no primaryPositionId`);
        return false;
      }

    // 1. Direct Supervisor Check (REQ-020)
    if (employee.supervisorPositionId &&
      manager.primaryPositionId.toString() === employee.supervisorPositionId.toString()) {
      return true;
    }

    // 2. Department Head Check (Delegation via Role)
    if (employee.primaryDepartmentId) {
      const department = await this.departmentModel.findById(employee.primaryDepartmentId);
      if (department && department.headPositionId &&
        department.headPositionId.toString() === manager.primaryPositionId.toString()) {
        console.log(`Manager ${managerId} authorized as Department Head`);
        return true;
      }
    }

    // 3. Hierarchy Traversal (Skip-Level Manager)
    // Check if manager holds a position that is an ancestor of the employee's position
    if (employee.primaryPositionId) {
      let currentPositionId = employee.primaryPositionId;
      let depth = 0;
      const MAX_DEPTH = 5; // Prevent infinite loops

      while (currentPositionId && depth < MAX_DEPTH) {
        const position = await this.positionModel.findById(currentPositionId);
        if (!position || !position.reportsToPositionId) break;

        if (position.reportsToPositionId.toString() === manager.primaryPositionId.toString()) {
          console.log(`Manager ${managerId} authorized via hierarchy traversal (Depth: ${depth + 1})`);
          return true;
        }

        currentPositionId = position.reportsToPositionId;
        depth++;
      }
    }

    // 4. Explicit Delegation Check (REQ-023) - In-Memory Delegation Map
    if (employee.supervisorPositionId) {
      const managers = await this.employeeModel
        .find({ primaryPositionId: employee.supervisorPositionId })
        .exec();

      if (managers.length > 0) {
        const actualManagerId = managers[0]._id.toString();
        const delegation = this.delegationMap.get(actualManagerId);

        if (delegation && delegation.isActive) {
          const now = new Date();
          const isDateActive = now >= delegation.startDate &&
            (delegation.endDate === null || now <= delegation.endDate);

          // Normalize both IDs to strings for consistent comparison
          const normalizedDelegateId = delegation.delegateId.toString();
          const normalizedManagerId = managerId.toString();

          if (isDateActive && normalizedDelegateId === normalizedManagerId) {
            console.log(`Manager ${managerId} authorized via In-Memory Delegation`);
            return true;
          }
        }
      }
    }

    // 5. Legacy PositionAssignment Delegation Check (if still needed)
    if (employee.supervisorPositionId) {
      const now = new Date();
      const delegation = await this.positionAssignmentModel.findOne({
        employeeProfileId: new Types.ObjectId(managerId),
        positionId: new Types.ObjectId(employee.supervisorPositionId),
        startDate: { $lte: now },
        $or: [{ endDate: { $gte: now } }, { endDate: null }]
      });

      if (delegation) {
        console.log(`Manager ${managerId} authorized via Explicit Delegation (PositionAssignment)`);
        return true;
      }
    }

      // If no verification passed, deny authorization
      console.warn(`Manager ${managerId} not authorized for employee ${employee._id}`);
      return false;
    } catch (error) {
      console.error(`Error verifying manager authorization: ${error.message}`);
      return false;
    }
  }

  // BR 41: Cumulative Yearly Leave Limits
  async validateCumulativeLimit(employeeId: string, leaveTypeId: string, requestedDuration: number, year: number): Promise<void> {
    // Get all approved leaves for this employee, leave type, and year
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);

    const yearlyLeaves = await this.leaveRequestModel.find({
      employeeId: new Types.ObjectId(employeeId),
      leaveTypeId: new Types.ObjectId(leaveTypeId),
      status: LeaveStatus.APPROVED,
      'dates.from': { $gte: yearStart, $lte: yearEnd }
    });

    const totalTaken = yearlyLeaves.reduce((sum, req) => sum + req.durationDays, 0);
    const totalAfterRequest = totalTaken + requestedDuration;

    // Check policy for yearly limit (if exists)
    const policy = await this.leavePolicyModel.findOne({ leaveTypeId: new Types.ObjectId(leaveTypeId) });
    if (policy && policy.yearlyRate && totalAfterRequest > policy.yearlyRate) {
      throw new BadRequestException(
        `Cumulative yearly limit exceeded. Limit: ${policy.yearlyRate} days, Already taken: ${totalTaken} days, Requested: ${requestedDuration} days`
      );
    }
  }

  // REQ-028: Document Validation - ENHANCED IMPLEMENTATION
  async validateAttachment(attachmentId: string, leaveType: any): Promise<void> {
    if (!attachmentId) return;

    // 1. Fetch document metadata
    const attachment = await this.attachmentModel.findById(attachmentId);
    if (!attachment) {
      throw new BadRequestException(`Attachment not found: ${attachmentId}`);
    }

    // 2. Validate file type
    if (attachment.fileType) {
      const allowedTypes = this.getAllowedFileTypes(leaveType.attachmentType);
      if (!allowedTypes.includes(attachment.fileType)) {
        throw new BadRequestException(`Invalid file type: ${attachment.fileType}. Allowed: ${allowedTypes.join(', ')}`);
      }
    }

    // 3. Validate file size (e.g., max 5MB)
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (attachment.size && attachment.size > maxSizeBytes) {
      throw new BadRequestException(`File size exceeds maximum of 5MB`);
    }

    console.log(`Document validation passed for attachment ${attachmentId}`);
  }

  // Helper method to get allowed file types based on attachment type
  private getAllowedFileTypes(attachmentType: string): string[] {
    const typeMap: Record<string, string[]> = {
      'MEDICAL_CERTIFICATE': ['application/pdf', 'image/jpeg', 'image/png'],
      'LEGAL_DOCUMENT': ['application/pdf'],
      'PROOF_OF_TRAVEL': ['application/pdf', 'image/jpeg', 'image/png'],
      'OTHER': ['application/pdf', 'image/jpeg', 'image/png', 'application/msword'],
    };
    return typeMap[attachmentType] || typeMap['OTHER'];
  }
// // ============================ End of Phase 2: Leave Request and Approval (Seif's Work) =============================

}






