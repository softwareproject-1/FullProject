import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOvertimeRuleDto {
  @ApiProperty({ description: 'Overtime rule name', example: 'Standard Overtime' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Rule description', example: 'Overtime applies after 8 hours' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the rule is active', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Whether the rule is approved', default: false })
  @IsBoolean()
  @IsOptional()
  approved?: boolean;
}

export class UpdateOvertimeRuleDto {
  @ApiPropertyOptional({ description: 'Overtime rule name', example: 'Standard Overtime' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Rule description', example: 'Overtime applies after 8 hours' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the rule is active' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Whether the rule is approved' })
  @IsBoolean()
  @IsOptional()
  approved?: boolean;
}

