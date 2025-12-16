import { IsMongoId, IsDate, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShiftAssignmentStatus } from '../models/enums/index';

export class CreateShiftAssignmentDto {
  @ApiPropertyOptional({ description: 'Employee ID', example: '692c8d144f91641d7db3e521' })
  @IsMongoId()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Department ID', example: '692c94436b51a30704a0b9ae' })
  @IsMongoId()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Position ID', example: '692d6215e560a13dcc80eacc' })
  @IsMongoId()
  @IsOptional()
  positionId?: string;

  @ApiProperty({ description: 'Shift ID', example: '692d5ac2e560a13dcc80eaba' })
  @IsMongoId()
  shiftId: string;

  @ApiPropertyOptional({ description: 'Schedule rule ID', example: '692d5917e560a13dcc80eab3' })
  @IsMongoId()
  @IsOptional()
  scheduleRuleId?: string;

  @ApiProperty({ description: 'Start date', example: '2025-01-01T00:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'End date (null for ongoing)', example: '2025-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Assignment status', enum: ShiftAssignmentStatus, default: ShiftAssignmentStatus.PENDING })
  @IsEnum(ShiftAssignmentStatus)
  @IsOptional()
  status?: ShiftAssignmentStatus;
}

export class UpdateShiftAssignmentDto {
  @ApiPropertyOptional({ description: 'Employee ID', example: '692c8d144f91641d7db3e521' })
  @IsMongoId()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Department ID', example: '692c94436b51a30704a0b9ae' })
  @IsMongoId()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Position ID', example: '692d6215e560a13dcc80eacc' })
  @IsMongoId()
  @IsOptional()
  positionId?: string;

  @ApiPropertyOptional({ description: 'Shift ID', example: '692d5ac2e560a13dcc80eaba' })
  @IsMongoId()
  @IsOptional()
  shiftId?: string;

  @ApiPropertyOptional({ description: 'Schedule rule ID', example: '692d5917e560a13dcc80eab3' })
  @IsMongoId()
  @IsOptional()
  scheduleRuleId?: string;

  @ApiPropertyOptional({ description: 'Start date', example: '2025-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date', example: '2025-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Assignment status', enum: ShiftAssignmentStatus })
  @IsEnum(ShiftAssignmentStatus)
  @IsOptional()
  status?: ShiftAssignmentStatus;
}

export class BulkShiftAssignmentDto {
  @ApiPropertyOptional({ description: 'List of employee IDs', type: [String] })
  @IsMongoId({ each: true })
  @IsOptional()
  employeeIds?: string[];

  @ApiPropertyOptional({ description: 'Department ID', example: '692c94436b51a30704a0b9ae' })
  @IsMongoId()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Position ID', example: '692d6215e560a13dcc80eacc' })
  @IsMongoId()
  @IsOptional()
  positionId?: string;

  @ApiProperty({ description: 'Shift ID', example: '692d5ac2e560a13dcc80eaba' })
  @IsMongoId()
  shiftId: string;

  @ApiPropertyOptional({ description: 'Schedule rule ID', example: '692d5917e560a13dcc80eab3' })
  @IsMongoId()
  @IsOptional()
  scheduleRuleId?: string;

  @ApiProperty({ description: 'Start date', example: '2025-01-01T00:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'End date', example: '2025-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Assignment status', enum: ShiftAssignmentStatus, default: ShiftAssignmentStatus.PENDING })
  @IsEnum(ShiftAssignmentStatus)
  @IsOptional()
  status?: ShiftAssignmentStatus;
}

