import { IsBoolean, IsMongoId, IsOptional, IsIP, IsString } from 'class-validator';

export class SubmitConsentDto {
  @IsMongoId()
  applicationId: string;

  @IsBoolean()
  dataProcessingConsent: boolean;

  @IsBoolean()
  backgroundCheckConsent: boolean;

  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  consentText?: string;
}
