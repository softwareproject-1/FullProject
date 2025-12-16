import {
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export class EmployeeRecordsFilterDto {
  @IsOptional()
  @IsString()
  cycleId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

