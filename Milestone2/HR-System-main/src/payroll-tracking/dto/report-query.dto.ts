import { IsDateString, IsOptional } from 'class-validator';

export class ReportQueryDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  department?: string; // Optional for departmental filtering
}
