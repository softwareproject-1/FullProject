import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import {
  Shift,
  ShiftDocument,
  ShiftType,
  ShiftTypeDocument,
  ShiftAssignment,
  ShiftAssignmentDocument,
  ScheduleRule,
  ScheduleRuleDocument,
  AttendanceRecord,
  AttendanceRecordDocument,
  Punch,
  AttendanceCorrectionRequest,
  AttendanceCorrectionRequestDocument,
  TimeException,
  TimeExceptionDocument,
  OvertimeRule,
  OvertimeRuleDocument,
  LatenessRule,
  LatenessRuleDocument,
  Holiday,
  HolidayDocument,
  NotificationLog,
  NotificationLogDocument,
} from './models';
import {
  CreateShiftDto,
  UpdateShiftDto,
  CreateShiftTypeDto,
  UpdateShiftTypeDto,
  CreateShiftAssignmentDto,
  UpdateShiftAssignmentDto,
  BulkShiftAssignmentDto,
  CreateScheduleRuleDto,
  UpdateScheduleRuleDto,
  CreateAttendanceRecordDto,
  ClockInOutDto,
  ManualAttendanceCorrectionDto,
  CreateAttendanceCorrectionRequestDto,
  UpdateAttendanceCorrectionRequestDto,
  CreateTimeExceptionDto,
  UpdateTimeExceptionDto,
  CreateOvertimeRuleDto,
  UpdateOvertimeRuleDto,
  CreateLatenessRuleDto,
  UpdateLatenessRuleDto,
  CreateHolidayDto,
  UpdateHolidayDto,
  AttendanceReportDto,
  OvertimeReportDto,
  ExceptionReportDto,
} from './DTOs';
import {
  ShiftAssignmentStatus,
  PunchType,
  PunchPolicy,
  CorrectionRequestStatus,
  TimeExceptionType,
  TimeExceptionStatus,
  HolidayType,
} from './models/enums/index';

@Injectable()
export class TimeManagementService {
  constructor(
    @InjectModel(Shift.name) private shiftModel: Model<ShiftDocument>,
    @InjectModel(ShiftType.name) private shiftTypeModel: Model<ShiftTypeDocument>,
    @InjectModel(ShiftAssignment.name) private shiftAssignmentModel: Model<ShiftAssignmentDocument>,
    @InjectModel(ScheduleRule.name) private scheduleRuleModel: Model<ScheduleRuleDocument>,
    @InjectModel(AttendanceRecord.name) private attendanceRecordModel: Model<AttendanceRecordDocument>,
    @InjectModel(AttendanceCorrectionRequest.name) private correctionRequestModel: Model<AttendanceCorrectionRequestDocument>,
    @InjectModel(TimeException.name) private timeExceptionModel: Model<TimeExceptionDocument>,
    @InjectModel(OvertimeRule.name) private overtimeRuleModel: Model<OvertimeRuleDocument>,
    @InjectModel(LatenessRule.name) private latenessRuleModel: Model<LatenessRuleDocument>,
    @InjectModel(Holiday.name) private holidayModel: Model<HolidayDocument>,
    @InjectModel(NotificationLog.name) private notificationLogModel: Model<NotificationLogDocument>,
  ) {
    // Constructor body
  }

  // ==================== Shift Type Management ====================
  async createShiftType(createDto: CreateShiftTypeDto): Promise<ShiftType> {
    const shiftType = new this.shiftTypeModel(createDto);
    return shiftType.save();
  }

  async findAllShiftTypes(activeOnly?: boolean): Promise<ShiftType[]> {
    const query = activeOnly ? { active: true } : {};
    return this.shiftTypeModel.find(query).exec();
  }

  async findShiftTypeById(id: string): Promise<ShiftType> {
    const shiftType = await this.shiftTypeModel.findById(id).exec();
    if (!shiftType) {
      throw new NotFoundException(`ShiftType with ID ${id} not found`);
    }
    return shiftType;
  }

  async updateShiftType(id: string, updateDto: UpdateShiftTypeDto): Promise<ShiftType> {
    // Remove any MongoDB timestamp fields that shouldn't be updated
    const cleanDto: any = { ...updateDto };
    delete cleanDto.createdAt;
    delete cleanDto.updatedAt;
    delete (cleanDto as any)._id;
    delete (cleanDto as any).__v;
    
    const shiftType = await this.shiftTypeModel.findByIdAndUpdate(id, cleanDto, { new: true }).exec();
    if (!shiftType) {
      throw new NotFoundException(`ShiftType with ID ${id} not found`);
    }
    return shiftType;
  }

  async deleteShiftType(id: string): Promise<void> {
    const result = await this.shiftTypeModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`ShiftType with ID ${id} not found`);
    }
  }

  // ==================== Shift Management ====================
  async createShift(createDto: CreateShiftDto): Promise<Shift> {
    // Verify shift type exists
    await this.findShiftTypeById(createDto.shiftType);
    const shift = new this.shiftModel(createDto);
    return shift.save();
  }

  async findAllShifts(activeOnly?: boolean): Promise<Shift[]> {
    const query = activeOnly ? { active: true } : {};
    return this.shiftModel.find(query).populate('shiftType').exec();
  }

  async findShiftById(id: string): Promise<Shift> {
    const shift = await this.shiftModel.findById(id).populate('shiftType').exec();
    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }
    return shift;
  }

  async updateShift(id: string, updateDto: UpdateShiftDto): Promise<Shift> {
    // Remove any MongoDB timestamp fields that shouldn't be updated
    const cleanDto: any = { ...updateDto };
    delete cleanDto.createdAt;
    delete cleanDto.updatedAt;
    delete (cleanDto as any)._id;
    delete (cleanDto as any).__v;
    
    if (cleanDto.shiftType) {
      await this.findShiftTypeById(cleanDto.shiftType);
    }
    const shift = await this.shiftModel.findByIdAndUpdate(id, cleanDto, { new: true }).exec();
    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }
    return shift;
  }

  async deleteShift(id: string): Promise<void> {
    const result = await this.shiftModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }
  }

  // ==================== Schedule Rule Management ====================
  async createScheduleRule(createDto: CreateScheduleRuleDto): Promise<ScheduleRule> {
    const scheduleRule = new this.scheduleRuleModel(createDto);
    return scheduleRule.save();
  }

  async findAllScheduleRules(activeOnly?: boolean): Promise<ScheduleRule[]> {
    const query = activeOnly ? { active: true } : {};
    return this.scheduleRuleModel.find(query).exec();
  }

  async findScheduleRuleById(id: string): Promise<ScheduleRule> {
    const scheduleRule = await this.scheduleRuleModel.findById(id).exec();
    if (!scheduleRule) {
      throw new NotFoundException(`ScheduleRule with ID ${id} not found`);
    }
    return scheduleRule;
  }

  async updateScheduleRule(id: string, updateDto: UpdateScheduleRuleDto): Promise<ScheduleRule> {
    // Remove any MongoDB timestamp fields that shouldn't be updated
    const cleanDto: any = { ...updateDto };
    delete cleanDto.createdAt;
    delete cleanDto.updatedAt;
    delete (cleanDto as any)._id;
    delete (cleanDto as any).__v;
    
    const scheduleRule = await this.scheduleRuleModel.findByIdAndUpdate(id, cleanDto, { new: true }).exec();
    if (!scheduleRule) {
      throw new NotFoundException(`ScheduleRule with ID ${id} not found`);
    }
    return scheduleRule;
  }

  async deleteScheduleRule(id: string): Promise<void> {
    const result = await this.scheduleRuleModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`ScheduleRule with ID ${id} not found`);
    }
  }

  // ==================== Shift Assignment Management ====================
  async createShiftAssignment(createDto: CreateShiftAssignmentDto): Promise<ShiftAssignment> {
    // Verify shift exists
    await this.findShiftById(createDto.shiftId);
    if (createDto.scheduleRuleId) {
      await this.findScheduleRuleById(createDto.scheduleRuleId);
    }
    
    const assignment = new this.shiftAssignmentModel({
      ...createDto,
      startDate: new Date(createDto.startDate),
      endDate: createDto.endDate ? new Date(createDto.endDate) : undefined,
    });
    return assignment.save();
  }

  async createBulkShiftAssignment(bulkDto: BulkShiftAssignmentDto): Promise<ShiftAssignment[]> {
    await this.findShiftById(bulkDto.shiftId);
    if (bulkDto.scheduleRuleId) {
      await this.findScheduleRuleById(bulkDto.scheduleRuleId);
    }

    const assignments: ShiftAssignment[] = [];
    const startDate = new Date(bulkDto.startDate);
    const endDate = bulkDto.endDate ? new Date(bulkDto.endDate) : undefined;

    if (bulkDto.employeeIds && bulkDto.employeeIds.length > 0) {
      for (const employeeId of bulkDto.employeeIds) {
        const assignment = new this.shiftAssignmentModel({
          employeeId: new Types.ObjectId(employeeId),
          shiftId: new Types.ObjectId(bulkDto.shiftId),
          scheduleRuleId: bulkDto.scheduleRuleId ? new Types.ObjectId(bulkDto.scheduleRuleId) : undefined,
          startDate,
          endDate,
          status: bulkDto.status || ShiftAssignmentStatus.PENDING,
        });
        assignments.push(await assignment.save());
      }
    } else if (bulkDto.departmentId) {
      // In a real system, you would fetch employees by department
      // For now, we'll create a placeholder assignment
      throw new BadRequestException('Department-based assignment requires employee lookup service');
    } else if (bulkDto.positionId) {
      // In a real system, you would fetch employees by position
      throw new BadRequestException('Position-based assignment requires employee lookup service');
    }

    return assignments;
  }

  async findAllShiftAssignments(filters?: {
    employeeId?: string;
    departmentId?: string;
    positionId?: string;
    status?: ShiftAssignmentStatus;
  }): Promise<ShiftAssignment[]> {
    const query: any = {};
    
    console.log('findAllShiftAssignments service - Filters received:', filters);
    
    if (filters?.employeeId) {
      try {
        // Convert to ObjectId for proper MongoDB query
        const employeeObjectId = new Types.ObjectId(filters.employeeId);
        // Query for both ObjectId and string formats to handle data inconsistencies
        // The database may have employeeId stored as string instead of ObjectId
        query.$or = [
          { employeeId: employeeObjectId },
          { employeeId: filters.employeeId }
        ];
        console.log('findAllShiftAssignments service - Query employeeId (both ObjectId and string):', {
          objectId: employeeObjectId.toString(),
          string: filters.employeeId
        });
      } catch (error) {
        console.error('findAllShiftAssignments service - Error converting employeeId to ObjectId:', error);
        console.error('findAllShiftAssignments service - Invalid employeeId:', filters.employeeId);
        // If conversion fails, try as string comparison
        query.employeeId = filters.employeeId;
      }
    }
    
    // Build other filters
    const otherFilters: any = {};
    if (filters?.departmentId) {
      try {
        otherFilters.departmentId = new Types.ObjectId(filters.departmentId);
      } catch (error) {
        console.error('Error converting departmentId to ObjectId:', error);
        otherFilters.departmentId = filters.departmentId;
      }
    }
    if (filters?.positionId) {
      try {
        otherFilters.positionId = new Types.ObjectId(filters.positionId);
      } catch (error) {
        console.error('Error converting positionId to ObjectId:', error);
        otherFilters.positionId = filters.positionId;
      }
    }
    if (filters?.status) otherFilters.status = filters.status;

    // Combine $or for employeeId with other filters using $and
    if (query.$or && Object.keys(otherFilters).length > 0) {
      query.$and = [
        { $or: query.$or },
        otherFilters
      ];
      delete query.$or;
    } else if (Object.keys(otherFilters).length > 0) {
      Object.assign(query, otherFilters);
    }

    console.log('findAllShiftAssignments service - Final query:', JSON.stringify(query, null, 2));
    
    const result = await this.shiftAssignmentModel.find(query)
      .populate('employeeId', 'firstName lastName fullName employeeNumber')
      .populate('shiftId', 'name')
      .populate('scheduleRuleId', 'name')
      .exec();
    
    console.log('findAllShiftAssignments service - Query result count:', result.length);
    if (result.length > 0) {
      const firstResult = result[0];
      const employeeIdValue = firstResult.employeeId;
      console.log('findAllShiftAssignments service - First result:', {
        _id: firstResult._id?.toString(),
        employeeId: employeeIdValue,
        employeeIdType: typeof employeeIdValue,
        employeeIdString: employeeIdValue?.toString ? employeeIdValue.toString() : 
                          (employeeIdValue?._id ? employeeIdValue._id.toString() : 
                           (employeeIdValue?.id ? employeeIdValue.id.toString() : 'N/A')),
      });
    } else if (filters?.employeeId) {
      // Debug: Check if there are any assignments at all and compare IDs
      const allAssignments = await this.shiftAssignmentModel.find({}).limit(10).exec();
      console.log('findAllShiftAssignments service - Total assignments in DB (sample):', allAssignments.length);
      if (allAssignments.length > 0) {
        console.log('findAllShiftAssignments service - Sample assignments employeeIds:');
        allAssignments.forEach((assignment, index) => {
          const empId = assignment.employeeId;
          const empIdStr = empId?.toString ? empId.toString() : 
                          (empId?._id ? empId._id.toString() : 
                           (empId?.id ? empId.id.toString() : String(empId)));
          console.log(`  Assignment ${index + 1}:`, {
            assignmentId: assignment._id?.toString(),
            employeeId: empIdStr,
            matchesQuery: empIdStr === filters.employeeId,
          });
        });
        console.log('findAllShiftAssignments service - Query employeeId:', {
          raw: query.employeeId?.toString ? query.employeeId.toString() : query.employeeId,
          filterEmployeeId: filters.employeeId,
        });
      }
    }
    
    return result;
  }

  async findShiftAssignmentById(id: string): Promise<ShiftAssignment> {
    const assignment = await this.shiftAssignmentModel.findById(id)
      .populate('employeeId', 'firstName lastName fullName employeeNumber')
      .populate('shiftId', 'name')
      .populate('scheduleRuleId', 'name')
      .exec();
    if (!assignment) {
      throw new NotFoundException(`ShiftAssignment with ID ${id} not found`);
    }
    return assignment;
  }

  async updateShiftAssignment(id: string, updateDto: UpdateShiftAssignmentDto): Promise<ShiftAssignment> {
    if (updateDto.shiftId) {
      await this.findShiftById(updateDto.shiftId);
    }
    if (updateDto.scheduleRuleId) {
      await this.findScheduleRuleById(updateDto.scheduleRuleId);
    }

    const updateData: any = { ...updateDto };
    if (updateDto.startDate) updateData.startDate = new Date(updateDto.startDate);
    if (updateDto.endDate !== undefined) {
      updateData.endDate = updateDto.endDate ? new Date(updateDto.endDate) : null;
    }

    const assignment = await this.shiftAssignmentModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!assignment) {
      throw new NotFoundException(`ShiftAssignment with ID ${id} not found`);
    }
    return assignment;
  }

  async deleteShiftAssignment(id: string): Promise<void> {
    const result = await this.shiftAssignmentModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`ShiftAssignment with ID ${id} not found`);
    }
  }

  async checkExpiringShiftAssignments(daysBeforeExpiry: number = 7): Promise<ShiftAssignment[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysBeforeExpiry);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.shiftAssignmentModel.find({
      endDate: { $gte: today, $lte: expiryDate },
      status: ShiftAssignmentStatus.APPROVED,
    }).populate('employeeId').exec();
  }

  // ==================== Attendance Record Management ====================
  async clockInOut(clockDto: ClockInOutDto): Promise<AttendanceRecord> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find or create attendance record for today
    let attendanceRecord = await this.attendanceRecordModel.findOne({
      employeeId: new Types.ObjectId(clockDto.employeeId),
      createdAt: { $gte: today, $lt: tomorrow },
    }).exec();

    if (!attendanceRecord) {
      attendanceRecord = new this.attendanceRecordModel({
        employeeId: new Types.ObjectId(clockDto.employeeId),
        punches: [],
        totalWorkMinutes: 0,
        hasMissedPunch: false,
        exceptionIds: [],
        finalisedForPayroll: true,
      });
    }

    // Add new punch
    const newPunch: Punch = {
      type: clockDto.type,
      time: new Date(),
    };

    // Get employee's shift assignment to check punch policy
    const assignment = await this.shiftAssignmentModel.findOne({
      employeeId: new Types.ObjectId(clockDto.employeeId),
      startDate: { $lte: today },
      $or: [{ endDate: { $gte: today } }, { endDate: null }],
      status: ShiftAssignmentStatus.APPROVED,
    }).populate('shiftId').exec();

    // Get employee's shift assignment to check punch policy
    let punchPolicy: PunchPolicy = PunchPolicy.MULTIPLE; // Default to MULTIPLE if no assignment
    
    if (assignment && (assignment.shiftId as any)?._id) {
      const shift = await this.findShiftById((assignment.shiftId as any)._id.toString());
      punchPolicy = shift.punchPolicy || PunchPolicy.MULTIPLE;
    }
    
    if (punchPolicy === PunchPolicy.FIRST_LAST) {
      // FIRST_LAST policy: Keep only the first IN and last OUT punch
      const existingPunches = [...attendanceRecord.punches];
      const inPunches = existingPunches.filter(p => p.type === PunchType.IN);
      const outPunches = existingPunches.filter(p => p.type === PunchType.OUT);
      
      if (clockDto.type === PunchType.IN) {
        // For IN punch: Keep only the first IN (if this is the first, add it; otherwise keep existing first)
        if (inPunches.length === 0) {
          // This is the first IN punch, add it along with all OUT punches
          attendanceRecord.punches = [...outPunches, newPunch];
        } else {
          // Already have an IN punch, keep the first one and replace with new one if it's earlier
          const firstIn = inPunches[0];
          const firstInTime = firstIn.time instanceof Date ? firstIn.time : new Date(firstIn.time);
          const newPunchTime = newPunch.time instanceof Date ? newPunch.time : new Date(newPunch.time);
          
          if (newPunchTime < firstInTime) {
            // New IN is earlier, replace the first IN
            attendanceRecord.punches = [...outPunches, newPunch];
          } else {
            // Keep the existing first IN
            attendanceRecord.punches = [...outPunches, firstIn];
          }
        }
      } else {
        // For OUT punch: Keep only the last OUT (always add new OUT, remove old ones)
        if (outPunches.length === 0) {
          // This is the first OUT punch
          attendanceRecord.punches = [...inPunches, newPunch];
        } else {
          // Already have OUT punches, keep only the last one (most recent)
          const sortedOutPunches = [...outPunches].sort((a, b) => {
            const timeA = a.time instanceof Date ? a.time : new Date(a.time);
            const timeB = b.time instanceof Date ? b.time : new Date(b.time);
            return timeA.getTime() - timeB.getTime();
          });
          const lastOut = sortedOutPunches[sortedOutPunches.length - 1];
          const lastOutTime = lastOut.time instanceof Date ? lastOut.time : new Date(lastOut.time);
          const newPunchTime = newPunch.time instanceof Date ? newPunch.time : new Date(newPunch.time);
          
          if (newPunchTime > lastOutTime) {
            // New OUT is later, replace the last OUT
            attendanceRecord.punches = [...inPunches, newPunch];
          } else {
            // Keep the existing last OUT
            attendanceRecord.punches = [...inPunches, lastOut];
          }
        }
      }
    } else {
      // MULTIPLE policy: Allow all punches
      attendanceRecord.punches.push(newPunch);
    }

    // Calculate total work minutes
    attendanceRecord.totalWorkMinutes = this.calculateWorkMinutes(attendanceRecord.punches);
    
    // Check for missed punches
    attendanceRecord.hasMissedPunch = this.checkMissedPunch(attendanceRecord.punches);

    return attendanceRecord.save();
  }

  async createAttendanceRecord(createDto: CreateAttendanceRecordDto): Promise<AttendanceRecord> {
    const attendanceRecord = new this.attendanceRecordModel({
      ...createDto,
      employeeId: new Types.ObjectId(createDto.employeeId),
      punches: createDto.punches?.map(p => ({
        type: p.type,
        time: new Date(p.time),
      })) || [],
      exceptionIds: createDto.exceptionIds?.map(id => new Types.ObjectId(id)) || [],
    });
    
    if (!attendanceRecord.totalWorkMinutes) {
      attendanceRecord.totalWorkMinutes = this.calculateWorkMinutes(attendanceRecord.punches);
    }
    
    attendanceRecord.hasMissedPunch = this.checkMissedPunch(attendanceRecord.punches);
    
    return attendanceRecord.save();
  }

  async findAllAttendanceRecords(filters?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AttendanceRecord[]> {
    // #region agent log
    const logPath = 'g:\\KOL_EL_MOZKRA\\software project\\milestone 3\\TimeManagment\\.cursor\\debug.log';
    try { fs.appendFileSync(logPath, JSON.stringify({location:'time-management.service.ts:400',message:'findAllAttendanceRecords service entry',data:{filters},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n'); } catch(e){}
    // #endregion
    const query: any = {};
    if (filters?.employeeId) {
      // Validate that employeeId is a valid ObjectId string before converting
      const employeeIdStr = String(filters.employeeId).trim();
      if (employeeIdStr && Types.ObjectId.isValid(employeeIdStr)) {
        query.employeeId = new Types.ObjectId(employeeIdStr);
      } else {
        // If invalid, don't add to query (will return empty results)
        console.warn(`Invalid employeeId provided: ${filters.employeeId}`);
      }
    }
    // Note: Date filtering by createdAt is skipped since AttendanceRecord schema doesn't have timestamps
    // If date filtering is needed, it would require adding a date field to the schema or using _id timestamp
    
    // #region agent log
    try { fs.appendFileSync(logPath, JSON.stringify({location:'time-management.service.ts:412',message:'Before database query',data:{query},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n'); } catch(e){}
    // #endregion
    let records;
    try {
      records = await this.attendanceRecordModel.find(query)
        .populate('employeeId', 'firstName lastName fullName employeeNumber')
        .populate('exceptionIds')
        .sort({ _id: -1 }) // Sort by _id (newest first) since createdAt may not exist
        .exec();
      // #region agent log
      try { 
        const firstRecordId = records && records[0] && records[0]._id ? records[0]._id.toString() : null;
        fs.appendFileSync(logPath, JSON.stringify({location:'time-management.service.ts:418',message:'Database query success',data:{recordsCount:records?.length,firstRecordId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n'); 
      } catch(e){}
      // #endregion
    } catch (error: any) {
      // #region agent log
      try { fs.appendFileSync(logPath, JSON.stringify({location:'time-management.service.ts:420',message:'Database query error',data:{errorMessage:error?.message,errorName:error?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n'); } catch(e){}
      // #endregion
      throw error;
    }
    
    // Apply date filtering in memory if needed (using _id timestamp as approximation)
    let filteredRecords = records;
    if (filters?.startDate || filters?.endDate) {
      filteredRecords = records.filter(record => {
        const recordDate = (record._id as any).getTimestamp();
        if (filters.startDate && recordDate < new Date(filters.startDate)) {
          return false;
        }
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999); // Include entire end date
          if (recordDate > endDate) {
            return false;
          }
        }
        return true;
      });
    }
    
    // #region agent log
    try { fs.appendFileSync(logPath, JSON.stringify({location:'time-management.service.ts:440',message:'Before calculateWorkMinutes loop',data:{filteredRecordsCount:filteredRecords?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n'); } catch(e){}
    // #endregion
    // Recalculate work minutes for each record to ensure accuracy
    try {
      filteredRecords.forEach((record) => {
        if (record.punches && record.punches.length > 0) {
          record.totalWorkMinutes = this.calculateWorkMinutes(record.punches);
        }
      });
      // #region agent log
      try { fs.appendFileSync(logPath, JSON.stringify({location:'time-management.service.ts:445',message:'calculateWorkMinutes loop success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n'); } catch(e){}
      // #endregion
    } catch (error: any) {
      // #region agent log
      try { fs.appendFileSync(logPath, JSON.stringify({location:'time-management.service.ts:447',message:'calculateWorkMinutes loop error',data:{errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n'); } catch(e){}
      // #endregion
      throw error;
    }
    
    // #region agent log
    try { fs.appendFileSync(logPath, JSON.stringify({location:'time-management.service.ts:450',message:'findAllAttendanceRecords service exit',data:{returnCount:filteredRecords?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n'); } catch(e){}
    // #endregion
    return filteredRecords;
  }

  async findAttendanceRecordById(id: string): Promise<AttendanceRecordDocument> {
    const record = await this.attendanceRecordModel.findById(id)
      .populate('employeeId')
      .populate('exceptionIds')
      .exec();
    if (!record) {
      throw new NotFoundException(`AttendanceRecord with ID ${id} not found`);
    }
    return record;
  }

  async manualAttendanceCorrection(
    attendanceRecordId: string,
    correctionDto: ManualAttendanceCorrectionDto,
  ): Promise<AttendanceRecord> {
    const record = await this.findAttendanceRecordById(attendanceRecordId);
    
    // Process punches: keep only one IN and one OUT punch
    // Sort by time to get the first IN and last OUT
    const processedPunches = correctionDto.punches
      .map(p => ({
        type: p.type,
        time: new Date(p.time),
      }))
      .sort((a, b) => a.time.getTime() - b.time.getTime());
    
    // Extract only the first IN and last OUT
    const inPunches = processedPunches.filter(p => String(p.type).toUpperCase() === 'IN');
    const outPunches = processedPunches.filter(p => String(p.type).toUpperCase() === 'OUT');
    
    // Keep only first IN and last OUT
    const finalPunches: Punch[] = [];
    if (inPunches.length > 0) {
      finalPunches.push({
        type: PunchType.IN,
        time: inPunches[0].time,
      });
    }
    if (outPunches.length > 0) {
      finalPunches.push({
        type: PunchType.OUT,
        time: outPunches[outPunches.length - 1].time,
      });
    }
    
    // Assign the cleaned array (only IN and OUT, one of each)
    record.punches = finalPunches;
    
    // Mark the punches array as modified to ensure Mongoose detects and saves the change
    // This is necessary when replacing entire arrays in Mongoose
    record.markModified('punches');
    
    // Calculate work minutes only if both IN and OUT exist
    if (finalPunches.length === 2 && inPunches.length > 0 && outPunches.length > 0) {
      record.totalWorkMinutes = this.calculateWorkMinutes(record.punches);
    } else {
      record.totalWorkMinutes = 0; // No calculation if missing IN or OUT
    }
    
    record.hasMissedPunch = this.checkMissedPunch(record.punches);
    
    // Extract employeeId properly (could be ObjectId or populated object)
    let employeeId: string;
    const empId = record.employeeId as any;
    if (typeof empId === 'object' && empId !== null) {
      // If it's a populated object, get the _id
      employeeId = empId._id?.toString() || empId.id?.toString() || String(empId);
    } else {
      // If it's already a string or ObjectId
      employeeId = empId?.toString() || '';
    }
    
    // Create audit trail notification only if we have a valid employeeId
    if (employeeId && Types.ObjectId.isValid(employeeId)) {
      try {
        await this.createNotification({
          to: employeeId,
          type: 'ATTENDANCE_CORRECTED',
          message: `Attendance manually corrected: ${correctionDto.reason || 'No reason provided'}`,
        });
      } catch (error) {
        // Log but don't fail the correction if notification fails
        console.warn('Failed to create notification for attendance correction:', error);
      }
    }

    const saved = await record.save();
    
    // Return the saved record with populated fields for frontend
    return await this.attendanceRecordModel.findById(saved._id)
      .populate('employeeId', 'firstName lastName fullName employeeNumber')
      .populate('exceptionIds')
      .exec() as any;
  }

  private calculateWorkMinutes(punches: Punch[]): number {
    if (!punches || punches.length < 2) return 0;

    // Normalize punches to ensure they're Date objects and sort by time
    const normalizedPunches = punches
      .map(p => ({
        type: p.type,
        time: p.time instanceof Date ? p.time : new Date(p.time),
      }))
      .sort((a, b) => a.time.getTime() - b.time.getTime());

    // Filter to only IN and OUT punches
    const inPunches = normalizedPunches.filter(p => {
      const typeStr = String(p.type).toUpperCase();
      return typeStr === 'IN' || p.type === PunchType.IN;
    });
    const outPunches = normalizedPunches.filter(p => {
      const typeStr = String(p.type).toUpperCase();
      return typeStr === 'OUT' || p.type === PunchType.OUT;
    });

    // If we have exactly one IN and one OUT, calculate simple difference
    if (inPunches.length === 1 && outPunches.length === 1) {
      const inTime = inPunches[0].time;
      const outTime = outPunches[0].time;
      const diffMs = outTime.getTime() - inTime.getTime();
      return diffMs > 0 ? Math.floor(diffMs / 60000) : 0;
    }

    // For multiple punches, pair them up (IN followed by OUT)
    // This handles MULTIPLE punch policy where employees can clock in/out multiple times
    let totalMinutes = 0;
    let i = 0;
    while (i < normalizedPunches.length) {
      // Find next IN punch
      while (i < normalizedPunches.length && normalizedPunches[i].type !== PunchType.IN) {
        i++;
      }
      if (i >= normalizedPunches.length) break;
      
      const inTime = normalizedPunches[i].time;
      i++;
      
      // Find corresponding OUT punch (next OUT after this IN)
      while (i < normalizedPunches.length && normalizedPunches[i].type !== PunchType.OUT) {
        i++;
      }
      if (i >= normalizedPunches.length) break;
      
      const outTime = normalizedPunches[i].time;
      const diffMs = outTime.getTime() - inTime.getTime();
      if (diffMs > 0) {
        totalMinutes += Math.floor(diffMs / 60000);
      }
      i++;
    }

    return totalMinutes;
  }

  private checkMissedPunch(punches: Punch[]): boolean {
    if (punches.length === 0) return true;
    
    // Ensure time is a Date object
    const normalizedPunches = punches.map(punch => ({
      ...punch,
      time: punch.time instanceof Date ? punch.time : new Date(punch.time)
    }));
    
    const sortedPunches = [...normalizedPunches].sort((a, b) => a.time.getTime() - b.time.getTime());
    const firstPunch = sortedPunches[0];
    const lastPunch = sortedPunches[sortedPunches.length - 1];

    // Check if first punch is OUT (missing IN) or last punch is IN (missing OUT)
    if (firstPunch.type === PunchType.OUT || lastPunch.type === PunchType.IN) {
      return true;
    }

    // Check for alternating pattern
    for (let i = 0; i < sortedPunches.length - 1; i++) {
      if (sortedPunches[i].type === sortedPunches[i + 1].type) {
        return true; // Two consecutive same type punches indicate missing punch
      }
    }

    return false;
  }

  // ==================== Attendance Correction Request Management ====================
  async createCorrectionRequest(createDto: CreateAttendanceCorrectionRequestDto): Promise<AttendanceCorrectionRequest> {
    // Verify attendance record exists
    await this.findAttendanceRecordById(createDto.attendanceRecord);
    
    // Set finalisedForPayroll to false
    await this.attendanceRecordModel.findByIdAndUpdate(createDto.attendanceRecord, {
      finalisedForPayroll: false,
    }).exec();

    const correctionRequest = new this.correctionRequestModel({
      employeeId: new Types.ObjectId(createDto.employeeId),
      attendanceRecord: new Types.ObjectId(createDto.attendanceRecord),
      reason: createDto.reason,
      status: CorrectionRequestStatus.SUBMITTED,
    });

    return correctionRequest.save();
  }

  async findAllCorrectionRequests(filters?: {
    employeeId?: string;
    status?: CorrectionRequestStatus;
  }): Promise<AttendanceCorrectionRequest[]> {
    const query: any = {};
    if (filters?.employeeId) {
      query.employeeId = new Types.ObjectId(filters.employeeId);
    }
    if (filters?.status) {
      query.status = filters.status;
    }

    return this.correctionRequestModel.find(query)
      .populate('employeeId', 'firstName lastName fullName employeeNumber')
      .populate('attendanceRecord')
      .populate({
        path: 'attendanceRecord',
        populate: { path: 'employeeId', select: 'firstName lastName fullName employeeNumber' }
      })
      .exec();
  }

  async findCorrectionRequestById(id: string): Promise<AttendanceCorrectionRequest> {
    const request = await this.correctionRequestModel.findById(id)
      .populate('employeeId', 'firstName lastName fullName employeeNumber')
      .populate('attendanceRecord')
      .populate({
        path: 'attendanceRecord',
        populate: { path: 'employeeId', select: 'firstName lastName fullName employeeNumber' }
      })
      .exec();
    if (!request) {
      throw new NotFoundException(`CorrectionRequest with ID ${id} not found`);
    }
    return request;
  }

  async updateCorrectionRequest(
    id: string,
    updateDto: UpdateAttendanceCorrectionRequestDto,
  ): Promise<AttendanceCorrectionRequest> {
    const request = await this.correctionRequestModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
    if (!request) {
      throw new NotFoundException(`CorrectionRequest with ID ${id} not found`);
    }

    // If approved, set attendance record as finalised
    if (updateDto.status === CorrectionRequestStatus.APPROVED) {
      await this.attendanceRecordModel.findByIdAndUpdate(request.attendanceRecord, {
        finalisedForPayroll: true,
      }).exec();
    }

    return request;
  }

  // ==================== Time Exception Management ====================
  async createTimeException(createDto: CreateTimeExceptionDto): Promise<TimeException> {
    await this.findAttendanceRecordById(createDto.attendanceRecordId);

    const timeException = new this.timeExceptionModel({
      employeeId: new Types.ObjectId(createDto.employeeId),
      type: createDto.type,
      attendanceRecordId: new Types.ObjectId(createDto.attendanceRecordId),
      assignedTo: new Types.ObjectId(createDto.assignedTo),
      status: createDto.status || TimeExceptionStatus.OPEN,
      reason: createDto.reason,
    });

    const saved = await timeException.save();

    // Add exception to attendance record
    await this.attendanceRecordModel.findByIdAndUpdate(createDto.attendanceRecordId, {
      $push: { exceptionIds: saved._id },
    }).exec();

    return saved;
  }

  async findAllTimeExceptions(filters?: {
    employeeId?: string;
    type?: TimeExceptionType;
    status?: TimeExceptionStatus;
    assignedTo?: string;
  }): Promise<TimeException[]> {
    const query: any = {};
    if (filters?.employeeId) {
      query.employeeId = new Types.ObjectId(filters.employeeId);
    }
    if (filters?.type) {
      query.type = filters.type;
    }
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.assignedTo) {
      query.assignedTo = new Types.ObjectId(filters.assignedTo);
    }

    const exceptions = await this.timeExceptionModel.find(query)
      .populate('employeeId', 'firstName lastName fullName employeeNumber')
      .populate('attendanceRecordId')
      .populate('assignedTo', 'firstName lastName fullName employeeNumber')
      .exec();
    
    // Sort by createdAt if available, otherwise by _id (newest first)
    return exceptions.sort((a, b) => {
      const aDate = (a as any).createdAt || a._id.getTimestamp();
      const bDate = (b as any).createdAt || b._id.getTimestamp();
      return bDate.getTime() - aDate.getTime();
    });
  }

  async findTimeExceptionById(id: string): Promise<TimeException> {
    const exception = await this.timeExceptionModel.findById(id)
      .populate('employeeId')
      .populate('attendanceRecordId')
      .populate('assignedTo')
      .exec();
    if (!exception) {
      throw new NotFoundException(`TimeException with ID ${id} not found`);
    }
    return exception;
  }

  async updateTimeException(id: string, updateDto: UpdateTimeExceptionDto): Promise<TimeException> {
    const exception = await this.timeExceptionModel.findByIdAndUpdate(id, {
      ...updateDto,
      assignedTo: updateDto.assignedTo ? new Types.ObjectId(updateDto.assignedTo) : undefined,
    }, { new: true }).exec();
    
    if (!exception) {
      throw new NotFoundException(`TimeException with ID ${id} not found`);
    }

    // Auto-escalate if pending too long
    if (exception.status === TimeExceptionStatus.PENDING) {
      await this.checkAndEscalateExceptions();
    }

    return exception;
  }

  async checkAndEscalateExceptions(deadlineHours: number = 48): Promise<void> {
    const deadline = new Date();
    deadline.setHours(deadline.getHours() - deadlineHours);

    const pendingExceptions = await this.timeExceptionModel.find({
      status: TimeExceptionStatus.PENDING,
      updatedAt: { $lt: deadline },
    }).exec();

    for (const exception of pendingExceptions) {
      await this.timeExceptionModel.findByIdAndUpdate(exception._id, {
        status: TimeExceptionStatus.ESCALATED,
      }).exec();

      await this.createNotification({
        to: exception.assignedTo.toString(),
        type: 'EXCEPTION_ESCALATED',
        message: `Time exception ${exception._id} has been escalated due to pending status`,
      });
    }
  }

  // ==================== Overtime Rule Management ====================
  async createOvertimeRule(createDto: CreateOvertimeRuleDto): Promise<OvertimeRule> {
    const rule = new this.overtimeRuleModel(createDto);
    return rule.save();
  }

  async findAllOvertimeRules(activeOnly?: boolean): Promise<OvertimeRule[]> {
    const query = activeOnly ? { active: true } : {};
    return this.overtimeRuleModel.find(query).exec();
  }

  async findOvertimeRuleById(id: string): Promise<OvertimeRule> {
    const rule = await this.overtimeRuleModel.findById(id).exec();
    if (!rule) {
      throw new NotFoundException(`OvertimeRule with ID ${id} not found`);
    }
    return rule;
  }

  async updateOvertimeRule(id: string, updateDto: UpdateOvertimeRuleDto): Promise<OvertimeRule> {
    // Remove any MongoDB timestamp fields that shouldn't be updated
    const cleanDto: any = { ...updateDto };
    delete cleanDto.createdAt;
    delete cleanDto.updatedAt;
    delete (cleanDto as any)._id;
    delete (cleanDto as any).__v;
    
    const rule = await this.overtimeRuleModel.findByIdAndUpdate(id, cleanDto, { new: true }).exec();
    if (!rule) {
      throw new NotFoundException(`OvertimeRule with ID ${id} not found`);
    }
    return rule;
  }

  async deleteOvertimeRule(id: string): Promise<void> {
    const result = await this.overtimeRuleModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`OvertimeRule with ID ${id} not found`);
    }
  }

  // ==================== Lateness Rule Management ====================
  async createLatenessRule(createDto: CreateLatenessRuleDto): Promise<LatenessRule> {
    const rule = new this.latenessRuleModel(createDto);
    return rule.save();
  }

  async findAllLatenessRules(activeOnly?: boolean): Promise<LatenessRule[]> {
    const query = activeOnly ? { active: true } : {};
    return this.latenessRuleModel.find(query).exec();
  }

  async findLatenessRuleById(id: string): Promise<LatenessRule> {
    const rule = await this.latenessRuleModel.findById(id).exec();
    if (!rule) {
      throw new NotFoundException(`LatenessRule with ID ${id} not found`);
    }
    return rule;
  }

  async updateLatenessRule(id: string, updateDto: UpdateLatenessRuleDto): Promise<LatenessRule> {
    const rule = await this.latenessRuleModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
    if (!rule) {
      throw new NotFoundException(`LatenessRule with ID ${id} not found`);
    }
    return rule;
  }

  async deleteLatenessRule(id: string): Promise<void> {
    const result = await this.latenessRuleModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`LatenessRule with ID ${id} not found`);
    }
  }

  // ==================== Holiday Management ====================
  async createHoliday(createDto: CreateHolidayDto): Promise<Holiday> {
    const holiday = new this.holidayModel({
      ...createDto,
      startDate: new Date(createDto.startDate),
      endDate: createDto.endDate ? new Date(createDto.endDate) : undefined,
    });
    return holiday.save();
  }

  async findAllHolidays(filters?: {
    type?: HolidayType;
    activeOnly?: boolean;
    year?: number;
  }): Promise<Holiday[]> {
    const query: any = {};
    if (filters?.type) {
      query.type = filters.type;
    }
    if (filters?.activeOnly) {
      query.active = true;
    }
    if (filters?.year) {
      query.startDate = {
        $gte: new Date(filters.year, 0, 1),
        $lt: new Date(filters.year + 1, 0, 1),
      };
    }

    return this.holidayModel.find(query).exec();
  }

  async findHolidayById(id: string): Promise<Holiday> {
    const holiday = await this.holidayModel.findById(id).exec();
    if (!holiday) {
      throw new NotFoundException(`Holiday with ID ${id} not found`);
    }
    return holiday;
  }

  async updateHoliday(id: string, updateDto: UpdateHolidayDto): Promise<Holiday> {
    // Remove any MongoDB timestamp fields that shouldn't be updated
    const cleanDto: any = { ...updateDto };
    delete cleanDto.createdAt;
    delete cleanDto.updatedAt;
    delete (cleanDto as any)._id;
    delete (cleanDto as any).__v;
    
    const updateData: any = { ...cleanDto };
    if (cleanDto.startDate) {
      updateData.startDate = new Date(cleanDto.startDate);
    }
    if (cleanDto.endDate !== undefined) {
      updateData.endDate = cleanDto.endDate ? new Date(cleanDto.endDate) : null;
    }

    const holiday = await this.holidayModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!holiday) {
      throw new NotFoundException(`Holiday with ID ${id} not found`);
    }
    return holiday;
  }

  async deleteHoliday(id: string): Promise<void> {
    const result = await this.holidayModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Holiday with ID ${id} not found`);
    }
  }

  // ==================== Reporting ====================
  async generateAttendanceReport(reportDto: AttendanceReportDto): Promise<any> {
    const query: any = {};
    if (reportDto.employeeId) {
      query.employeeId = new Types.ObjectId(reportDto.employeeId);
    }
    // Note: Date filtering by createdAt is skipped since AttendanceRecord schema doesn't have timestamps
    // We'll filter by _id timestamp in memory after fetching
    
    console.log('Attendance Report Query:', {
      employeeId: query.employeeId?.toString(),
      dateRange: reportDto.startDate || reportDto.endDate ? {
        from: reportDto.startDate,
        to: reportDto.endDate
      } : 'all dates',
      startDateParam: reportDto.startDate,
      endDateParam: reportDto.endDate
    });

    const records = await this.attendanceRecordModel.find(query)
      .populate('employeeId', 'firstName lastName fullName employeeNumber')
      .sort({ _id: -1 }) // Sort by _id (newest first) since createdAt may not exist
      .exec();

    // Apply date filtering in memory if needed (using _id timestamp as approximation)
    let filteredRecords = records;
    if (reportDto.startDate || reportDto.endDate) {
      filteredRecords = records.filter(record => {
        // Get date from _id timestamp or first punch time
        let recordDate: Date | null = null;
        
        // Try to get date from _id timestamp
        try {
          if (record._id && typeof record._id === 'object' && (record._id as any).getTimestamp) {
            recordDate = (record._id as any).getTimestamp();
          }
        } catch (e) {
          // Ignore errors
        }
        
        // If no date from _id, try first punch time
        if (!recordDate && record.punches && record.punches.length > 0) {
          try {
            const sortedPunches = [...record.punches].sort((a, b) => {
              const timeA = a.time instanceof Date ? a.time : new Date(a.time);
              const timeB = b.time instanceof Date ? b.time : new Date(b.time);
              return timeA.getTime() - timeB.getTime();
            });
            recordDate = sortedPunches[0].time instanceof Date 
              ? sortedPunches[0].time 
              : new Date(sortedPunches[0].time);
          } catch (e) {
            // Ignore errors
          }
        }
        
        // If still no date, skip this record
        if (!recordDate) {
          return false;
        }
        
        // Apply date filters
        if (reportDto.startDate) {
          const startDate = new Date(reportDto.startDate);
          startDate.setHours(0, 0, 0, 0);
          if (recordDate < startDate) {
            return false;
          }
        }
        if (reportDto.endDate) {
          const endDate = new Date(reportDto.endDate);
          endDate.setHours(23, 59, 59, 999);
          if (recordDate > endDate) {
            return false;
          }
        }
        
        return true;
      });
    }

    console.log(`Found ${filteredRecords.length} attendance records matching query (out of ${records.length} total)`);
    if (filteredRecords.length > 0) {
      const sampleRecord = filteredRecords[0];
      console.log('Sample record _id:', sampleRecord._id);
      console.log('Sample record employee:', sampleRecord.employeeId);
      console.log('Sample record totalWorkMinutes:', sampleRecord.totalWorkMinutes);
    } else {
      // Check if there are any records at all (for debugging)
      const totalRecords = await this.attendanceRecordModel.countDocuments({});
      console.log(`Total attendance records in database: ${totalRecords}`);
    }

    // Group records by employee and date (same logic as frontend attendance page)
    const grouped: any = {};
    
    filteredRecords.forEach((record) => {
      // Get employee ID
      const employee = record.employeeId;
      let employeeId: string;
      if (typeof employee === 'object' && employee && employee !== null) {
        employeeId = (employee as any)._id?.toString() || (employee as any).id?.toString() || String(employee);
      } else {
        employeeId = employee ? String(employee) : 'unknown';
      }
      
      // Get date from _id timestamp or first punch time
      let recordDate: Date = new Date();
      try {
        if (record._id && typeof record._id === 'object' && (record._id as any).getTimestamp) {
          recordDate = (record._id as any).getTimestamp();
        } else if (record.punches && record.punches.length > 0) {
          const sortedPunches = [...record.punches].sort((a, b) => {
            const timeA = a.time instanceof Date ? a.time : new Date(a.time);
            const timeB = b.time instanceof Date ? b.time : new Date(b.time);
            return timeA.getTime() - timeB.getTime();
          });
          recordDate = sortedPunches[0].time instanceof Date 
            ? sortedPunches[0].time 
            : new Date(sortedPunches[0].time);
        }
      } catch (e) {
        // Use current date as fallback
      }
      
      // Get date string for grouping
      const dateStr = recordDate.toISOString().split('T')[0];
      const key = `${employeeId}_${dateStr}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          employeeId: employee,
          date: recordDate,
          dateStr: dateStr,
          punches: [],
          hasMissedPunch: false,
        };
      }
      
      // Add punches from this record
      if (record.punches && Array.isArray(record.punches)) {
        grouped[key].punches.push(...record.punches);
      }
      
      // Update hasMissedPunch if any record has it
      if (record.hasMissedPunch) {
        grouped[key].hasMissedPunch = true;
      }
    });
    
    // Calculate work minutes for each grouped record
    const processedRecords = Object.values(grouped).map((group: any) => {
      const recalculatedMinutes = this.calculateWorkMinutes(group.punches);
      
      // Debug first group
      if (Object.values(grouped).indexOf(group) === 0) {
        console.log('Sample grouped record for work minutes calculation:', {
          employeeId: group.employeeId,
          date: group.dateStr,
          punchesLength: group.punches?.length || 0,
          punches: group.punches,
          calculatedMinutes: recalculatedMinutes
        });
      }
      
      return {
        employeeId: group.employeeId,
        date: group.date,
        totalWorkMinutes: recalculatedMinutes,
        hasMissedPunch: group.hasMissedPunch,
        punches: group.punches,
      };
    });

    const totalWorkMinutes = processedRecords.reduce((sum, r) => sum + (r.totalWorkMinutes || 0), 0);

    console.log(`Processed ${processedRecords.length} records, total work minutes: ${totalWorkMinutes}`);

    return {
      totalRecords: processedRecords.length,
      totalWorkMinutes: totalWorkMinutes,
      records: processedRecords,
    };
  }

  async generateOvertimeReport(reportDto: OvertimeReportDto): Promise<any> {
    const query: any = {};
    if (reportDto.employeeId) {
      query.employeeId = new Types.ObjectId(reportDto.employeeId);
    }
    // Note: Date filtering by createdAt is skipped since AttendanceRecord schema doesn't have timestamps
    // We'll filter by _id timestamp in memory after fetching
    
    console.log('Overtime Report Query:', {
      employeeId: query.employeeId?.toString(),
      dateRange: reportDto.startDate || reportDto.endDate ? {
        from: reportDto.startDate,
        to: reportDto.endDate
      } : 'all dates',
      startDateParam: reportDto.startDate,
      endDateParam: reportDto.endDate
    });

    const records = await this.attendanceRecordModel.find(query)
      .populate('employeeId', 'firstName lastName fullName employeeNumber')
      .lean() // Get plain objects instead of Mongoose documents
      .sort({ _id: -1 }) // Sort by _id (newest first) since createdAt may not exist
      .exec();

    console.log(`Overtime Report - Found ${records.length} total attendance records`);

    // Use stored totalWorkMinutes from database (don't recalculate)
    // The database already has the correct value stored
    const processedRecords = records.map((r: any) => {
      // Use stored totalWorkMinutes if available, otherwise calculate
      const workMinutes = r.totalWorkMinutes !== undefined && r.totalWorkMinutes !== null
        ? r.totalWorkMinutes
        : this.calculateWorkMinutes(r.punches || []);
      
      // Preserve all original record properties, just ensure totalWorkMinutes is set
      return {
        ...r,
        totalWorkMinutes: workMinutes,
      };
    });

    console.log(`Overtime Report - Processed ${processedRecords.length} records`);
    if (processedRecords.length > 0) {
      const sample = processedRecords[0];
      console.log('Overtime Report - Sample processed record:', {
        _id: sample._id,
        employeeId: sample.employeeId,
        totalWorkMinutes: sample.totalWorkMinutes,
        totalWorkMinutesType: typeof sample.totalWorkMinutes,
        punchesCount: sample.punches?.length || 0,
      });
    }

    // Apply date filtering in memory if needed (using _id timestamp or first punch time)
    let filteredRecords = processedRecords;
    if (reportDto.startDate || reportDto.endDate) {
      console.log(`Overtime Report - Applying date filter: startDate=${reportDto.startDate}, endDate=${reportDto.endDate}`);
      filteredRecords = processedRecords.filter((record: any) => {
        // Get date from _id timestamp or first punch time
        let recordDate: Date | null = null;
        
        // Try to get date from _id timestamp
        try {
          if (record._id) {
            // If _id is an ObjectId object, try to get timestamp
            if (typeof record._id === 'object' && (record._id as any).getTimestamp) {
              recordDate = (record._id as any).getTimestamp();
            } else if (typeof record._id === 'string') {
              // If _id is a string, try to extract timestamp from ObjectId string
              try {
                const objectId = new Types.ObjectId(record._id);
                recordDate = objectId.getTimestamp();
              } catch (e) {
                // Ignore if not a valid ObjectId
              }
            }
          }
        } catch (e) {
          console.log(`Error getting date from _id: ${e}`);
        }
        
        // If no date from _id, try first punch time
        if (!recordDate && record.punches && Array.isArray(record.punches) && record.punches.length > 0) {
          try {
            const sortedPunches = [...record.punches].sort((a: any, b: any) => {
              const timeA = a.time instanceof Date ? a.time : new Date(a.time);
              const timeB = b.time instanceof Date ? b.time : new Date(b.time);
              return timeA.getTime() - timeB.getTime();
            });
            recordDate = sortedPunches[0].time instanceof Date 
              ? sortedPunches[0].time 
              : new Date(sortedPunches[0].time);
          } catch (e) {
            console.log(`Error getting date from punches: ${e}`);
          }
        }
        
        // If still no date, include the record anyway (don't filter it out)
        // This ensures we don't lose records due to date extraction issues
        if (!recordDate) {
          console.log(`Warning: Could not extract date for record _id=${record._id}, including it anyway`);
          return true; // Include records without dates to avoid losing data
        }
        
        // Apply date filters
        if (reportDto.startDate) {
          const startDate = new Date(reportDto.startDate);
          startDate.setHours(0, 0, 0, 0);
          if (recordDate < startDate) {
            return false;
          }
        }
        if (reportDto.endDate) {
          const endDate = new Date(reportDto.endDate);
          endDate.setHours(23, 59, 59, 999);
          if (recordDate > endDate) {
            return false;
          }
        }
        
        return true;
      });
    }

    console.log(`Overtime Report - Found ${filteredRecords.length} attendance records matching date query (out of ${records.length} total)`);
    if (filteredRecords.length > 0) {
      const sample = filteredRecords[0];
      console.log('Overtime Report - Sample filtered record:', {
        _id: sample._id,
        employeeId: sample.employeeId,
        totalWorkMinutes: sample.totalWorkMinutes,
        hasPunches: !!sample.punches && sample.punches.length > 0,
      });
    }

    // Filter records where totalWorkMinutes > 8 hours (480 minutes)
    // This shows all employees who worked more than 8 hours
    const EIGHT_HOURS_IN_MINUTES = 480;
    const overtimeData: any[] = [];
    
    for (const record of filteredRecords) {
      // Only include records where work hours > 8 hours (480 minutes)
      // Use the stored totalWorkMinutes value from database
      const workMinutes = record.totalWorkMinutes || 0;
      
      console.log(`Checking record: _id=${record._id}, totalWorkMinutes=${workMinutes}, type=${typeof workMinutes}, > 480? ${workMinutes > EIGHT_HOURS_IN_MINUTES}`);
      
      if (workMinutes > EIGHT_HOURS_IN_MINUTES) {
        // Get date for the record
        let recordDate: Date = new Date();
        try {
          if (record._id && typeof record._id === 'object' && (record._id as any).getTimestamp) {
            recordDate = (record._id as any).getTimestamp();
          } else if (record.punches && record.punches.length > 0) {
            const sortedPunches = [...record.punches].sort((a, b) => {
              const timeA = a.time instanceof Date ? a.time : new Date(a.time);
              const timeB = b.time instanceof Date ? b.time : new Date(b.time);
              return timeA.getTime() - timeB.getTime();
            });
            recordDate = sortedPunches[0].time instanceof Date 
              ? sortedPunches[0].time 
              : new Date(sortedPunches[0].time);
          }
        } catch (e) {
          // Use current date as fallback
        }
        
        const overtimeMinutes = workMinutes - EIGHT_HOURS_IN_MINUTES;
        
        // Ensure employeeId is properly formatted (handle populated objects)
        let employeeId = record.employeeId;
        if (typeof employeeId === 'object' && employeeId !== null) {
          // Keep the populated employee object for frontend display
          employeeId = employeeId;
        }
        
        overtimeData.push({
          employeeId: employeeId, // This will be the populated employee object
          date: recordDate,
          overtimeMinutes: overtimeMinutes,
          totalWorkMinutes: workMinutes, // Use the stored value
          regularMinutes: EIGHT_HOURS_IN_MINUTES, // Standard 8 hours
        });
        
        console.log(`✓ Overtime Record Added: WorkMinutes=${workMinutes}, Overtime=${overtimeMinutes}min (${(overtimeMinutes/60).toFixed(2)}h), Date=${recordDate.toISOString().split('T')[0]}`);
      } else {
        console.log(`✗ Record skipped: WorkMinutes=${workMinutes} (not > ${EIGHT_HOURS_IN_MINUTES})`);
      }
    }

    console.log(`Overtime Report - Found ${overtimeData.length} records with overtime (> 8 hours)`);
    if (overtimeData.length > 0) {
      const sample = overtimeData[0];
      console.log('Overtime Report - Sample record:', {
        employeeId: sample.employeeId,
        employeeIdType: typeof sample.employeeId,
        employeeIdIsObject: typeof sample.employeeId === 'object',
        date: sample.date,
        overtimeMinutes: sample.overtimeMinutes,
        totalWorkMinutes: sample.totalWorkMinutes,
        hasEmployeeFirstName: (sample.employeeId as any)?.firstName,
        hasEmployeeFullName: (sample.employeeId as any)?.fullName,
      });
    } else {
      console.log('Overtime Report - No records found with overtime. Filtered records count:', filteredRecords.length);
      if (filteredRecords.length > 0) {
        const sample = filteredRecords[0];
        console.log('Overtime Report - Sample filtered record (no overtime):', {
          totalWorkMinutes: sample.totalWorkMinutes,
          employeeId: sample.employeeId,
        });
      }
    }

    const totalOvertimeMinutes = overtimeData.reduce((sum, d) => sum + (d.overtimeMinutes || 0), 0);
    const uniqueEmployees = new Set(
      overtimeData.map(d => {
        const emp = d.employeeId;
        return typeof emp === 'object' ? (emp._id || emp.id)?.toString() : emp?.toString();
      })
    );

    return {
      totalOvertimeMinutes: totalOvertimeMinutes,
      totalOvertimeHours: Number((totalOvertimeMinutes / 60).toFixed(2)),
      totalRecords: overtimeData.length,
      totalEmployees: uniqueEmployees.size,
      records: overtimeData,
    };
  }

  async generateExceptionReport(reportDto: ExceptionReportDto): Promise<any> {
    const filters: any = {};
    if (reportDto.employeeId) {
      filters.employeeId = reportDto.employeeId;
    }
    if (reportDto.type) {
      filters.type = reportDto.type;
    }
    if (reportDto.status) {
      filters.status = reportDto.status;
    }

    const exceptions = await this.findAllTimeExceptions(filters);
    
    // Filter by date if provided
    let filteredExceptions = exceptions;
    if (reportDto.startDate || reportDto.endDate) {
      filteredExceptions = exceptions.filter(exception => {
        const exceptionDate = new Date((exception as any).createdAt || new Date());
        if (reportDto.startDate && exceptionDate < new Date(reportDto.startDate)) {
          return false;
        }
        if (reportDto.endDate && exceptionDate > new Date(reportDto.endDate)) {
          return false;
        }
        return true;
      });
    }

    // Debug logging for employee population
    if (filteredExceptions.length > 0) {
      const sampleException = filteredExceptions[0] as any;
      console.log('Exception Report - Sample exception data:', {
        exceptionId: sampleException._id || sampleException.id,
        employeeId: sampleException.employeeId,
        employeeIdType: typeof sampleException.employeeId,
        employeeIdIsObject: typeof sampleException.employeeId === 'object',
        employeeIdIsNull: sampleException.employeeId === null,
        hasFirstName: sampleException.employeeId?.firstName,
        hasLastName: sampleException.employeeId?.lastName,
        hasFullName: sampleException.employeeId?.fullName,
        hasEmployeeNumber: sampleException.employeeId?.employeeNumber,
        createdAt: sampleException.createdAt,
        createdAtType: typeof sampleException.createdAt,
        fullEmployeeObject: sampleException.employeeId,
      });
    }

    return {
      totalExceptions: filteredExceptions.length,
      byType: this.groupBy(filteredExceptions, 'type'),
      byStatus: this.groupBy(filteredExceptions, 'status'),
      exceptions: filteredExceptions,
    };
  }

  private getExpectedWorkMinutes(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes - startMinutes;
  }

  private groupBy(array: any[], key: string): any {
    return array.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) {
        result[group] = [];
      }
      result[group].push(item);
      return result;
    }, {});
  }

  // ==================== Notification Management ====================
  async createNotification(notification: {
    to: string;
    type: string;
    message?: string;
  }): Promise<NotificationLog> {
    const notif = new this.notificationLogModel({
      to: new Types.ObjectId(notification.to),
      type: notification.type,
      message: notification.message,
    });
    return notif.save();
  }

  async findNotificationsByEmployee(employeeId: string): Promise<NotificationLog[]> {
    return this.notificationLogModel.find({
      to: new Types.ObjectId(employeeId),
    }).sort({ createdAt: -1 }).exec();
  }

  // ==================== Utility Methods ====================
  async checkMissedPunchesAndNotify(employeeId?: string): Promise<{ missedPunches: any[], message: string }> {
    // Build query - check ALL records for missing IN or OUT punches (not just today's)
    const query: any = {};
    
    if (employeeId) {
      query.employeeId = new Types.ObjectId(employeeId);
    }

    const records = await this.attendanceRecordModel.find(query)
      .populate('employeeId', 'firstName lastName fullName employeeNumber')
      .exec();

    const missedPunches: any[] = [];

    for (const record of records) {
      try {
        // Check if record has missed punch (missing IN or OUT)
        const hasIn = record.punches?.some((p: any) => String(p.type).toUpperCase() === 'IN');
        const hasOut = record.punches?.some((p: any) => String(p.type).toUpperCase() === 'OUT');
        
        // A missed punch occurs when:
        // 1. No punches at all
        // 2. Has OUT but no IN (missing clock in)
        // 3. Has IN but no OUT (missing clock out)
        const hasMissedPunch = !hasIn || !hasOut;

        if (hasMissedPunch) {
        // Get employee name and ID
        const employee = record.employeeId;
        let employeeName = 'Unknown Employee';
        let employeeIdStr: string | null = null;
        
        if (typeof employee === 'object' && employee !== null) {
          employeeName = (employee as any).fullName || 
            ((employee as any).firstName && (employee as any).lastName 
              ? `${(employee as any).firstName} ${(employee as any).lastName}`
              : (employee as any).firstName || (employee as any).lastName || (employee as any).employeeNumber || 'Unknown Employee');
          
          // Safely extract employee ID
          if ((employee as any)._id) {
            employeeIdStr = (employee as any)._id.toString();
          } else if ((employee as any).id) {
            employeeIdStr = (employee as any).id.toString();
          } else {
            // Try to convert to string if it's an ObjectId
            try {
              const empId = employee as any;
              if (empId.toString && typeof empId.toString === 'function') {
                employeeIdStr = empId.toString();
              }
            } catch (e) {
              // Ignore
            }
          }
        } else if (employee) {
          // If it's a string or ObjectId directly
          try {
            if (typeof employee === 'string') {
              employeeIdStr = employee;
            } else {
              const empId = employee as any;
              employeeIdStr = empId.toString ? empId.toString() : String(employee);
            }
          } catch (e) {
            employeeIdStr = String(employee);
          }
        }

        // Always add to missed punches list, even if employeeId is invalid
        // This ensures we report all missed punches
        const isValidEmployeeId = employeeIdStr && Types.ObjectId.isValid(employeeIdStr);
        
        if (!isValidEmployeeId) {
          console.warn(`Record ${record._id} has missed punch but invalid/null employee ID. Still reporting it.`);
          // Use record ID as fallback identifier
          employeeIdStr = record._id.toString();
          employeeName = `Record ${record._id.toString().substring(0, 8)}... (No Employee ID)`;
        }

        missedPunches.push({
          employeeId: employeeIdStr || 'unknown',
          employeeName,
          recordId: record._id.toString(),
          missingIn: !hasIn,
          missingOut: !hasOut,
        });

        // Update record flag (non-blocking - don't await to speed up processing)
        record.hasMissedPunch = true;
        record.save().catch((error) => {
          console.error(`Failed to update record flag for record ${record._id}:`, error);
        });

        // Send notification and create time exception (non-blocking for valid employee IDs)
        if (isValidEmployeeId && employeeIdStr) {
          // Create notification (non-blocking)
          this.createNotification({
            to: employeeIdStr,
            type: 'MISSED_PUNCH',
            message: 'You have a missed punch in your attendance record. Please submit a correction request.',
          }).catch((error) => {
            console.error(`Failed to create notification for employee ${employeeIdStr}:`, error);
          });

          // Create time exception (non-blocking)
          this.createTimeException({
            employeeId: employeeIdStr,
            type: TimeExceptionType.MISSED_PUNCH,
            attendanceRecordId: record._id.toString(),
            assignedTo: employeeIdStr, // In real system, this would be the line manager
          }).catch((error) => {
            console.error(`Failed to create time exception for employee ${employeeIdStr}:`, error);
          });
        } else {
          console.warn(`Skipping notification/exception creation for record ${record._id} - invalid employee ID`);
        }
      } else {
        // Update record flag if it was previously marked as having missed punch
        if (record.hasMissedPunch) {
          try {
            record.hasMissedPunch = false;
            await record.save();
          } catch (error) {
            console.error(`Failed to update record flag for record ${record._id}:`, error);
          }
        }
      }
      } catch (error) {
        console.error(`Error processing record ${record._id}:`, error);
        // Continue processing other records even if one fails
      }
    }

    // Log results for debugging
    console.log(`checkMissedPunchesAndNotify: Found ${missedPunches.length} missed punch(es)`);
    if (missedPunches.length > 0) {
      console.log('Missed punches details:', missedPunches.map(mp => ({
        employeeName: mp.employeeName,
        missingIn: mp.missingIn,
        missingOut: mp.missingOut,
        recordId: mp.recordId
      })));
    }

    let message = '';
    if (missedPunches.length === 0) {
      message = 'No missed punches found.';
    } else {
      const employeeNames = missedPunches.map(mp => mp.employeeName).join(', ');
      message = `Found ${missedPunches.length} missed punch(es) for: ${employeeNames}`;
    }

    const result = { missedPunches, message };
    console.log('checkMissedPunchesAndNotify: Returning result:', JSON.stringify(result, null, 2));
    return result;
  }

  async escalatePendingRequestsBeforePayrollCutoff(cutoffDate: Date): Promise<void> {
    const pendingRequests = await this.correctionRequestModel.find({
      status: CorrectionRequestStatus.SUBMITTED,
      createdAt: { $lt: cutoffDate },
    }).exec();

    for (const request of pendingRequests) {
      await this.correctionRequestModel.findByIdAndUpdate(request._id, {
        status: CorrectionRequestStatus.ESCALATED,
      }).exec();

      await this.createNotification({
        to: request.employeeId.toString(),
        type: 'REQUEST_ESCALATED',
        message: 'Your attendance correction request has been escalated due to payroll cutoff deadline.',
      });
    }

    // Also escalate time exceptions
    await this.timeExceptionModel.updateMany(
      {
        status: TimeExceptionStatus.PENDING,
        createdAt: { $lt: cutoffDate },
      },
      {
        status: TimeExceptionStatus.ESCALATED,
      },
    ).exec();
  }
}
