import { IsString, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class EligibilityCriteriaDto {
  @IsOptional()
  @IsNumber()
  minTenure?: number;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  contractType?: string;
}

export class EntitlementRuleDto {
  @IsString()
  leaveTypeCode: string;

  @IsNumber()
  daysPerYear: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => EligibilityCriteriaDto)
  eligibilityCriteria?: EligibilityCriteriaDto;
}
