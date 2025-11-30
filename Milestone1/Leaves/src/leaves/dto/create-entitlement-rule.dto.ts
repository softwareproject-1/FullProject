import { IsArray, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateEntitlementRuleDto {
  @IsString()
  @IsNotEmpty()
  ruleId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  eligibleEmploymentTypes?: string[];

  @IsNumber()
  @IsOptional()
  minTenureMonths?: number;

  @IsNumber()
  @IsOptional()
  defaultEntitlementDays?: number;

  // Phase 3: Carry-forward & expiry policy (REQ-041, BR-52)
  @IsNumber()
  @IsOptional()
  expiryMonths?: number;

  @IsString()
  @IsOptional()
  carryForwardPolicy?: string; // none|limited|unlimited

  @IsNumber()
  @IsOptional()
  carryForwardMaxDays?: number;

  @IsNumber()
  @IsOptional()
  carryForwardExpiryMonths?: number;
}

export default CreateEntitlementRuleDto;
