import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    UsePipes,
    ValidationPipe,
    UseGuards,
    ForbiddenException,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
    ApiBody,
    ApiBearerAuth,
  } from '@nestjs/swagger';
  import { TimeManagementService } from './time-management.service';
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
  import { ShiftAssignmentStatus, CorrectionRequestStatus, TimeExceptionStatus } from './models/enums/index';
  import { AuthenticationGuard } from '../auth/guards/authentication.guard';
  import { RolesGuard } from '../auth/guards/roles.guard';
  import { Roles } from '../auth/decorators/roles.decorator';
  import { CurrentUser } from '../auth/decorators/current-user.decorator';
  import { SystemRole } from '../employee-profile/enums/employee-profile.enums';
  
  @ApiTags('time-management')
  @Controller('time-management')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @UseGuards(AuthenticationGuard, RolesGuard)
  export class TimeManagementController {
    constructor(private readonly timeManagementService: TimeManagementService) {}
  
    @Post('shift-types')
    @HttpCode(HttpStatus.CREATED)
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
    @ApiOperation({ summary: 'Create a new shift type' })
    @ApiBody({ type: CreateShiftTypeDto })
    @ApiResponse({ status: 201, description: 'Shift type created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async createShiftType(@Body() createDto: CreateShiftTypeDto) {
      return this.timeManagementService.createShiftType(createDto);
    }
  
    @Get('shift-types')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_HEAD)
    @ApiOperation({ summary: 'Get all shift types' })
    @ApiQuery({ name: 'activeOnly', required: false, type: String, description: 'Filter by active status' })
    @ApiResponse({ status: 200, description: 'List of shift types' })
    async findAllShiftTypes(@Query('activeOnly') activeOnly?: string) {
      return this.timeManagementService.findAllShiftTypes(activeOnly === 'true');
    }
  
    @Get('shift-types/:id')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_HEAD)
    @ApiOperation({ summary: 'Get shift type by ID' })
    @ApiParam({ name: 'id', description: 'Shift type ID' })
    @ApiResponse({ status: 200, description: 'Shift type found' })
    @ApiResponse({ status: 404, description: 'Shift type not found' })
    async findShiftTypeById(@Param('id') id: string) {
      return this.timeManagementService.findShiftTypeById(id);
    }
  
    @Put('shift-types/:id')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
    @ApiOperation({ summary: 'Update shift type' })
    @ApiParam({ name: 'id', description: 'Shift type ID' })
    @ApiBody({ type: UpdateShiftTypeDto })
    @ApiResponse({ status: 200, description: 'Shift type updated successfully' })
    @ApiResponse({ status: 404, description: 'Shift type not found' })
    async updateShiftType(@Param('id') id: string, @Body() updateDto: UpdateShiftTypeDto) {
      return this.timeManagementService.updateShiftType(id, updateDto);
    }
  
    @Delete('shift-types/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
    @ApiOperation({ summary: 'Delete shift type' })
    @ApiParam({ name: 'id', description: 'Shift type ID' })
    @ApiResponse({ status: 204, description: 'Shift type deleted successfully' })
    @ApiResponse({ status: 404, description: 'Shift type not found' })
    async deleteShiftType(@Param('id') id: string) {
      return this.timeManagementService.deleteShiftType(id);
    }
  
    @Post('shifts')
    @HttpCode(HttpStatus.CREATED)
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
    @ApiOperation({ summary: 'Create a new shift' })
    @ApiBody({ type: CreateShiftDto })
    @ApiResponse({ status: 201, description: 'Shift created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async createShift(@Body() createDto: CreateShiftDto) {
      return this.timeManagementService.createShift(createDto);
    }
  
    @Get('shifts')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.DEPARTMENT_EMPLOYEE)
    @ApiOperation({ summary: 'Get all shifts' })
    @ApiQuery({ name: 'activeOnly', required: false, type: String, description: 'Filter by active status' })
    @ApiResponse({ status: 200, description: 'List of shifts' })
    async findAllShifts(@Query('activeOnly') activeOnly?: string) {
      return this.timeManagementService.findAllShifts(activeOnly === 'true');
    }
  
    @Get('shifts/:id')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.DEPARTMENT_EMPLOYEE)
    @ApiOperation({ summary: 'Get shift by ID' })
    @ApiParam({ name: 'id', description: 'Shift ID' })
    @ApiResponse({ status: 200, description: 'Shift found' })
    @ApiResponse({ status: 404, description: 'Shift not found' })
    async findShiftById(@Param('id') id: string) {
      return this.timeManagementService.findShiftById(id);
    }
  
    @Put('shifts/:id')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
    @ApiOperation({ summary: 'Update shift' })
    @ApiParam({ name: 'id', description: 'Shift ID' })
    @ApiBody({ type: UpdateShiftDto })
    @ApiResponse({ status: 200, description: 'Shift updated successfully' })
    @ApiResponse({ status: 404, description: 'Shift not found' })
    async updateShift(@Param('id') id: string, @Body() updateDto: UpdateShiftDto) {
      return this.timeManagementService.updateShift(id, updateDto);
    }
  
    @Delete('shifts/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
    @ApiOperation({ summary: 'Delete shift' })
    @ApiParam({ name: 'id', description: 'Shift ID' })
    @ApiResponse({ status: 204, description: 'Shift deleted successfully' })
    @ApiResponse({ status: 404, description: 'Shift not found' })
    async deleteShift(@Param('id') id: string) {
      return this.timeManagementService.deleteShift(id);
    }
  
    @Post('schedule-rules')
    @HttpCode(HttpStatus.CREATED)
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
    @ApiOperation({ summary: 'Create a new schedule rule' })
    @ApiBody({ type: CreateScheduleRuleDto })
    @ApiResponse({ status: 201, description: 'Schedule rule created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async createScheduleRule(@Body() createDto: CreateScheduleRuleDto) {
      return this.timeManagementService.createScheduleRule(createDto);
    }
  
    @Get('schedule-rules')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_HEAD)
    @ApiOperation({ summary: 'Get all schedule rules' })
    @ApiQuery({ name: 'activeOnly', required: false, type: String, description: 'Filter by active status' })
    @ApiResponse({ status: 200, description: 'List of schedule rules' })
    async findAllScheduleRules(@Query('activeOnly') activeOnly?: string) {
      return this.timeManagementService.findAllScheduleRules(activeOnly === 'true');
    }
  
    @Get('schedule-rules/:id')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_HEAD)
    @ApiOperation({ summary: 'Get schedule rule by ID' })
    @ApiParam({ name: 'id', description: 'Schedule rule ID' })
    @ApiResponse({ status: 200, description: 'Schedule rule found' })
    @ApiResponse({ status: 404, description: 'Schedule rule not found' })
    async findScheduleRuleById(@Param('id') id: string) {
      return this.timeManagementService.findScheduleRuleById(id);
    }
  
    @Put('schedule-rules/:id')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
    @ApiOperation({ summary: 'Update schedule rule' })
    @ApiParam({ name: 'id', description: 'Schedule rule ID' })
    @ApiBody({ type: UpdateScheduleRuleDto })
    @ApiResponse({ status: 200, description: 'Schedule rule updated successfully' })
    @ApiResponse({ status: 404, description: 'Schedule rule not found' })
    async updateScheduleRule(@Param('id') id: string, @Body() updateDto: UpdateScheduleRuleDto) {
      return this.timeManagementService.updateScheduleRule(id, updateDto);
    }
  
    @Delete('schedule-rules/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
    @ApiOperation({ summary: 'Delete schedule rule' })
    @ApiParam({ name: 'id', description: 'Schedule rule ID' })
    @ApiResponse({ status: 204, description: 'Schedule rule deleted successfully' })
    @ApiResponse({ status: 404, description: 'Schedule rule not found' })
    async deleteScheduleRule(@Param('id') id: string) {
      return this.timeManagementService.deleteScheduleRule(id);
    }
  
    @Post('shift-assignments')
    @HttpCode(HttpStatus.CREATED)
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Create a new shift assignment' })
    @ApiBody({ type: CreateShiftAssignmentDto })
    @ApiResponse({ status: 201, description: 'Shift assignment created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async createShiftAssignment(@Body() createDto: CreateShiftAssignmentDto) {
      return this.timeManagementService.createShiftAssignment(createDto);
    }
  
    @Post('shift-assignments/bulk')
    @HttpCode(HttpStatus.CREATED)
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Create multiple shift assignments in bulk' })
    @ApiBody({ type: BulkShiftAssignmentDto })
    @ApiResponse({ status: 201, description: 'Shift assignments created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async createBulkShiftAssignment(@Body() bulkDto: BulkShiftAssignmentDto) {
      return this.timeManagementService.createBulkShiftAssignment(bulkDto);
    }
  
    @Get('shift-assignments')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.DEPARTMENT_EMPLOYEE)
    @ApiOperation({ summary: 'Get all shift assignments' })
    @ApiQuery({ name: 'employeeId', required: false, type: String, description: 'Filter by employee ID' })
    @ApiQuery({ name: 'departmentId', required: false, type: String, description: 'Filter by department ID' })
    @ApiQuery({ name: 'positionId', required: false, type: String, description: 'Filter by position ID' })
    @ApiQuery({ name: 'status', required: false, enum: ShiftAssignmentStatus, description: 'Filter by status' })
    @ApiResponse({ status: 200, description: 'List of shift assignments' })
    @ApiResponse({ status: 403, description: 'Forbidden - Department Employees can only view their own shift assignments' })
    async findAllShiftAssignments(
      @Query('employeeId') employeeId?: string,
      @Query('departmentId') departmentId?: string,
      @Query('positionId') positionId?: string,
      @Query('status') status?: ShiftAssignmentStatus,
      @CurrentUser() user?: any,
    ) {
      const userRoles = user?.roles || [];
      const isDepartmentEmployee = userRoles.includes(SystemRole.DEPARTMENT_EMPLOYEE);
      const isHREmployee = userRoles.includes(SystemRole.HR_EMPLOYEE);
      
      console.log('findAllShiftAssignments - User:', {
        sub: user?.sub,
        roles: userRoles,
        isDepartmentEmployee,
        isHREmployee,
        queryEmployeeId: employeeId,
      });
      
      if (isDepartmentEmployee || isHREmployee) {
        // Department Employees and HR Employees can only see their own shift assignments
        employeeId = user.sub;
        console.log('findAllShiftAssignments - Department Employee or HR Employee, setting employeeId to:', employeeId);
      } else if (employeeId && (isDepartmentEmployee || isHREmployee)) {
        // If they try to query another employee's assignments, deny access
        if (employeeId !== user.sub) {
          throw new ForbiddenException('Department Employees and HR Employees can only view their own shift assignments');
        }
      }
      
      const filters = {
        employeeId,
        departmentId,
        positionId,
        status,
      };
      
      console.log('findAllShiftAssignments - Filters:', filters);
      
      const result = await this.timeManagementService.findAllShiftAssignments(filters);
      console.log('findAllShiftAssignments - Result count:', result.length);
      if (result.length > 0) {
        console.log('findAllShiftAssignments - First result employeeId:', result[0].employeeId);
      }
      
      return result;
    }
  
    @Get('shift-assignments/:id')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.DEPARTMENT_EMPLOYEE)
    @ApiOperation({ summary: 'Get shift assignment by ID' })
    @ApiParam({ name: 'id', description: 'Shift assignment ID' })
    @ApiResponse({ status: 200, description: 'Shift assignment found' })
    @ApiResponse({ status: 404, description: 'Shift assignment not found' })
    async findShiftAssignmentById(@Param('id') id: string) {
      return this.timeManagementService.findShiftAssignmentById(id);
    }
  
    @Put('shift-assignments/:id')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Update shift assignment' })
    @ApiParam({ name: 'id', description: 'Shift assignment ID' })
    @ApiBody({ type: UpdateShiftAssignmentDto })
    @ApiResponse({ status: 200, description: 'Shift assignment updated successfully' })
    @ApiResponse({ status: 404, description: 'Shift assignment not found' })
    async updateShiftAssignment(
      @Param('id') id: string,
      @Body() updateDto: UpdateShiftAssignmentDto,
    ) {
      return this.timeManagementService.updateShiftAssignment(id, updateDto);
    }
  
    @Delete('shift-assignments/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Delete shift assignment' })
    @ApiParam({ name: 'id', description: 'Shift assignment ID' })
    @ApiResponse({ status: 204, description: 'Shift assignment deleted successfully' })
    @ApiResponse({ status: 404, description: 'Shift assignment not found' })
    async deleteShiftAssignment(@Param('id') id: string) {
      return this.timeManagementService.deleteShiftAssignment(id);
    }
  
    @Get('shift-assignments/expiring/check')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN)
    @ApiOperation({ summary: 'Check for expiring shift assignments' })
    @ApiQuery({ name: 'daysBeforeExpiry', required: false, type: String, description: 'Number of days before expiry to check', example: '7' })
    @ApiResponse({ status: 200, description: 'List of expiring shift assignments' })
    async checkExpiringShiftAssignments(@Query('daysBeforeExpiry') daysBeforeExpiry?: string) {
      const days = daysBeforeExpiry ? parseInt(daysBeforeExpiry, 10) : 7;
      return this.timeManagementService.checkExpiringShiftAssignments(days);
    }
  
    @Post('attendance/clock')
    @HttpCode(HttpStatus.CREATED)
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE)
    @ApiOperation({ summary: 'Clock in or out' })
    @ApiBody({ type: ClockInOutDto })
    @ApiResponse({ status: 201, description: 'Punch recorded successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 403, description: 'Forbidden - Department Employees can only clock in/out for themselves' })
    async clockInOut(@Body() clockDto: ClockInOutDto, @CurrentUser() user: any) {
      // Department Employees can only clock in/out using their own ID
      const userRoles = user?.roles || [];
      const isDepartmentEmployee = userRoles.includes(SystemRole.DEPARTMENT_EMPLOYEE);
      
      if (isDepartmentEmployee) {
        // Override employeeId with the authenticated user's ID
        clockDto.employeeId = user.sub;
      }
      
      return this.timeManagementService.clockInOut(clockDto);
    }
  
    @Post('attendance/records')
    @HttpCode(HttpStatus.CREATED)
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE)
    @ApiOperation({ summary: 'Create a new attendance record' })
    @ApiBody({ type: CreateAttendanceRecordDto })
    @ApiResponse({ status: 201, description: 'Attendance record created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async createAttendanceRecord(@Body() createDto: CreateAttendanceRecordDto) {
      return this.timeManagementService.createAttendanceRecord(createDto);
    }
  
    @Get('attendance/records')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.PAYROLL_SPECIALIST, SystemRole.DEPARTMENT_EMPLOYEE)
    @ApiOperation({ summary: 'Get all attendance records' })
    @ApiQuery({ name: 'employeeId', required: false, type: String, description: 'Filter by employee ID' })
    @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Filter by start date' })
    @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Filter by end date' })
    @ApiResponse({ status: 200, description: 'List of attendance records' })
    @ApiResponse({ status: 403, description: 'Forbidden - Department Employees and HR Employees can only view their own records' })
    async findAllAttendanceRecords(
      @Query('employeeId') employeeId?: string,
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string,
      @CurrentUser() user?: any,
    ) {
      // Department Employees and HR Employees can only see their own attendance records
      const userRoles = user?.roles || [];
      const isDepartmentEmployee = userRoles.includes(SystemRole.DEPARTMENT_EMPLOYEE);
      const isHREmployee = userRoles.includes(SystemRole.HR_EMPLOYEE);
      
      if (isDepartmentEmployee || isHREmployee) {
        // Force filter to only their own records
        employeeId = user.sub;
      } else if (employeeId && (isDepartmentEmployee || isHREmployee)) {
        // If they try to query another employee's records, deny access
        if (employeeId !== user.sub) {
          throw new ForbiddenException('Department Employees and HR Employees can only view their own attendance records');
        }
      }
      
      return this.timeManagementService.findAllAttendanceRecords({
        employeeId,
        startDate,
        endDate,
      });
    }
  
    @Get('attendance/records/:id')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.PAYROLL_SPECIALIST, SystemRole.DEPARTMENT_EMPLOYEE)
    @ApiOperation({ summary: 'Get attendance record by ID' })
    @ApiParam({ name: 'id', description: 'Attendance record ID' })
    @ApiResponse({ status: 200, description: 'Attendance record found' })
    @ApiResponse({ status: 404, description: 'Attendance record not found' })
    @ApiResponse({ status: 403, description: 'Forbidden - Department Employees can only view their own records' })
    async findAttendanceRecordById(@Param('id') id: string, @CurrentUser() user?: any) {
      const userRoles = user?.roles || [];
      const isDepartmentEmployee = userRoles.includes(SystemRole.DEPARTMENT_EMPLOYEE);
      
      if (isDepartmentEmployee) {
        // Check if the record belongs to the employee
        const record = await this.timeManagementService.findAttendanceRecordById(id);
        const recordEmployeeId = this.getEntityId(record.employeeId);
        
        if (recordEmployeeId !== user.sub) {
          throw new ForbiddenException('Department Employees can only view their own attendance records');
        }
      }
      
      return this.timeManagementService.findAttendanceRecordById(id);
    }
  
    @Put('attendance/records/:id/correct')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.DEPARTMENT_HEAD, SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Manually correct attendance record' })
    @ApiParam({ name: 'id', description: 'Attendance record ID' })
    @ApiBody({ type: ManualAttendanceCorrectionDto })
    @ApiResponse({ status: 200, description: 'Attendance record corrected successfully' })
    @ApiResponse({ status: 404, description: 'Attendance record not found' })
    async manualAttendanceCorrection(
      @Param('id') id: string,
      @Body() correctionDto: ManualAttendanceCorrectionDto,
    ) {
      return this.timeManagementService.manualAttendanceCorrection(id, correctionDto);
    }
  
    @Post('attendance/missed-punches/check')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.DEPARTMENT_HEAD, SystemRole.PAYROLL_SPECIALIST, SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.HR_EMPLOYEE)
    @ApiOperation({ summary: 'Check for missed punches and send notifications' })
    @ApiResponse({ status: 200, description: 'Missed punches checked and notifications sent' })
    @ApiResponse({ status: 403, description: 'Forbidden - Department Employees and HR Employees can only check their own missed punches' })
    async checkMissedPunchesAndNotify(@CurrentUser() user?: any) {
      const userRoles = user?.roles || [];
      const isDepartmentEmployee = userRoles.includes(SystemRole.DEPARTMENT_EMPLOYEE);
      const isHREmployee = userRoles.includes(SystemRole.HR_EMPLOYEE);
      
      // Department Employees and HR Employees can only check their own missed punches
      // Other roles (admins, managers) can check all missed punches
      const employeeId = (isDepartmentEmployee || isHREmployee) ? user.sub : undefined;
      
      return this.timeManagementService.checkMissedPunchesAndNotify(employeeId);
    }
  
    @Post('attendance/correction-requests')
    @HttpCode(HttpStatus.CREATED)
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE)
    @ApiOperation({ summary: 'Create a new attendance correction request' })
    @ApiBody({ type: CreateAttendanceCorrectionRequestDto })
    @ApiResponse({ status: 201, description: 'Correction request created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 403, description: 'Forbidden - Department Employees can only create requests for themselves' })
    async createCorrectionRequest(@Body() createDto: CreateAttendanceCorrectionRequestDto, @CurrentUser() user: any) {
      const userRoles = user?.roles || [];
      const isDepartmentEmployee = userRoles.includes(SystemRole.DEPARTMENT_EMPLOYEE);
      
      if (isDepartmentEmployee) {
        // Department Employees can only create correction requests for themselves
        if (createDto.employeeId !== user.sub) {
          throw new ForbiddenException('Department Employees can only create correction requests for themselves');
        }
        // Also verify the attendance record belongs to them
        const record = await this.timeManagementService.findAttendanceRecordById(createDto.attendanceRecord);
        const recordEmployeeId = this.getEntityId(record.employeeId);
        
        if (recordEmployeeId !== user.sub) {
          throw new ForbiddenException('Department Employees can only create correction requests for their own attendance records');
        }
      }
      
      return this.timeManagementService.createCorrectionRequest(createDto);
    }
  
    @Get('attendance/correction-requests')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.PAYROLL_SPECIALIST, SystemRole.DEPARTMENT_EMPLOYEE)
    @ApiOperation({ summary: 'Get all attendance correction requests' })
    @ApiQuery({ name: 'employeeId', required: false, type: String, description: 'Filter by employee ID' })
    @ApiQuery({ name: 'status', required: false, enum: CorrectionRequestStatus, description: 'Filter by status' })
    @ApiResponse({ status: 200, description: 'List of correction requests' })
    @ApiResponse({ status: 403, description: 'Forbidden - Department Employees and HR Employees can only view their own requests' })
    async findAllCorrectionRequests(
      @Query('employeeId') employeeId?: string,
      @Query('status') status?: CorrectionRequestStatus,
      @CurrentUser() user?: any,
    ) {
      const userRoles = user?.roles || [];
      const isDepartmentEmployee = userRoles.includes(SystemRole.DEPARTMENT_EMPLOYEE);
      const isHREmployee = userRoles.includes(SystemRole.HR_EMPLOYEE);
      
      if (isDepartmentEmployee || isHREmployee) {
        // Department Employees and HR Employees can only see their own correction requests
        employeeId = user.sub;
      } else if (employeeId && (isDepartmentEmployee || isHREmployee)) {
        // If they try to query another employee's requests, deny access
        if (employeeId !== user.sub) {
          throw new ForbiddenException('Department Employees and HR Employees can only view their own correction requests');
        }
      }
      
      return this.timeManagementService.findAllCorrectionRequests({
        employeeId,
        status,
      });
    }
  
    @Get('attendance/correction-requests/:id')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.PAYROLL_SPECIALIST, SystemRole.DEPARTMENT_EMPLOYEE)
    @ApiOperation({ summary: 'Get correction request by ID' })
    @ApiParam({ name: 'id', description: 'Correction request ID' })
    @ApiResponse({ status: 200, description: 'Correction request found' })
    @ApiResponse({ status: 404, description: 'Correction request not found' })
    @ApiResponse({ status: 403, description: 'Forbidden - Department Employees and HR Employees can only view their own requests' })
    async findCorrectionRequestById(@Param('id') id: string, @CurrentUser() user?: any) {
      const userRoles = user?.roles || [];
      const isDepartmentEmployee = userRoles.includes(SystemRole.DEPARTMENT_EMPLOYEE);
      const isHREmployee = userRoles.includes(SystemRole.HR_EMPLOYEE);
      
      if (isDepartmentEmployee || isHREmployee) {
        // Check if the request belongs to the employee
        const request = await this.timeManagementService.findCorrectionRequestById(id);
        const requestEmployeeId = this.getEntityId(request.employeeId);
        
        if (requestEmployeeId !== user.sub) {
          throw new ForbiddenException('Department Employees and HR Employees can only view their own correction requests');
        }
      }
      
      return this.timeManagementService.findCorrectionRequestById(id);
    }
  
    @Put('attendance/correction-requests/:id')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.DEPARTMENT_HEAD, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Update correction request' })
    @ApiParam({ name: 'id', description: 'Correction request ID' })
    @ApiBody({ type: UpdateAttendanceCorrectionRequestDto })
    @ApiResponse({ status: 200, description: 'Correction request updated successfully' })
    @ApiResponse({ status: 404, description: 'Correction request not found' })
    async updateCorrectionRequest(
      @Param('id') id: string,
      @Body() updateDto: UpdateAttendanceCorrectionRequestDto,
    ) {
      return this.timeManagementService.updateCorrectionRequest(id, updateDto);
    }
  
    @Post('time-exceptions')
    @HttpCode(HttpStatus.CREATED)
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE)
    @ApiOperation({ summary: 'Create a new time exception' })
    @ApiBody({ type: CreateTimeExceptionDto })
    @ApiResponse({ status: 201, description: 'Time exception created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 403, description: 'Forbidden - Department Employees can only create exceptions for themselves' })
    async createTimeException(@Body() createDto: CreateTimeExceptionDto, @CurrentUser() user: any) {
      const userRoles = user?.roles || [];
      const isDepartmentEmployee = userRoles.includes(SystemRole.DEPARTMENT_EMPLOYEE);
      
      if (isDepartmentEmployee) {
        // Department Employees can only create time exceptions for themselves
        if (createDto.employeeId !== user.sub) {
          throw new ForbiddenException('Department Employees can only create time exceptions for themselves');
        }
        // Also verify the attendance record belongs to them
        const record = await this.timeManagementService.findAttendanceRecordById(createDto.attendanceRecordId);
        const recordEmployeeId = this.getEntityId(record.employeeId);
        
        if (recordEmployeeId !== user.sub) {
          throw new ForbiddenException('Department Employees can only create time exceptions for their own attendance records');
        }
      }
      
      return this.timeManagementService.createTimeException(createDto);
    }
  
    @Get('time-exceptions')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.PAYROLL_SPECIALIST, SystemRole.DEPARTMENT_EMPLOYEE)
    @ApiOperation({ summary: 'Get all time exceptions' })
    @ApiQuery({ name: 'employeeId', required: false, type: String, description: 'Filter by employee ID' })
    @ApiQuery({ name: 'type', required: false, type: String, description: 'Filter by exception type' })
    @ApiQuery({ name: 'status', required: false, enum: TimeExceptionStatus, description: 'Filter by status' })
    @ApiQuery({ name: 'assignedTo', required: false, type: String, description: 'Filter by assigned manager ID' })
    @ApiResponse({ status: 200, description: 'List of time exceptions' })
    @ApiResponse({ status: 403, description: 'Forbidden - Department Employees and HR Employees can only view their own time exceptions' })
    async findAllTimeExceptions(
      @Query('employeeId') employeeId?: string,
      @Query('type') type?: string,
      @Query('status') status?: TimeExceptionStatus,
      @Query('assignedTo') assignedTo?: string,
      @CurrentUser() user?: any,
    ) {
      const userRoles = user?.roles || [];
      const isDepartmentEmployee = userRoles.includes(SystemRole.DEPARTMENT_EMPLOYEE);
      const isHREmployee = userRoles.includes(SystemRole.HR_EMPLOYEE);
      
      if (isDepartmentEmployee || isHREmployee) {
        // Department Employees and HR Employees can only see their own time exceptions
        employeeId = user.sub;
      } else if (employeeId && (isDepartmentEmployee || isHREmployee)) {
        // If they try to query another employee's exceptions, deny access
        if (employeeId !== user.sub) {
          throw new ForbiddenException('Department Employees and HR Employees can only view their own time exceptions');
        }
      }
      
      return this.timeManagementService.findAllTimeExceptions({
        employeeId,
        type: type as any,
        status,
        assignedTo,
      });
    }
  
    @Get('time-exceptions/:id')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.PAYROLL_SPECIALIST, SystemRole.DEPARTMENT_EMPLOYEE)
    @ApiOperation({ summary: 'Get time exception by ID' })
    @ApiParam({ name: 'id', description: 'Time exception ID' })
    @ApiResponse({ status: 200, description: 'Time exception found' })
    @ApiResponse({ status: 404, description: 'Time exception not found' })
    async findTimeExceptionById(@Param('id') id: string) {
      return this.timeManagementService.findTimeExceptionById(id);
    }
  
    @Put('time-exceptions/:id')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.DEPARTMENT_HEAD, SystemRole.HR_ADMIN, SystemRole.SYSTEM_ADMIN, SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Update time exception' })
    @ApiParam({ name: 'id', description: 'Time exception ID' })
    @ApiBody({ type: UpdateTimeExceptionDto })
    @ApiResponse({ status: 200, description: 'Time exception updated successfully' })
    @ApiResponse({ status: 404, description: 'Time exception not found' })
    async updateTimeException(
      @Param('id') id: string,
      @Body() updateDto: UpdateTimeExceptionDto,
    ) {
      return this.timeManagementService.updateTimeException(id, updateDto);
    }
  
    @Post('time-exceptions/escalate/check')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN)
    @ApiOperation({ summary: 'Check and escalate overdue time exceptions' })
    @ApiQuery({ name: 'deadlineHours', required: false, type: String, description: 'Hours before deadline to escalate', example: '48' })
    @ApiResponse({ status: 200, description: 'Exceptions checked and escalated if needed' })
    async checkAndEscalateExceptions(@Query('deadlineHours') deadlineHours?: string) {
      const hours = deadlineHours ? parseInt(deadlineHours, 10) : 48;
      return this.timeManagementService.checkAndEscalateExceptions(hours);
    }
  
    @Post('overtime-rules')
    @HttpCode(HttpStatus.CREATED)
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
    @ApiOperation({ summary: 'Create a new overtime rule' })
    @ApiBody({ type: CreateOvertimeRuleDto })
    @ApiResponse({ status: 201, description: 'Overtime rule created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async createOvertimeRule(@Body() createDto: CreateOvertimeRuleDto) {
      return this.timeManagementService.createOvertimeRule(createDto);
    }
  
    @Get('overtime-rules')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.PAYROLL_SPECIALIST)
    @ApiOperation({ summary: 'Get all overtime rules' })
    @ApiQuery({ name: 'activeOnly', required: false, type: String, description: 'Filter by active status' })
    @ApiResponse({ status: 200, description: 'List of overtime rules' })
    async findAllOvertimeRules(@Query('activeOnly') activeOnly?: string) {
      return this.timeManagementService.findAllOvertimeRules(activeOnly === 'true');
    }
  
    @Get('overtime-rules/:id')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.PAYROLL_SPECIALIST)
    @ApiOperation({ summary: 'Get overtime rule by ID' })
    @ApiParam({ name: 'id', description: 'Overtime rule ID' })
    @ApiResponse({ status: 200, description: 'Overtime rule found' })
    @ApiResponse({ status: 404, description: 'Overtime rule not found' })
    async findOvertimeRuleById(@Param('id') id: string) {
      return this.timeManagementService.findOvertimeRuleById(id);
    }
  
    @Put('overtime-rules/:id')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
    @ApiOperation({ summary: 'Update overtime rule' })
    @ApiParam({ name: 'id', description: 'Overtime rule ID' })
    @ApiBody({ type: UpdateOvertimeRuleDto })
    @ApiResponse({ status: 200, description: 'Overtime rule updated successfully' })
    @ApiResponse({ status: 404, description: 'Overtime rule not found' })
    async updateOvertimeRule(@Param('id') id: string, @Body() updateDto: UpdateOvertimeRuleDto) {
      return this.timeManagementService.updateOvertimeRule(id, updateDto);
    }
  
    @Delete('overtime-rules/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
    @ApiOperation({ summary: 'Delete overtime rule' })
    @ApiParam({ name: 'id', description: 'Overtime rule ID' })
    @ApiResponse({ status: 204, description: 'Overtime rule deleted successfully' })
    @ApiResponse({ status: 404, description: 'Overtime rule not found' })
    async deleteOvertimeRule(@Param('id') id: string) {
      return this.timeManagementService.deleteOvertimeRule(id);
    }
  
    @Post('lateness-rules')
    @HttpCode(HttpStatus.CREATED)
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
    @ApiOperation({ summary: 'Create a new lateness rule' })
    @ApiBody({ type: CreateLatenessRuleDto })
    @ApiResponse({ status: 201, description: 'Lateness rule created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async createLatenessRule(@Body() createDto: CreateLatenessRuleDto) {
      return this.timeManagementService.createLatenessRule(createDto);
    }
  
    @Get('lateness-rules')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.PAYROLL_SPECIALIST)
    @ApiOperation({ summary: 'Get all lateness rules' })
    @ApiQuery({ name: 'activeOnly', required: false, type: String, description: 'Filter by active status' })
    @ApiResponse({ status: 200, description: 'List of lateness rules' })
    async findAllLatenessRules(@Query('activeOnly') activeOnly?: string) {
      return this.timeManagementService.findAllLatenessRules(activeOnly === 'true');
    }
  
    @Get('lateness-rules/:id')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.PAYROLL_SPECIALIST)
    @ApiOperation({ summary: 'Get lateness rule by ID' })
    @ApiParam({ name: 'id', description: 'Lateness rule ID' })
    @ApiResponse({ status: 200, description: 'Lateness rule found' })
    @ApiResponse({ status: 404, description: 'Lateness rule not found' })
    async findLatenessRuleById(@Param('id') id: string) {
      return this.timeManagementService.findLatenessRuleById(id);
    }
  
    @Put('lateness-rules/:id')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
    @ApiOperation({ summary: 'Update lateness rule' })
    @ApiParam({ name: 'id', description: 'Lateness rule ID' })
    @ApiBody({ type: UpdateLatenessRuleDto })
    @ApiResponse({ status: 200, description: 'Lateness rule updated successfully' })
    @ApiResponse({ status: 404, description: 'Lateness rule not found' })
    async updateLatenessRule(@Param('id') id: string, @Body() updateDto: UpdateLatenessRuleDto) {
      return this.timeManagementService.updateLatenessRule(id, updateDto);
    }
  
    @Delete('lateness-rules/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.SYSTEM_ADMIN)
    @ApiOperation({ summary: 'Delete lateness rule' })
    @ApiParam({ name: 'id', description: 'Lateness rule ID' })
    @ApiResponse({ status: 204, description: 'Lateness rule deleted successfully' })
    @ApiResponse({ status: 404, description: 'Lateness rule not found' })
    async deleteLatenessRule(@Param('id') id: string) {
      return this.timeManagementService.deleteLatenessRule(id);
    }
  
    @Post('holidays')
    @HttpCode(HttpStatus.CREATED)
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Create a new holiday' })
    @ApiBody({ type: CreateHolidayDto })
    @ApiResponse({ status: 201, description: 'Holiday created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async createHoliday(@Body() createDto: CreateHolidayDto) {
      return this.timeManagementService.createHoliday(createDto);
    }
  
    @Get('holidays')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.PAYROLL_SPECIALIST)
    @ApiOperation({ summary: 'Get all holidays' })
    @ApiQuery({ name: 'type', required: false, type: String, description: 'Filter by holiday type' })
    @ApiQuery({ name: 'activeOnly', required: false, type: String, description: 'Filter by active status' })
    @ApiQuery({ name: 'year', required: false, type: String, description: 'Filter by year', example: '2025' })
    @ApiResponse({ status: 200, description: 'List of holidays' })
    async findAllHolidays(
      @Query('type') type?: string,
      @Query('activeOnly') activeOnly?: string,
      @Query('year') year?: string,
    ) {
      return this.timeManagementService.findAllHolidays({
        type: type as any,
        activeOnly: activeOnly === 'true',
        year: year ? parseInt(year, 10) : undefined,
      });
    }
  
    @Get('holidays/:id')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER, SystemRole.HR_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.PAYROLL_SPECIALIST)
    @ApiOperation({ summary: 'Get holiday by ID' })
    @ApiParam({ name: 'id', description: 'Holiday ID' })
    @ApiResponse({ status: 200, description: 'Holiday found' })
    @ApiResponse({ status: 404, description: 'Holiday not found' })
    async findHolidayById(@Param('id') id: string) {
      return this.timeManagementService.findHolidayById(id);
    }
  
    @Put('holidays/:id')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Update holiday' })
    @ApiParam({ name: 'id', description: 'Holiday ID' })
    @ApiBody({ type: UpdateHolidayDto })
    @ApiResponse({ status: 200, description: 'Holiday updated successfully' })
    @ApiResponse({ status: 404, description: 'Holiday not found' })
    async updateHoliday(@Param('id') id: string, @Body() updateDto: UpdateHolidayDto) {
      return this.timeManagementService.updateHoliday(id, updateDto);
    }
  
    @Delete('holidays/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_MANAGER)
    @ApiOperation({ summary: 'Delete holiday' })
    @ApiParam({ name: 'id', description: 'Holiday ID' })
    @ApiResponse({ status: 204, description: 'Holiday deleted successfully' })
    @ApiResponse({ status: 404, description: 'Holiday not found' })
    async deleteHoliday(@Param('id') id: string) {
      return this.timeManagementService.deleteHoliday(id);
    }
  
    @Get('reports/attendance')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE, SystemRole.PAYROLL_SPECIALIST, SystemRole.DEPARTMENT_HEAD, SystemRole.SYSTEM_ADMIN)
    @ApiOperation({ summary: 'Generate attendance report' })
    @ApiResponse({ status: 200, description: 'Attendance report generated successfully' })
    async generateAttendanceReport(@Query() reportDto: AttendanceReportDto) {
      return this.timeManagementService.generateAttendanceReport(reportDto);
    }
  
    @Get('reports/overtime')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE, SystemRole.PAYROLL_SPECIALIST, SystemRole.DEPARTMENT_HEAD, SystemRole.SYSTEM_ADMIN)
    @ApiOperation({ summary: 'Generate overtime report' })
    @ApiResponse({ status: 200, description: 'Overtime report generated successfully' })
    async generateOvertimeReport(@Query() reportDto: OvertimeReportDto) {
      return this.timeManagementService.generateOvertimeReport(reportDto);
    }
  
    @Get('reports/exceptions')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.HR_MANAGER, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE, SystemRole.PAYROLL_SPECIALIST, SystemRole.DEPARTMENT_HEAD, SystemRole.SYSTEM_ADMIN)
    @ApiOperation({ summary: 'Generate exception report' })
    @ApiResponse({ status: 200, description: 'Exception report generated successfully' })
    async generateExceptionReport(@Query() reportDto: ExceptionReportDto) {
      return this.timeManagementService.generateExceptionReport(reportDto);
    }
  
    @Get('notifications/employee/:employeeId')
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.DEPARTMENT_EMPLOYEE, SystemRole.DEPARTMENT_HEAD, SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN, SystemRole.HR_EMPLOYEE, SystemRole.PAYROLL_SPECIALIST)
    @ApiOperation({ summary: 'Get notifications for an employee' })
    @ApiParam({ name: 'employeeId', description: 'Employee ID' })
    @ApiResponse({ status: 200, description: 'List of notifications' })
    @ApiResponse({ status: 404, description: 'Employee not found' })
    @ApiResponse({ status: 403, description: 'Forbidden - Department Employees can only view their own notifications' })
    async findNotificationsByEmployee(@Param('employeeId') employeeId: string, @CurrentUser() user?: any) {
      const userRoles = user?.roles || [];
      const isDepartmentEmployee = userRoles.includes(SystemRole.DEPARTMENT_EMPLOYEE);
      
      if (isDepartmentEmployee) {
        // Department Employees can only see their own notifications
        if (employeeId !== user.sub) {
          throw new ForbiddenException('Department Employees can only view their own notifications');
        }
      }
      
      return this.timeManagementService.findNotificationsByEmployee(employeeId);
    }
  
    @Post('escalate/payroll-cutoff')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('JWT-auth')
    @Roles(SystemRole.SYSTEM_ADMIN, SystemRole.HR_ADMIN)
    @ApiOperation({ summary: 'Escalate pending requests before payroll cutoff' })
    @ApiBody({ schema: { type: 'object', properties: { cutoffDate: { type: 'string', format: 'date-time', example: '2025-12-31T23:59:59Z' } } } })
    @ApiResponse({ status: 200, description: 'Pending requests escalated successfully' })
    async escalatePendingRequestsBeforePayrollCutoff(@Body('cutoffDate') cutoffDate: string) {
      return this.timeManagementService.escalatePendingRequestsBeforePayrollCutoff(new Date(cutoffDate));
    }

  // Utility to safely extract an ID string from populated or raw references
  private getEntityId(entity: any): string | undefined {
    if (!entity) return undefined;
    if (typeof entity === 'string') return entity;
    if (typeof entity === 'object') {
      if (entity._id && typeof entity._id.toString === 'function') {
        return entity._id.toString();
      }
      if (entity.id && typeof entity.id.toString === 'function') {
        return entity.id.toString();
      }
      if (typeof entity.toString === 'function') {
        return entity.toString();
      }
    }
    try {
      return String(entity);
    } catch {
      return undefined;
    }
  }
}