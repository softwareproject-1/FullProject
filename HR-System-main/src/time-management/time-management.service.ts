import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
    const shiftType = await this.shiftTypeModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
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
    if (updateDto.shiftType) {
      await this.findShiftTypeById(updateDto.shiftType);
    }
    const shift = await this.shiftModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
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
    const scheduleRule = await this.scheduleRuleModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
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
    if (filters?.employeeId) query.employeeId = new Types.ObjectId(filters.employeeId);
    if (filters?.departmentId) query.departmentId = new Types.ObjectId(filters.departmentId);
    if (filters?.positionId) query.positionId = new Types.ObjectId(filters.positionId);
    if (filters?.status) query.status = filters.status;

    return this.shiftAssignmentModel.find(query)
      .populate('shiftId')
      .populate('scheduleRuleId')
      .exec();
  }

  async findShiftAssignmentById(id: string): Promise<ShiftAssignment> {
    const assignment = await this.shiftAssignmentModel.findById(id)
      .populate('shiftId')
      .populate('scheduleRuleId')
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

    if (assignment && (assignment.shiftId as any)?._id) {
      const shift = await this.findShiftById((assignment.shiftId as any)._id.toString());
      
      if (shift.punchPolicy === 'FIRST_LAST') {
        // Keep only first IN and last OUT
        const inPunches = attendanceRecord.punches.filter(p => p.type === PunchType.IN);
        const outPunches = attendanceRecord.punches.filter(p => p.type === PunchType.OUT);
        
        if (clockDto.type === PunchType.IN) {
          attendanceRecord.punches = inPunches.length === 0 
            ? [...outPunches, newPunch]
            : [...outPunches, inPunches[0]];
        } else {
          attendanceRecord.punches = [...inPunches, newPunch];
        }
      } else {
        attendanceRecord.punches.push(newPunch);
      }
    } else {
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
    const query: any = {};
    if (filters?.employeeId) {
      query.employeeId = new Types.ObjectId(filters.employeeId);
    }
    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.createdAt.$lte = new Date(filters.endDate);
      }
    }

    return this.attendanceRecordModel.find(query)
      .populate('employeeId')
      .populate('exceptionIds')
      .exec();
  }

  async findAttendanceRecordById(id: string): Promise<AttendanceRecord> {
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
    
    (record as any).punches = correctionDto.punches.map(p => ({
      type: p.type,
      time: new Date(p.time),
    }));
    
    (record as any).totalWorkMinutes = this.calculateWorkMinutes((record as any).punches);
    (record as any).hasMissedPunch = this.checkMissedPunch((record as any).punches);
    
    // Create audit trail notification
    await this.createNotification({
      to: (record as any).employeeId.toString(),
      type: 'ATTENDANCE_CORRECTED',
      message: `Attendance manually corrected: ${correctionDto.reason || 'No reason provided'}`,
    });

    return (await (record as any).save()) as any;
  }

  private calculateWorkMinutes(punches: Punch[]): number {
    if (punches.length < 2) return 0;

    const sortedPunches = [...punches].sort((a, b) => a.time.getTime() - b.time.getTime());
    let totalMinutes = 0;
    let lastInTime: Date | null = null;

    for (const punch of sortedPunches) {
      if (punch.type === PunchType.IN) {
        lastInTime = punch.time;
      } else if (punch.type === PunchType.OUT && lastInTime) {
        const diffMs = punch.time.getTime() - lastInTime.getTime();
        totalMinutes += Math.floor(diffMs / 60000);
        lastInTime = null;
      }
    }

    return totalMinutes;
  }

  private checkMissedPunch(punches: Punch[]): boolean {
    if (punches.length === 0) return true;
    
    const sortedPunches = [...punches].sort((a, b) => a.time.getTime() - b.time.getTime());
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
      .populate('employeeId')
      .populate('attendanceRecord')
      .exec();
  }

  async findCorrectionRequestById(id: string): Promise<AttendanceCorrectionRequest> {
    const request = await this.correctionRequestModel.findById(id)
      .populate('employeeId')
      .populate('attendanceRecord')
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

    return this.timeExceptionModel.find(query)
      .populate('employeeId')
      .populate('attendanceRecordId')
      .populate('assignedTo')
      .exec();
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
    const rule = await this.overtimeRuleModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
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
    const updateData: any = { ...updateDto };
    if (updateDto.startDate) {
      updateData.startDate = new Date(updateDto.startDate);
    }
    if (updateDto.endDate !== undefined) {
      updateData.endDate = updateDto.endDate ? new Date(updateDto.endDate) : null;
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
    if (reportDto.startDate || reportDto.endDate) {
      query.createdAt = {};
      if (reportDto.startDate) {
        query.createdAt.$gte = new Date(reportDto.startDate);
      }
      if (reportDto.endDate) {
        query.createdAt.$lte = new Date(reportDto.endDate);
      }
    }

    const records = await this.attendanceRecordModel.find(query)
      .populate('employeeId')
      .exec();

    return {
      totalRecords: records.length,
      totalWorkMinutes: records.reduce((sum, r) => sum + r.totalWorkMinutes, 0),
      records: records.map(r => ({
        employeeId: r.employeeId,
        date: (r as any).createdAt || new Date(),
        totalWorkMinutes: r.totalWorkMinutes,
        hasMissedPunch: r.hasMissedPunch,
        punches: r.punches,
      })),
    };
  }

  async generateOvertimeReport(reportDto: OvertimeReportDto): Promise<any> {
    // This would need integration with shift assignments and rules
    // For now, return a placeholder structure
    const query: any = {};
    if (reportDto.employeeId) {
      query.employeeId = new Types.ObjectId(reportDto.employeeId);
    }

    const records = await this.attendanceRecordModel.find(query)
      .populate('employeeId')
      .exec();

    // Calculate overtime based on shift assignments
    const overtimeData: any[] = [];
    for (const record of records) {
      const assignment = await this.shiftAssignmentModel.findOne({
        employeeId: record.employeeId,
        startDate: { $lte: (record as any).createdAt || new Date() },
        $or: [{ endDate: { $gte: (record as any).createdAt || new Date() } }, { endDate: null }],
      }).populate('shiftId').exec();

      if (assignment && (assignment.shiftId as any)?._id) {
        const shift = await this.findShiftById((assignment.shiftId as any)._id.toString());
        const expectedMinutes = this.getExpectedWorkMinutes(shift.startTime, shift.endTime);
        const overtime = Math.max(0, record.totalWorkMinutes - expectedMinutes);
        
        if (overtime > 0) {
          overtimeData.push({
            employeeId: record.employeeId,
            date: (record as any).createdAt || new Date(),
            overtimeMinutes: overtime,
            totalWorkMinutes: record.totalWorkMinutes,
          });
        }
      }
    }

    return {
      totalOvertimeMinutes: overtimeData.reduce((sum, d) => sum + d.overtimeMinutes, 0),
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
  async checkMissedPunchesAndNotify(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const records = await this.attendanceRecordModel.find({
      createdAt: { $gte: today, $lt: tomorrow },
      hasMissedPunch: true,
    }).populate('employeeId').exec();

    for (const record of records) {
      await this.createNotification({
        to: record.employeeId.toString(),
        type: 'MISSED_PUNCH',
        message: 'You have a missed punch in your attendance record. Please submit a correction request.',
      });

      // Create time exception
      await this.createTimeException({
        employeeId: record.employeeId.toString(),
        type: TimeExceptionType.MISSED_PUNCH,
        attendanceRecordId: record._id.toString(),
        assignedTo: record.employeeId.toString(), // In real system, this would be the line manager
      });
    }
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