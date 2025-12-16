import { IsDateString, IsOptional, IsMongoId, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TimeExceptionType, TimeExceptionStatus } from '../models/enums/index';

export class AttendanceReportDto {
  @ApiPropertyOptional({ description: 'Report start date', example: '2025-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Report end date', example: '2025-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by employee ID', example: '692c8d144f91641d7db3e521' })
  @IsMongoId()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Filter by department ID', example: '692c94436b51a30704a0b9ae' })
  @IsMongoId()
  @IsOptional()
  departmentId?: string;
}

export class OvertimeReportDto {
  @ApiPropertyOptional({ description: 'Report start date', example: '2025-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Report end date', example: '2025-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by employee ID', example: '692c8d144f91641d7db3e521' })
  @IsMongoId()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Filter by department ID', example: '692c94436b51a30704a0b9ae' })
  @IsMongoId()
  @IsOptional()
  departmentId?: string;
}

export class ExceptionReportDto {
  @ApiPropertyOptional({ description: 'Report start date', example: '2025-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Report end date', example: '2025-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by exception type', enum: TimeExceptionType })
  @IsEnum(TimeExceptionType)
  @IsOptional()
  type?: TimeExceptionType;

  @ApiPropertyOptional({ description: 'Filter by exception status', enum: TimeExceptionStatus })
  @IsEnum(TimeExceptionStatus)
  @IsOptional()
  status?: TimeExceptionStatus;

  @ApiPropertyOptional({ description: 'Filter by employee ID', example: '692c8d144f91641d7db3e521' })
  @IsMongoId()
  @IsOptional()
  employeeId?: string;
}

export class ExportReportDto {
  @ApiPropertyOptional({ description: 'Export format', enum: ['excel', 'access', 'text'], example: 'excel' })
  @IsString()
  @IsEnum(['excel', 'access', 'text'])
  format: 'excel' | 'access' | 'text';
}

