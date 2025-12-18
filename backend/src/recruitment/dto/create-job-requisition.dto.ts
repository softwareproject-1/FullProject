import { IsString, IsNumber, IsOptional, IsDateString, IsMongoId } from 'class-validator';

export class CreateJobRequisitionDto {
  @IsString()
  requisitionId: string;

  @IsMongoId()
  @IsOptional()
  templateId?: string;

  @IsNumber()
  openings: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsMongoId()
  hiringManagerId: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;
}
