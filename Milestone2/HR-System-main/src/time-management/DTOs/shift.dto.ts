import { IsString, IsBoolean, IsNumber, IsOptional, IsMongoId, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PunchPolicy } from '../models/enums/index';

export class CreateShiftDto {
  @ApiProperty({ description: 'Shift name', example: 'Morning 8-4' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Shift type ID', example: '692d5635e560a13dcc80eaa6' })
  @IsMongoId()
  shiftType: string;

  @ApiProperty({ description: 'Shift start time', example: '08:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'Shift end time', example: '16:00' })
  @IsString()
  endTime: string;

  @ApiPropertyOptional({ description: 'Punch policy', enum: PunchPolicy, default: PunchPolicy.FIRST_LAST })
  @IsEnum(PunchPolicy)
  @IsOptional()
  punchPolicy?: PunchPolicy;

  @ApiPropertyOptional({ description: 'Grace period in minutes for clock in', default: 0 })
  @IsNumber()
  @IsOptional()
  graceInMinutes?: number;

  @ApiPropertyOptional({ description: 'Grace period in minutes for clock out', default: 0 })
  @IsNumber()
  @IsOptional()
  graceOutMinutes?: number;

  @ApiPropertyOptional({ description: 'Whether overtime requires approval', default: false })
  @IsBoolean()
  @IsOptional()
  requiresApprovalForOvertime?: boolean;

  @ApiPropertyOptional({ description: 'Whether the shift is active', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class UpdateShiftDto {
  @ApiPropertyOptional({ description: 'Shift name', example: 'Morning 8-4' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Shift type ID', example: '692d5635e560a13dcc80eaa6' })
  @IsMongoId()
  @IsOptional()
  shiftType?: string;

  @ApiPropertyOptional({ description: 'Shift start time', example: '08:00' })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Shift end time', example: '16:00' })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Punch policy', enum: PunchPolicy })
  @IsEnum(PunchPolicy)
  @IsOptional()
  punchPolicy?: PunchPolicy;

  @ApiPropertyOptional({ description: 'Grace period in minutes for clock in' })
  @IsNumber()
  @IsOptional()
  graceInMinutes?: number;

  @ApiPropertyOptional({ description: 'Grace period in minutes for clock out' })
  @IsNumber()
  @IsOptional()
  graceOutMinutes?: number;

  @ApiPropertyOptional({ description: 'Whether overtime requires approval' })
  @IsBoolean()
  @IsOptional()
  requiresApprovalForOvertime?: boolean;

  @ApiPropertyOptional({ description: 'Whether the shift is active' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

