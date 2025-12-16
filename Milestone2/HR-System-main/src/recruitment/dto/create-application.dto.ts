import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class CreateApplicationDto {
  @IsMongoId()
  candidateId: string;

  @IsMongoId()
  requisitionId: string;

  @IsMongoId()
  @IsOptional()
  assignedHr?: string;

  @IsString()
  @IsOptional()
  resumeUrl?: string;
}
