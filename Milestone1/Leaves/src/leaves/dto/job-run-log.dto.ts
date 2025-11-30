import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum JobRunType {
  YEAR_END = 'year_end',
  CARRY_FORWARD = 'carry_forward',
  ACCRUAL_RUN = 'accrual_run',
  CLEANUP = 'cleanup',
  OTHER = 'other',
}

export enum JobStatus {
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  PARTIAL = 'partial',
}

export class CreateJobRunLogDto {
  @IsString()
  @IsNotEmpty()
  runId: string;

  @IsEnum(JobRunType)
  runType: JobRunType;

  @IsString()
  @IsNotEmpty()
  period: string;

  @IsOptional()
  @IsString()
  executedBy?: string;

  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;

  @IsOptional()
  @IsString()
  summary?: string;
}

export default CreateJobRunLogDto;
