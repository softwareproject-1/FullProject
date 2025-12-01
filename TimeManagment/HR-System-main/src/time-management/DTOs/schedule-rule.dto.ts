import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateScheduleRuleDto {
  @ApiProperty({ description: 'Schedule rule name', example: 'Monday to Friday' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Schedule pattern', example: 'MON-FRI' })
  @IsString()
  pattern: string;

  @ApiPropertyOptional({ description: 'Whether the rule is active', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class UpdateScheduleRuleDto {
  @ApiPropertyOptional({ description: 'Schedule rule name', example: 'Monday to Friday' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Schedule pattern', example: 'MON-FRI' })
  @IsString()
  @IsOptional()
  pattern?: string;

  @ApiPropertyOptional({ description: 'Whether the rule is active' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

