import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
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

@Controller('organization-structure')
export class OrganizationStructureController {
  constructor(
    private readonly organizationStructureService: OrganizationStructureService,
  ) {}

  // Departments
  @Post('departments')
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.organizationStructureService.createDepartment(dto);
  }

  @Patch('departments/:departmentId')
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
  @Post('positions')
  createPosition(@Body() dto: CreatePositionDto) {
    return this.organizationStructureService.createPosition(dto);
  }

  @Patch('positions/:positionId')
  updatePosition(
    @Param('positionId') positionId: string,
    @Body() dto: UpdatePositionDto,
  ) {
    return this.organizationStructureService.updatePosition(positionId, dto);
  }

  @Patch('positions/:positionId/deactivate')
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
  createStructureChangeRequest(@Body() dto: CreateStructureChangeRequestDto) {
    return this.organizationStructureService.createStructureChangeRequest(dto);
  }

  @Post('change-requests/:requestId/submit')
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
