import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  IsDateString,
  IsUrl,
  IsOptional,
} from 'class-validator';

export class CreateTaxDocumentDto {
  @IsString()
  @IsNotEmpty()
  employee: string;

  @IsEnum(['Annual Tax Summary', 'Insurance Certificate', 'T4', 'Other'])
  @IsNotEmpty()
  documentType: 'Annual Tax Summary' | 'Insurance Certificate' | 'T4' | 'Other';

  @IsNumber()
  @Min(1900)
  year: number;

  @IsDateString()
  @IsNotEmpty()
  generatedAt: Date;

  @IsUrl()
  @IsOptional()
  documentUrl?: string;
}
