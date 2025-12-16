import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AppraisalDisputeStatus } from '../enums/performance.enums';

export class ResolveAppraisalDisputeDto {
  @IsEnum(AppraisalDisputeStatus)
  status: AppraisalDisputeStatus;

  @IsString()
  @IsNotEmpty()
  resolvedByEmployeeId: string;

  @IsOptional()
  @IsString()
  resolutionSummary?: string;
}


