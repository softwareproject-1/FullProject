import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAppraisalDisputeDto {
  @IsString()
  @IsNotEmpty()
  appraisalId: string;

  @IsString()
  @IsNotEmpty()
  assignmentId: string;

  @IsString()
  @IsNotEmpty()
  cycleId: string;

  @IsString()
  @IsNotEmpty()
  raisedByEmployeeId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsString()
  details?: string;
}


