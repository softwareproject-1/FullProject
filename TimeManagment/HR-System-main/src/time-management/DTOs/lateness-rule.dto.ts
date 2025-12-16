import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLatenessRuleDto {
  @ApiProperty({ description: 'Lateness rule name', example: 'Standard Lateness Policy' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Rule description', example: '15 minute grace period' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Grace period in minutes', default: 0, example: 15 })
  @IsNumber()
  @IsOptional()
  gracePeriodMinutes?: number;

  @ApiPropertyOptional({ description: 'Deduction amount per minute after grace period', default: 0, example: 1 })
  @IsNumber()
  @IsOptional()
  deductionForEachMinute?: number;

  @ApiPropertyOptional({ description: 'Whether the rule is active', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class UpdateLatenessRuleDto {
  @ApiPropertyOptional({ description: 'Lateness rule name', example: 'Standard Lateness Policy' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Rule description', example: '15 minute grace period' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Grace period in minutes', example: 15 })
  @IsNumber()
  @IsOptional()
  gracePeriodMinutes?: number;

  @ApiPropertyOptional({ description: 'Deduction amount per minute after grace period', example: 1 })
  @IsNumber()
  @IsOptional()
  deductionForEachMinute?: number;

  @ApiPropertyOptional({ description: 'Whether the rule is active' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

