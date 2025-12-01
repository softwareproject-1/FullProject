import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CandidateStatus } from '../enums/employee-profile.enums';

export class UpdateCandidateStatusDto {
  @IsString()
  @IsNotEmpty()
  candidateId: string;

  @IsEnum(CandidateStatus)
  status: CandidateStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}

