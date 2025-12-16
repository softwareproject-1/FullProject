import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SingleAssignmentDto {
  @IsString()
  @IsNotEmpty()
  employeeProfileId: string;

  @IsString()
  @IsNotEmpty()
  managerProfileId: string;

  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @IsOptional()
  @IsString()
  positionId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class CreateAppraisalAssignmentsDto {
  @IsString()
  @IsNotEmpty()
  cycleId: string;

  @IsString()
  @IsNotEmpty()
  templateId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleAssignmentDto)
  assignments: SingleAssignmentDto[];
}


