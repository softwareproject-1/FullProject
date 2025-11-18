import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class AttachmentDto {
  @IsString()
  filename: string;

  @IsString()
  url: string;
}

export class CreateLeaveRequestDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  leaveTypeId: string;

  @IsString()
  @IsNotEmpty()
  ruleId: string; // Entitlement rule reference

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  justification: string; // Reason for leave (REQ-015)

  @IsOptional()
  requestedDays?: number; // Raw calendar days (will be calculated if omitted)

  @IsOptional()
  netDays?: number; // Net working days excluding weekends/holidays

  @IsString()
  @IsOptional()
  reason?: string; // Alternative to justification

  @IsOptional()
  isPostLeaveRequest?: boolean; // Submitted after leave taken (REQ-031, grace period)

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  @IsOptional()
  attachments?: AttachmentDto[];
}

export default CreateLeaveRequestDto;
