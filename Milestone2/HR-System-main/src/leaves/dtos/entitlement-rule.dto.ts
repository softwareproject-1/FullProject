import { IsString, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class EligibilityCriteriaDto {
  @ApiPropertyOptional({ description: 'Minimum tenure in months', example: 6 })
  @IsOptional()
  @IsNumber()
  minTenure?: number;

  @ApiPropertyOptional({ description: 'Employee grade', example: 'Senior' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ description: 'Contract type', example: 'PERMANENT' })
  @IsOptional()
  @IsString()
  contractType?: string;

  @ApiPropertyOptional({ description: 'Array of allowed position IDs', example: ['pos1', 'pos2'] })
  @IsOptional()
  @IsString({ each: true })
  positionsAllowed?: string[]; // Array of position IDs that are eligible

  @ApiPropertyOptional({ description: 'Array of allowed locations', example: ['Egypt', 'USA', 'UK'] })
  @IsOptional()
  @IsString({ each: true })
  locationsAllowed?: string[]; // Array of locations/countries (e.g., ['Egypt', 'USA', 'UK'])
}

export class EntitlementRuleDto {
  @ApiProperty({ description: 'Leave type code', example: 'LT001' })
  @IsString()
  leaveTypeCode: string;

  @ApiProperty({ description: 'Number of days per year', example: 21 })
  @IsNumber()
  daysPerYear: number;

  @ApiPropertyOptional({ description: 'Eligibility criteria for this entitlement', type: EligibilityCriteriaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EligibilityCriteriaDto)
  eligibilityCriteria?: EligibilityCriteriaDto;
}
