import { IsString, IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class AddHolidayDto {
  @IsString()
  name: string;

  @IsDateString()
  date: string;

  @IsBoolean()
  isRecurring: boolean;

  @IsOptional()
  @IsString()
  type?: string; // e.g. National, Company, Religious

  @IsOptional()
  @IsString()
  region?: string; // e.g. localization, multi-country support
}