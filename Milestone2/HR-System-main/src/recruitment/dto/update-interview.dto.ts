import { IsEnum, IsOptional, IsArray, IsMongoId, IsString, IsDateString } from 'class-validator';
import { InterviewMethod } from '../enums/interview-method.enum';
import { InterviewStatus } from '../enums/interview-status.enum';

export class UpdateInterviewDto {
  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @IsEnum(InterviewMethod)
  @IsOptional()
  method?: InterviewMethod;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  panel?: string[];

  @IsString()
  @IsOptional()
  videoLink?: string;

  @IsEnum(InterviewStatus)
  @IsOptional()
  status?: InterviewStatus;

  @IsString()
  @IsOptional()
  candidateFeedback?: string;
}
