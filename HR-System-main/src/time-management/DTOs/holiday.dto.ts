import { IsEnum, IsDateString, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HolidayType } from '../models/enums/index';

export class CreateHolidayDto {
  @ApiProperty({ description: 'Holiday type', enum: HolidayType, example: HolidayType.NATIONAL })
  @IsEnum(HolidayType)
  type: HolidayType;

  @ApiProperty({ description: 'Holiday start date', example: '2025-01-01T00:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'Holiday end date (if missing, same as startDate)', example: '2025-01-01T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Holiday name', example: "New Year's Day" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Whether the holiday is active', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class UpdateHolidayDto {
  @ApiPropertyOptional({ description: 'Holiday type', enum: HolidayType })
  @IsEnum(HolidayType)
  @IsOptional()
  type?: HolidayType;

  @ApiPropertyOptional({ description: 'Holiday start date', example: '2025-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Holiday end date', example: '2025-01-01T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Holiday name', example: "New Year's Day" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Whether the holiday is active' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

