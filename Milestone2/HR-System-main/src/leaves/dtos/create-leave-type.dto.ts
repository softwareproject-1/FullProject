//import { IsString, IsBoolean, IsNumber } from 'class-validator';

import { Type } from 'class-transformer';
import { IsString, IsBoolean, IsNumber, IsOptional, ValidateNested } from 'class-validator';

export class CreateLeaveTypeDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsBoolean()
  paid: boolean;

  @IsBoolean()
  deductible: boolean;

  @IsBoolean()
  requiresAttachment: boolean;

  @IsOptional()
  @IsString()
  attachmentType?: string;

  @IsOptional()
  @IsNumber()
  minTenureMonths?: number;

  @IsOptional()
  @IsNumber()
  maxDurationDays?: number;

  @IsString()
  payrollCode: string;


  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ApprovalStepDto)
  approvalWorkflow?: ApprovalStepDto[];

}


export class ApprovalStepDto {
  @IsString()
  role: string; // e.g., 'Manager', 'HR', 'Director'
  @IsNumber()
  level: number; // the step order in the chain
}

