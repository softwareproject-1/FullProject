import {
  Body,
  Controller,
  Param,
  Query,
  Post,
  Put,
  Get,
  Patch,
} from '@nestjs/common';
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
  convertCandidate(
    @Param('candidateId') candidateId: string,
    @Body() convertDto: Omit<ConvertCandidateDto, 'candidateId'>,
  ) {
    return this.employeeProfileService.convertCandidate({
      ...convertDto,
      candidateId,
    });
  }

  @Post(':profileId/qualifications')
  addQualification(
    @Param('profileId') profileId: string,
    @Body() qualificationDto: Omit<CreateEmployeeQualificationDto, 'employeeProfileId'>,
  ) {
    return this.employeeProfileService.addQualification({
      ...qualificationDto,
      employeeProfileId: profileId,
    });
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
  updatePermissions(
    @Param('profileId') profileId: string,
    @Body('permissions') permissions: string[],
  ) {
    return this.employeeProfileService.updatePermissions(
      profileId,
      permissions,
    );
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
  createChangeRequest(
    @Param('profileId') profileId: string,
    @Body()
    createDto: Omit<CreateEmployeeProfileChangeRequestDto, 'employeeProfileId'>,
  ) {
    return this.employeeProfileService.createProfileChangeRequest({
      ...createDto,
      employeeProfileId: profileId,
    });
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
  deactivateAccess(@Param('profileId') profileId: string) {
    return this.employeeProfileService.deactivateAccess(profileId);
  }
}
