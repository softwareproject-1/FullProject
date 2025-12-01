import { IsNotEmpty, IsString, IsDate } from 'class-validator';

export class CreateCompanySettingsDto {
  @IsNotEmpty()
  @IsDate()
  payDate: Date;

  @IsNotEmpty()
  @IsString()
  timeZone: string;

  @IsNotEmpty()
  @IsString()
  currency?: string; // optional, default = 'EGP'
}
