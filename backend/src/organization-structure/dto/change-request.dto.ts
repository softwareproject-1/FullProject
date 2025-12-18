import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ApprovalDecision,
  StructureRequestStatus,
  StructureRequestType,
} from '../enums/organization-structure.enums';

export class CreateStructureChangeRequestDto {
  @ApiProperty({
    description: 'Unique request number',
    example: 'REQ-2024-001',
  })
  @IsString()
  @IsNotEmpty()
  requestNumber: string;

  @ApiProperty({
    description: 'MongoDB ObjectId of the employee making the request',
    example: '507f1f77bcf86cd799439013',
  })
  @IsMongoId()
  @IsNotEmpty()
  requestedByEmployeeId: string;

  @ApiProperty({
    description: 'Type of structure change request',
    enum: StructureRequestType,
    example: StructureRequestType.NEW_DEPARTMENT,
  })
  @IsEnum(StructureRequestType)
  requestType: StructureRequestType;

  @ApiPropertyOptional({
    description: 'MongoDB ObjectId of the target department. Either targetDepartmentId or targetDepartmentName can be provided.',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  @IsOptional()
  targetDepartmentId?: string;

  @ApiPropertyOptional({
    description: 'Name of the target department. Either targetDepartmentId or targetDepartmentName can be provided.',
    example: 'Engineering',
  })
  @IsString()
  @IsOptional()
  targetDepartmentName?: string;

  @ApiPropertyOptional({
    description: 'MongoDB ObjectId of the target position',
    example: '507f1f77bcf86cd799439012',
  })
  @IsMongoId()
  @IsOptional()
  targetPositionId?: string;

  @ApiPropertyOptional({
    description: 'Additional details about the request',
    example: 'Request to create a new department for the marketing team',
  })
  @IsString()
  @IsOptional()
  details?: string;

  @ApiPropertyOptional({
    description: 'Reason for the request',
    example: 'Company expansion requires new department structure',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class SubmitStructureChangeRequestDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the employee submitting the request',
    example: '507f1f77bcf86cd799439013',
  })
  @IsMongoId()
  @IsNotEmpty()
  submittedByEmployeeId: string;

  @ApiPropertyOptional({
    description: 'Submission date in ISO 8601 format',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  submittedAt?: string;
}

export class UpdateStructureRequestStatusDto {
  @ApiProperty({
    description: 'New status for the structure change request',
    enum: StructureRequestStatus,
    example: StructureRequestStatus.APPROVED,
  })
  @IsEnum(StructureRequestStatus)
  status: StructureRequestStatus;

  @ApiPropertyOptional({
    description: 'MongoDB ObjectId of the employee performing this action',
    example: '507f1f77bcf86cd799439013',
  })
  @IsMongoId()
  @IsOptional()
  performedByEmployeeId?: string;

  @ApiPropertyOptional({
    description: 'Summary of the status change',
    example: 'Request approved by management',
  })
  @IsString()
  @IsOptional()
  summary?: string;
}

export class RecordApprovalDecisionDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the approver employee',
    example: '507f1f77bcf86cd799439014',
  })
  @IsMongoId()
  @IsNotEmpty()
  approverEmployeeId: string;

  @ApiProperty({
    description: 'Approval decision',
    enum: ApprovalDecision,
    example: ApprovalDecision.APPROVED,
  })
  @IsEnum(ApprovalDecision)
  decision: ApprovalDecision;

  @ApiPropertyOptional({
    description: 'Decision date in ISO 8601 format',
    example: '2024-01-20T14:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  decidedAt?: string;

  @ApiPropertyOptional({
    description: 'Comments from the approver',
    example: 'Approved with minor modifications',
  })
  @IsString()
  @IsOptional()
  comments?: string;
}

