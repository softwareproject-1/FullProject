import { IsMongoId, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TimeExceptionType, TimeExceptionStatus } from '../models/enums/index';

export class CreateTimeExceptionDto {
  @ApiProperty({ description: 'Employee ID', example: '692c8d144f91641d7db3e521' })
  @IsMongoId()
  employeeId: string;

  @ApiProperty({ description: 'Exception type', enum: TimeExceptionType, example: TimeExceptionType.LATE })
  @IsEnum(TimeExceptionType)
  type: TimeExceptionType;

  @ApiProperty({ description: 'Attendance record ID', example: '692d6215e560a13dcc80eacb' })
  @IsMongoId()
  attendanceRecordId: string;

  @ApiProperty({ description: 'Assigned to (manager ID)', example: '692d5d7968a930979e5a9b92' })
  @IsMongoId()
  assignedTo: string;

  @ApiPropertyOptional({ description: 'Exception status', enum: TimeExceptionStatus, default: TimeExceptionStatus.OPEN })
  @IsEnum(TimeExceptionStatus)
  @IsOptional()
  status?: TimeExceptionStatus;

  @ApiPropertyOptional({ description: 'Reason for exception', example: 'Traffic jam' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdateTimeExceptionDto {
  @ApiProperty({ description: 'Exception status', enum: TimeExceptionStatus })
  @IsEnum(TimeExceptionStatus)
  status: TimeExceptionStatus;

  @ApiPropertyOptional({ description: 'Reason for exception', example: 'Resolved' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: 'Assigned to (manager ID)', example: '692d5d7968a930979e5a9b92' })
  @IsMongoId()
  @IsOptional()
  assignedTo?: string;
}

