import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class UpdateCandidateResumeDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  resumeUrl: string;
}

