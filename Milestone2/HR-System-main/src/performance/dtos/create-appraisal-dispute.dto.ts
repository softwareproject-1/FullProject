import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAppraisalDisputeDto {
  @IsString()
  @IsNotEmpty()
  appraisalId: string;

  @IsString()
  @IsOptional() // Optional - can be retrieved from appraisal record
  assignmentId?: string;

  @IsString()
  @IsOptional() // Optional - can be retrieved from appraisal record
  cycleId?: string;

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


