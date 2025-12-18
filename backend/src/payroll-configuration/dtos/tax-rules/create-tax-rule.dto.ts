import { IsNotEmpty, IsNumber, Min, IsString, IsOptional } from 'class-validator';

export class CreateTaxRuleDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  rate: number; // percentage
}
