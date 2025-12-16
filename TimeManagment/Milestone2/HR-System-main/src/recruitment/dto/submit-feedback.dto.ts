import { IsMongoId, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class SubmitFeedbackDto {
  @IsMongoId()
  interviewerId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;    

  @IsString()
  @IsOptional()
  comments?: string;
}
