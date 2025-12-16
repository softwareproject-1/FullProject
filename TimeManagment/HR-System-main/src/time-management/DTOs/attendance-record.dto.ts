import { IsMongoId, IsArray, IsNumber, IsBoolean, IsOptional, IsEnum, IsDateString, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PunchType } from '../models/enums/index';

export class PunchDto {
  @ApiProperty({ description: 'Punch type', enum: PunchType, example: PunchType.IN })
  @IsEnum(PunchType)
  type: PunchType;

  @ApiProperty({ description: 'Punch time', example: '2025-12-01T08:00:00Z' })
  @IsDateString()
  time: string;
}

export class CreateAttendanceRecordDto {
  @ApiProperty({ description: 'Employee ID', example: '692c8d144f91641d7db3e521' })
  @IsMongoId()
  employeeId: string;

  @ApiPropertyOptional({ description: 'List of punches', type: [PunchDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PunchDto)
  @IsOptional()
  punches?: PunchDto[];

  @ApiPropertyOptional({ description: 'Total work minutes', example: 480 })
  @IsNumber()
  @IsOptional()
  totalWorkMinutes?: number;

  @ApiPropertyOptional({ description: 'Whether there is a missed punch', default: false })
  @IsBoolean()
  @IsOptional()
  hasMissedPunch?: boolean;

  @ApiPropertyOptional({ description: 'List of exception IDs', type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  exceptionIds?: string[];

  @ApiPropertyOptional({ description: 'Whether finalized for payroll', default: true })
  @IsBoolean()
  @IsOptional()
  finalisedForPayroll?: boolean;
}

export class ClockInOutDto {
  @ApiProperty({ description: 'Employee ID', example: '692c8d144f91641d7db3e521' })
  @IsMongoId()
  employeeId: string;

  @ApiProperty({ description: 'Punch type', enum: PunchType, example: PunchType.IN })
  @IsEnum(PunchType)
  type: PunchType;

  @ApiPropertyOptional({ description: 'Location of punch', example: 'Main Office' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Terminal ID', example: 'TERM001' })
  @IsString()
  @IsOptional()
  terminalId?: string;

  @ApiPropertyOptional({ description: 'Device ID', example: 'DEV001' })
  @IsString()
  @IsOptional()
  deviceId?: string;
}

export class ManualAttendanceCorrectionDto {
  @ApiProperty({ description: 'Attendance record ID', example: '692d6215e560a13dcc80eacb' })
  @IsMongoId()
  attendanceRecordId: string;

  @ApiProperty({ description: 'List of corrected punches', type: [PunchDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PunchDto)
  punches: PunchDto[];

  @ApiPropertyOptional({ description: 'Reason for correction', example: 'System error' })
  @IsString()
  @IsOptional()
  reason?: string;
}

