import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AppraisalCycleStatus, AppraisalTemplateType } from '../enums/performance.enums';

export class CycleTemplateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  departmentIds?: string[];
}

export class CreateAppraisalCycleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(AppraisalTemplateType)
  cycleType: AppraisalTemplateType;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsDateString()
  managerDueDate?: string;

  @IsOptional()
  @IsDateString()
  employeeAcknowledgementDueDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CycleTemplateAssignmentDto)
  templateAssignments: CycleTemplateAssignmentDto[];

  @IsOptional()
  @IsEnum(AppraisalCycleStatus)
  status?: AppraisalCycleStatus;
}


