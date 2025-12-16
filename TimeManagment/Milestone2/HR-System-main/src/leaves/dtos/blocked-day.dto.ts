import { IsString, IsDateString, IsOptional } from 'class-validator';

export class BlockedDayDto {
  @IsString()
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
