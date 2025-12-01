import { IsNumber, IsOptional, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateOfferDto {
  @IsOptional()
  @IsNumber()
  grossSalary?: number;

  @IsOptional()
  @IsNumber()
  signingBonus?: number;

  @IsOptional()
  @IsString()
  benefits?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  offerExpiry?: Date;
}
