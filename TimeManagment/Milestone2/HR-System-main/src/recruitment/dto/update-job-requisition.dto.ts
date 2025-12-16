import { IsString, IsNumber, IsOptional, IsDateString, IsMongoId } from 'class-validator';

export class UpdateJobRequisitionDto {
  @IsString()
  @IsOptional()
  requisitionId?: string;

  @IsMongoId()
  @IsOptional()
  templateId?: string;

  @IsNumber()
  @IsOptional()
  openings?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsMongoId()
  @IsOptional()
  hiringManagerId?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}
