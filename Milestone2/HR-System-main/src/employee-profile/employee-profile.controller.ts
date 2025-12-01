import {
  Body,
  Controller,
  Param,
  Query,
  Post,
  Put,
  Get,
  Patch,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { EmployeeProfileService } from './employee-profile.service';
import { CreateEmployeeProfileDto } from './dto/create-employee-profile.dto';
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto';
import { EmployeeProfileFilterDto } from './dto/employee-profile-filter.dto';
import { UpdateEmploymentStateDto } from './dto/update-employment-state.dto';
import { AssignSupervisorDto } from './dto/assign-supervisor.dto';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { UpdateCandidateStatusDto } from './dto/update-candidate-status.dto';
import { ConvertCandidateDto } from './dto/convert-candidate.dto';
import { CreateEmployeeQualificationDto } from './dto/create-employee-qualification.dto';
import { UpdateEmployeeQualificationDto } from './dto/update-employee-qualification.dto';
import { CreateEmployeeSystemRoleDto } from './dto/create-employee-system-role.dto';
import { UpdateEmployeeSystemRoleDto } from './dto/update-employee-system-role.dto';
import { CreateEmployeeProfileChangeRequestDto } from './dto/create-employee-profile-change-request.dto';
import { UpdateEmployeeProfileChangeRequestDto } from './dto/update-employee-profile-change-request.dto';

@ApiTags('employee-profile')
@Controller('employee-profile')
export class EmployeeProfileController {
  constructor(
    private readonly employeeProfileService: EmployeeProfileService,
  ) {}

  @Post()
  createProfile(@Body() createDto: CreateEmployeeProfileDto) {
    return this.employeeProfileService.createProfile(createDto);
  }

  @Get()
  listProfiles(@Query() filterDto: EmployeeProfileFilterDto) {
    return this.employeeProfileService.listProfiles(filterDto);
  }

  @Get('change-requests')
  getChangeRequests(
    @Query('status') status?: string,
    @Query('employeeProfileId') employeeProfileId?: string,
  ) {
    return this.employeeProfileService.getPendingChangeRequests({
      status,
      employeeProfileId,
    });
  }

  @Get(':profileId')
  getProfileById(
    @Param('profileId') profileId: string,
    @Query('populate') populate?: string,
  ) {
    const populateArray = populate
      ? populate.split(',').map((item) => item.trim())
      : undefined;
    return this.employeeProfileService.getProfileById(profileId, {
      populate: populateArray,
    });
  }

  @Put(':profileId')
  updateProfile(
    @Param('profileId') profileId: string,
    @Body() updateDto: UpdateEmployeeProfileDto,
  ) {
    return this.employeeProfileService.updateProfile(profileId, updateDto);
  }

  @Patch(':profileId/employment-state')
  updateEmploymentState(
    @Param('profileId') profileId: string,
    @Body() employmentDto: UpdateEmploymentStateDto,
  ) {
    return this.employeeProfileService.updateEmploymentState(
      profileId,
      employmentDto,
    );
  }

  @Patch(':profileId/supervisor')
  assignSupervisor(
    @Param('profileId') profileId: string,
    @Body() assignDto: AssignSupervisorDto,
  ) {
    return this.employeeProfileService.assignSupervisor({
      ...assignDto,
      employeeProfileId: profileId,
    });
  }

  @Post('candidates')
  createCandidate(@Body() createDto: CreateCandidateDto) {
    return this.employeeProfileService.createCandidate(createDto);
  }

  @Put('candidates/:candidateId')
  updateCandidate(
    @Param('candidateId') candidateId: string,
    @Body() updateDto: UpdateCandidateDto,
  ) {
    return this.employeeProfileService.updateCandidate(candidateId, updateDto);
  }

  @Patch('candidates/:candidateId/status')
  updateCandidateStatus(
    @Param('candidateId') candidateId: string,
    @Body() statusDto: Omit<UpdateCandidateStatusDto, 'candidateId'>,
  ) {
    return this.employeeProfileService.updateCandidateStatus({
      ...statusDto,
      candidateId,
    });
  }

  @Post('candidates/:candidateId/convert')
  @ApiOperation({ summary: 'Convert a candidate to an employee profile' })
  @ApiParam({ name: 'candidateId', description: 'The ID of the candidate to convert' })
  @ApiBody({ 
    type: ConvertCandidateDto,
    description: 'Employee number and date of hire are required. Position, department, and pay grade are optional.',
    examples: {
      example1: {
        summary: 'Convert candidate with all fields',
        value: {
          employeeNumber: 'EMP001',
          dateOfHire: '2024-01-15',
          positionId: '507f1f77bcf86cd799439011',
          departmentId: '507f1f77bcf86cd799439012',
          payGradeId: '507f1f77bcf86cd799439013',
        },
      },
      example2: {
        summary: 'Convert candidate with required fields only',
        value: {
          employeeNumber: 'EMP001',
          dateOfHire: '2024-01-15',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Candidate successfully converted to employee' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  @ApiResponse({ status: 409, description: 'Candidate already converted or employee number already exists' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async convertCandidate(
    @Param('candidateId') candidateId: string,
    @Body() convertDto: Omit<ConvertCandidateDto, 'candidateId'>,
  ) {
    try {
      return await this.employeeProfileService.convertCandidate({
        ...convertDto,
        candidateId,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error converting candidate:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || 'Internal server error',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':profileId/qualifications')
  @ApiOperation({ summary: 'Add a qualification to an employee profile' })
  @ApiParam({ name: 'profileId', description: 'The ID of the employee profile' })
  @ApiBody({ 
    type: CreateEmployeeQualificationDto,
    description: 'Establishment name and graduation type are required.',
    examples: {
      example1: {
        summary: 'Add a Bachelor degree qualification',
        value: {
          establishmentName: 'University of Technology',
          graduationType: 'BACHELOR',
        },
      },
      example2: {
        summary: 'Add a Master degree qualification',
        value: {
          establishmentName: 'State University',
          graduationType: 'MASTER',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Qualification successfully added' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Employee profile not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async addQualification(
    @Param('profileId') profileId: string,
    @Body() qualificationDto: Omit<CreateEmployeeQualificationDto, 'employeeProfileId'>,
  ) {
    try {
      return await this.employeeProfileService.addQualification({
        ...qualificationDto,
        employeeProfileId: profileId,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error adding qualification:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || 'Internal server error',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('qualifications/:qualificationId')
  updateQualification(
    @Param('qualificationId') qualificationId: string,
    @Body() updateDto: UpdateEmployeeQualificationDto,
  ) {
    return this.employeeProfileService.updateQualification(
      qualificationId,
      updateDto,
    );
  }

  @Get(':profileId/qualifications')
  listQualifications(@Param('profileId') profileId: string) {
    return this.employeeProfileService.listQualifications(profileId);
  }

  @Patch(':profileId/permissions')
  @ApiOperation({ summary: 'Update permissions for an employee profile' })
  @ApiParam({ name: 'profileId', description: 'The ID of the employee profile' })
  @ApiBody({ 
    description: 'Array of permission strings',
    schema: {
      type: 'object',
      properties: {
        permissions: {
          type: 'array',
          items: { type: 'string' },
          example: ['read:employees', 'write:employees', 'delete:employees'],
        },
      },
      required: ['permissions'],
    },
    examples: {
      example1: {
        summary: 'Update permissions with multiple values',
        value: {
          permissions: ['read:employees', 'write:employees', 'delete:employees'],
        },
      },
      example2: {
        summary: 'Clear all permissions',
        value: {
          permissions: [],
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Permissions successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Employee profile not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updatePermissions(
    @Param('profileId') profileId: string,
    @Body('permissions') permissions: string[],
  ) {
    try {
      return await this.employeeProfileService.updatePermissions(
        profileId,
        permissions,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error updating permissions:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || 'Internal server error',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Post(':profileId/system-roles')
  assignSystemRoles(
    @Param('profileId') profileId: string,
    @Body() assignDto: Omit<CreateEmployeeSystemRoleDto, 'employeeProfileId'>,
  ) {
    return this.employeeProfileService.assignSystemRoles({
      ...assignDto,
      employeeProfileId: profileId,
    });
  }

  @Patch(':profileId/system-roles')
  updateSystemRoles(
    @Param('profileId') profileId: string,
    @Body() updateDto: UpdateEmployeeSystemRoleDto,
  ) {
    return this.employeeProfileService.assignSystemRoles({
      ...updateDto,
      employeeProfileId: profileId,
    });
  }

  @Post(':profileId/change-requests')
  @ApiOperation({ summary: 'Create a change request for an employee profile' })
  @ApiParam({ name: 'profileId', description: 'The ID of the employee profile' })
  @ApiBody({ 
    type: CreateEmployeeProfileChangeRequestDto,
    description: 'Request ID and description are required. Other fields are optional.',
    examples: {
      example1: {
        summary: 'Create a change request with required fields',
        value: {
          requestId: 'CHG-2024-001',
          requestDescription: 'Request to update employee salary and position',
        },
      },
      example2: {
        summary: 'Create a change request with all fields',
        value: {
          requestId: 'CHG-2024-002',
          requestDescription: 'Request to change department',
          reason: 'Organizational restructuring',
          status: 'PENDING',
          submittedAt: '2024-01-15T10:00:00Z',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Change request successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Employee profile not found' })
  @ApiResponse({ status: 409, description: 'Change request ID already exists' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createChangeRequest(
    @Param('profileId') profileId: string,
    @Body()
    createDto: Omit<CreateEmployeeProfileChangeRequestDto, 'employeeProfileId'>,
  ) {
    try {
      return await this.employeeProfileService.createProfileChangeRequest({
        ...createDto,
        employeeProfileId: profileId,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error creating change request:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || 'Internal server error',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('change-requests/:requestId')
  processChangeRequest(
    @Param('requestId') requestId: string,
    @Body()
    updateDto: Omit<UpdateEmployeeProfileChangeRequestDto, 'requestId'>,
  ) {
    return this.employeeProfileService.processChangeRequest({
      ...updateDto,
      requestId,
    });
  }

  @Patch(':profileId/archive')
  archiveProfile(
    @Param('profileId') profileId: string,
    @Body('reason') reason?: string,
  ) {
    return this.employeeProfileService.archiveProfile(profileId, reason);
  }

  @Patch(':profileId/access/deactivate')
  @ApiOperation({ summary: 'Deactivate access for an employee profile' })
  @ApiParam({ name: 'profileId', description: 'The ID of the employee profile' })
  @ApiResponse({ status: 200, description: 'Access successfully deactivated' })
  @ApiResponse({ status: 404, description: 'Employee profile not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async deactivateAccess(@Param('profileId') profileId: string) {
    try {
      return await this.employeeProfileService.deactivateAccess(profileId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error deactivating access:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error?.message || 'Internal server error',
          error: 'Internal Server Error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
