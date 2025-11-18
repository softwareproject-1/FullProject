import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, IsDateString } from 'class-validator';

export enum AccrualJobType {
  MONTHLY_ACCRUAL = 'monthly_accrual',
  QUARTERLY_ACCRUAL = 'quarterly_accrual',
  ANNUAL_ACCRUAL = 'annual_accrual',
}

export class RunAccrualJobDto {
  @IsEnum(AccrualJobType)
  @IsNotEmpty()
  jobType: AccrualJobType;

  @IsDateString()
  @IsNotEmpty()
  period: string; // e.g., '2024-11' or '2024'

  @IsOptional()
  @IsString()
  executedBy?: string; // User ID triggering the job

  @IsOptional()
  @IsString()
  dryRun?: string; // 'true' for simulation mode
}

export class RunYearEndProcessingDto {
  @IsDateString()
  @IsNotEmpty()
  period: string; // e.g., '2024'

  @IsOptional()
  @IsString()
  executedBy?: string;

  @IsOptional()
  @IsString()
  dryRun?: string;
}

export default RunAccrualJobDto;
