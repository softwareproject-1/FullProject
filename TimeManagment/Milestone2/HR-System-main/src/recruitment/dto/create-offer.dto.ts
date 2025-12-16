import { IsMongoId, IsNumber, IsOptional, IsArray, ValidateNested, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

class ApproverDto {
  @IsMongoId()
  employeeId: string;

  @IsString()
  role: string;
}

export class CreateOfferDto {
  @IsMongoId()
  applicationId: string;

  @IsNumber()
  grossSalary: number;

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApproverDto)
  approvers: ApproverDto[];
}
