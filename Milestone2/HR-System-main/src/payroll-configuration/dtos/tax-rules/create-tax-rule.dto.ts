import {
  IsNotEmpty,
  IsNumber,
  Min,
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class TaxBracket {
  // @IsNumber()
  // @Min(0)
  // minIncome: number;

  // @IsNumber()
  // @Min(0)
  // maxIncome: number;

  @IsNumber()
  @Min(0)
  rate: number; // percentage
}

export class CreateTaxRuleDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  // @IsNotEmpty()
  // @IsEnum(['Single Rate', 'Progressive Brackets', 'Flat Rate with Exemption'])
  // taxType: 'Single Rate' | 'Progressive Brackets' | 'Flat Rate with Exemption';

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  rate: number; // percentage

  // @IsOptional()
  // @IsNumber()
  // @Min(0)
  // exemptionAmount?: number; // tax-free amount

  // @IsOptional()
  // @IsNumber()
  // @Min(0)
  // thresholdAmount?: number; // income threshold

  // @IsOptional()
  // @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => TaxBracket)
  // brackets?: TaxBracket[]; // for progressive brackets
}
