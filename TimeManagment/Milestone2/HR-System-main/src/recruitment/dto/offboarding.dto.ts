import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsOptional,
  IsArray,
  IsEnum,
  IsMongoId,
  IsBoolean,
  IsNumber,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TerminationStatus } from '../enums/termination-status.enum';
import { TerminationInitiation } from '../enums/termination-initiation.enum';
import { ApprovalStatus } from '../enums/approval-status.enum';

// ============================================================
// OFF-001: Termination Review DTOs
// ============================================================

/**
 * DTO for initiating termination review (HR/Manager)
 */
export class InitiateTerminationReviewDto {
  @IsMongoId()
  @IsNotEmpty()
  employeeId: string;

  @IsMongoId()
  @IsNotEmpty()
  contractId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsEnum(TerminationInitiation)
  @IsNotEmpty()
  initiator: TerminationInitiation;

  @IsString()
  @IsOptional()
  comments?: string;

  @IsMongoId()
  @IsOptional()
  notifyUserId?: string; // User to notify about termination initiation
}

/**
 * DTO for updating termination status
 */
export class UpdateTerminationStatusDto {
  @IsEnum(TerminationStatus)
  @IsNotEmpty()
  status: TerminationStatus;

  @IsString()
  @IsOptional()
  comments?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  terminationDate?: Date;
}

// ============================================================
// OFF-018/019: Resignation DTOs
// ============================================================

/**
 * DTO for creating resignation request (Employee)
 */
export class CreateResignationRequestDto {
  @IsMongoId()
  @IsNotEmpty()
  employeeId: string;

  @IsMongoId()
  @IsNotEmpty()
  contractId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  requestedLastDay?: Date;

  @IsString()
  @IsOptional()
  comments?: string;

  @IsMongoId()
  @IsOptional()
  hrManagerId?: string; // HR Manager to notify about resignation
}

/**
 * DTO for reviewing resignation (HR)
 */
export class ReviewResignationDto {
  @IsEnum(TerminationStatus)
  @IsNotEmpty()
  status: TerminationStatus;

  @IsString()
  @IsOptional()
  hrComments?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  approvedLastDay?: Date;
}

// ============================================================
// OFF-006: Offboarding Checklist DTOs
// ============================================================

/**
 * DTO for creating offboarding checklist
 */
export class CreateOffboardingChecklistDto {
  @IsMongoId()
  @IsNotEmpty()
  terminationId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  departments?: string[];

  @IsMongoId()
  @IsOptional()
  hrManagerId?: string; // Track who created the checklist
}

/**
 * DTO for equipment item
 */
export class EquipmentItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsMongoId()
  @IsOptional()
  equipmentId?: string;
}

/**
 * DTO for adding equipment to checklist
 */
export class AddEquipmentToChecklistDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipmentItemDto)
  @ArrayMinSize(1)
  equipment: EquipmentItemDto[];
}

// ============================================================
// OFF-010: Department Clearance DTOs
// ============================================================

/**
 * DTO for department sign-off
 */
export class DepartmentSignOffDto {
  @IsString()
  @IsNotEmpty()
  department: string;

  @IsEnum(ApprovalStatus)
  @IsNotEmpty()
  status: ApprovalStatus;

  @IsString()
  @IsOptional()
  comments?: string;
}

/**
 * DTO for updating equipment return
 */
export class UpdateEquipmentReturnDto {
  @IsMongoId()
  @IsNotEmpty()
  equipmentId: string;

  @IsBoolean()
  @IsNotEmpty()
  returned: boolean;

  @IsString()
  @IsOptional()
  condition?: string;
}

/**
 * DTO for updating access card return
 */
export class UpdateAccessCardReturnDto {
  @IsBoolean()
  @IsNotEmpty()
  returned: boolean;
}

// ============================================================
// OFF-007: Access Revocation DTOs
// ============================================================

/**
 * DTO for scheduling access revocation
 */
export class ScheduleAccessRevocationDto {
  @IsMongoId()
  @IsNotEmpty()
  employeeId: string;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  revocationDate: Date;

  @IsMongoId()
  @IsOptional()
  terminationId?: string;
}

/**
 * DTO for immediate access revocation (OFF-007)
 */
export class RevokeAccessImmediatelyDto {
  @IsMongoId()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  reason: 'termination' | 'resignation' | 'no_show' | 'contract_cancelled';

  @IsMongoId()
  @IsOptional()
  terminationId?: string;
}

// ============================================================
// OFF-013: Final Settlement DTOs
// ============================================================

/**
 * DTO for calculating final settlement
 */
export class CalculateFinalSettlementDto {
  @IsMongoId()
  @IsNotEmpty()
  terminationId: string;

  @IsMongoId()
  @IsNotEmpty()
  employeeId: string;

  @IsNumber()
  @IsOptional()
  unusedLeaveBalance?: number;

  @IsNumber()
  @IsOptional()
  leaveEncashmentAmount?: number;

  @IsNumber()
  @IsOptional()
  pendingDeductions?: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  benefitsTerminationDate?: Date;

  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * DTO for triggering final settlement
 */
export class TriggerFinalSettlementDto {
  @IsMongoId()
  @IsNotEmpty()
  triggeredBy: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
