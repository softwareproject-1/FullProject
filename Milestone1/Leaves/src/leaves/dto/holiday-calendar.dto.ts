import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateHolidayCalendarDto {
  @IsString()
  @IsNotEmpty()
  calendarId: string;

  @IsString()
  @IsNotEmpty()
  year: string;

  @IsArray()
  @IsNotEmpty()
  holidays: Array<{
    date: string; // ISO date
    name: string;
    type: 'national' | 'company';
  }>;

  @IsArray()
  @IsOptional()
  blockedPeriods?: Array<{
    startDate: string;
    endDate: string;
    reason: string;
  }>;
}

export default CreateHolidayCalendarDto;
