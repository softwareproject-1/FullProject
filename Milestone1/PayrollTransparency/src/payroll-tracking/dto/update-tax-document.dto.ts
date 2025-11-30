import {
  IsString,
  IsEnum,
  IsNumber,
  Min,
  IsDateString,
  IsUrl,
  IsOptional,
} from 'class-validator';

export class UpdateTaxDocumentDto {
  @IsString()
  @IsOptional()
  employee?: string;

  @IsEnum(['Annual Tax Summary', 'Insurance Certificate', 'T4', 'Other'])
  @IsOptional()
  documentType?: 'Annual Tax Summary' | 'Insurance Certificate' | 'T4' | 'Other';

  @IsNumber()
  @Min(1900)
  @IsOptional()
  year?: number;

  @IsDateString()
  @IsOptional()
  generatedAt?: Date;

  @IsUrl()
  @IsOptional()
  documentUrl?: string;
}
