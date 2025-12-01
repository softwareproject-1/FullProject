import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
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
import { OrganizationStructureService } from './organization-structure.service';

@ApiTags('organization-structure')
@Controller('organization-structure')
export class OrganizationStructureController {
  constructor(
    private readonly organizationStructureService: OrganizationStructureService,
  ) {}

  // Departments
  @Get('departments')
  @ApiOperation({ summary: 'Get all departments' })
  @ApiResponse({ status: 200, description: 'List of all departments' })
  getAllDepartments() {
    return this.organizationStructureService.getAllDepartments();
  }

  @Get('departments/by-name/:departmentName')
  @ApiOperation({ 
    summary: 'Get a department by name',
    description: 'Retrieve a single department by its name. The search is case-insensitive and matches the exact name.'
  })
  @ApiParam({ 
    name: 'departmentName', 
    description: 'Name of the department to retrieve', 
    example: 'Engineering',
    type: String
  })
  @ApiResponse({ status: 200, description: 'Department found successfully' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  @ApiResponse({ status: 400, description: 'Bad request - department name is required or database connection error' })
  getDepartmentByName(@Param('departmentName') departmentName: string) {
    return this.organizationStructureService.getDepartmentByName(departmentName);
  }

  @Post('departments')
  @ApiOperation({ summary: 'Create a new department' })
  @ApiBody({ type: CreateDepartmentDto })
  @ApiResponse({ status: 201, description: 'Department created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or duplicate code' })
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.organizationStructureService.createDepartment(dto);
  }

  @Patch('departments/:departmentId')
  @ApiOperation({ summary: 'Update a department' })
  @ApiParam({ name: 'departmentId', description: 'MongoDB ObjectId of the department', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: UpdateDepartmentDto })
  @ApiResponse({ status: 200, description: 'Department updated successfully' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid ID format' })
  updateDepartment(
    @Param('departmentId') departmentId: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.organizationStructureService.updateDepartment(
      departmentId,
      dto,
    );
  }

  @Patch('departments/:departmentId/deactivate')
  @ApiOperation({ summary: 'Deactivate a department' })
  @ApiParam({ name: 'departmentId', description: 'MongoDB ObjectId of the department', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ type: DeactivateEntityDto })
  @ApiResponse({ status: 200, description: 'Department deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  deactivateDepartment(
    @Param('departmentId') departmentId: string,
    @Body() dto: DeactivateEntityDto,
  ) {
    return this.organizationStructureService.deactivateDepartment(
      departmentId,
      dto,
    );
  }

  // Positions
  @Get('positions')
  @ApiOperation({ 
    summary: 'Get all positions',
    description: 'Retrieve all positions. Optionally filter by position title(s) using the names query parameter. You can provide a single name or multiple names separated by commas.'
  })
  @ApiQuery({ 
    name: 'names', 
    required: false, 
    description: 'Comma-separated list of position titles to filter by (case-insensitive)', 
    example: 'Manager,Engineer,Director',
    type: String
  })
  @ApiResponse({ status: 200, description: 'List of positions' })
  @ApiResponse({ status: 400, description: 'Bad request - database connection error' })
  getAllPositions(
    @Query('names') names?: string,
  ) {
    // Parse comma-separated names if provided
    const nameArray = names ? names.split(',').map(name => name.trim()).filter(name => name.length > 0) : undefined;
    return this.organizationStructureService.getAllPositions(nameArray);
  }

  @Get('positions/by-name/:positionName')
  @ApiOperation({ 
    summary: 'Get a position by name',
    description: 'Retrieve a single position by its title (name). The search is case-insensitive and matches the exact title.'
  })
  @ApiParam({ 
    name: 'positionName', 
    description: 'Title (name) of the position to retrieve', 
    example: 'Senior Software Engineer',
    type: String
  })
  @ApiResponse({ status: 200, description: 'Position found successfully' })
  @ApiResponse({ status: 404, description: 'Position not found' })
  @ApiResponse({ status: 400, description: 'Bad request - position name is required or database connection error' })
  getPositionByName(@Param('positionName') positionName: string) {
    return this.organizationStructureService.getPositionByName(positionName);
  }

  @Post('positions')
  @ApiOperation({ 
    summary: 'Create a new position',
    description: 'Create a position in a department. You can provide either departmentId or departmentName. If departmentName is provided, the system will look up the department by name and use its ID.'
  })
  @ApiBody({ type: CreatePositionDto })
  @ApiResponse({ status: 201, description: 'Position created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed, duplicate code, or department not found' })
  @ApiResponse({ status: 404, description: 'Department not found (when using departmentName)' })
  createPosition(@Body() dto: CreatePositionDto) {
    return this.organizationStructureService.createPosition(dto);
  }

  @Patch('positions/:positionId')
  @ApiOperation({ summary: 'Update a position' })
  @ApiParam({ name: 'positionId', description: 'MongoDB ObjectId of the position', example: '507f1f77bcf86cd799439012' })
  @ApiBody({ type: UpdatePositionDto })
  @ApiResponse({ status: 200, description: 'Position updated successfully' })
  @ApiResponse({ status: 404, description: 'Position not found' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid ID format' })
  updatePosition(
    @Param('positionId') positionId: string,
    @Body() dto: UpdatePositionDto,
  ) {
    return this.organizationStructureService.updatePosition(positionId, dto);
  }

  @Patch('positions/:positionId/deactivate')
  @ApiOperation({ summary: 'Deactivate a position' })
  @ApiParam({ name: 'positionId', description: 'MongoDB ObjectId of the position', example: '507f1f77bcf86cd799439012' })
  @ApiBody({ type: DeactivateEntityDto })
  @ApiResponse({ status: 200, description: 'Position deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Position not found' })
  deactivatePosition(
    @Param('positionId') positionId: string,
    @Body() dto: DeactivateEntityDto,
  ) {
    return this.organizationStructureService.deactivatePosition(
      positionId,
      dto,
    );
  }

  // Structure change requests
  @Post('change-requests')
  @ApiOperation({ summary: 'Create a new structure change request' })
  @ApiBody({ type: CreateStructureChangeRequestDto })
  @ApiResponse({ status: 201, description: 'Structure change request created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  createStructureChangeRequest(@Body() dto: CreateStructureChangeRequestDto) {
    return this.organizationStructureService.createStructureChangeRequest(dto);
  }

  @Post('change-requests/:requestId/submit')
  @ApiOperation({ summary: 'Submit a structure change request' })
  @ApiParam({ name: 'requestId', description: 'MongoDB ObjectId of the change request', example: '507f1f77bcf86cd799439015' })
  @ApiBody({ type: SubmitStructureChangeRequestDto })
  @ApiResponse({ status: 200, description: 'Request submitted successfully' })
  @ApiResponse({ status: 404, description: 'Change request not found' })
  @ApiResponse({ status: 400, description: 'Bad request - only drafts can be submitted' })
  submitStructureChangeRequest(
    @Param('requestId') requestId: string,
    @Body() dto: SubmitStructureChangeRequestDto,
  ) {
    return this.organizationStructureService.submitStructureChangeRequest(
      requestId,
      dto,
    );
  }

  @Patch('change-requests/:requestId/status')
  @ApiOperation({ summary: 'Update the status of a structure change request' })
  @ApiParam({ name: 'requestId', description: 'MongoDB ObjectId of the change request', example: '507f1f77bcf86cd799439015' })
  @ApiBody({ type: UpdateStructureRequestStatusDto })
  @ApiResponse({ status: 200, description: 'Request status updated successfully' })
  @ApiResponse({ status: 404, description: 'Change request not found' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid status transition' })
  updateStructureRequestStatus(
    @Param('requestId') requestId: string,
    @Body() dto: UpdateStructureRequestStatusDto,
  ) {
    return this.organizationStructureService.updateStructureRequestStatus(
      requestId,
      dto,
    );
  }

  @Post('change-requests/:requestId/approvals')
  @ApiOperation({ summary: 'Record an approval decision for a structure change request' })
  @ApiParam({ name: 'requestId', description: 'MongoDB ObjectId of the change request', example: '507f1f77bcf86cd799439015' })
  @ApiBody({ type: RecordApprovalDecisionDto })
  @ApiResponse({ status: 200, description: 'Approval decision recorded successfully' })
  @ApiResponse({ status: 404, description: 'Change request not found' })
  recordApprovalDecision(
    @Param('requestId') requestId: string,
    @Body() dto: RecordApprovalDecisionDto,
  ) {
    return this.organizationStructureService.recordApprovalDecision(
      requestId,
      dto,
    );
  }
}
