import {
  IsString,
  IsEnum,
  IsDateString,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PolicyType,
  Applicability,
  ConfigStatus,
} from '../../enums/payroll-configuration-enums';

class RuleDefinitionDto {
  @IsNumber()
  @Min(0)
  percentage: number;

  @IsNumber()
  @Min(0)
  fixedAmount: number;

  @IsNumber()
  @Min(1)
  thresholdAmount: number;
}

export class CreatePayrollPolicyDto {
  @IsString()
  policyName: string;

  @IsEnum(PolicyType)
  policyType: PolicyType;

  @IsString()
  description: string;

  @IsDateString()
  effectiveDate: Date | string;

  @ValidateNested()
  @Type(() => RuleDefinitionDto)
  ruleDefinition: RuleDefinitionDto;

  @IsEnum(Applicability)
  applicability: Applicability;

  // @IsEnum(ConfigStatus)
  // status: ConfigStatus;
}
