import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  ApprovalDecision,
  StructureRequestStatus,
  StructureRequestType,
} from '../enums/organization-structure.enums';

export class CreateStructureChangeRequestDto {
  @IsString()
  @IsNotEmpty()
  requestNumber: string;

  @IsMongoId()
  @IsNotEmpty()
  requestedByEmployeeId: string;

  @IsEnum(StructureRequestType)
  requestType: StructureRequestType;

  @IsMongoId()
  @IsOptional()
  targetDepartmentId?: string;

  @IsMongoId()
  @IsOptional()
  targetPositionId?: string;

  @IsString()
  @IsOptional()
  details?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class SubmitStructureChangeRequestDto {
  @IsMongoId()
  @IsNotEmpty()
  submittedByEmployeeId: string;

  @IsDateString()
  @IsOptional()
  submittedAt?: string;
}

export class UpdateStructureRequestStatusDto {
  @IsEnum(StructureRequestStatus)
  status: StructureRequestStatus;

  @IsMongoId()
  @IsOptional()
  performedByEmployeeId?: string;

  @IsString()
  @IsOptional()
  summary?: string;
}

export class RecordApprovalDecisionDto {
  @IsMongoId()
  @IsNotEmpty()
  approverEmployeeId: string;

  @IsEnum(ApprovalDecision)
  decision: ApprovalDecision;

  @IsDateString()
  @IsOptional()
  decidedAt?: string;

  @IsString()
  @IsOptional()
  comments?: string;
}

