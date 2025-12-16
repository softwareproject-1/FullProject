import { IsMongoId, IsDateString, IsEnum, IsOptional, IsArray, IsString } from 'class-validator';
import { ApplicationStage } from '../enums/application-stage.enum';
import { InterviewMethod } from '../enums/interview-method.enum';

export class ScheduleInterviewDto {
  @IsMongoId()
  applicationId: string;

  @IsEnum(ApplicationStage)
  stage: ApplicationStage;

  @IsDateString()
  scheduledDate: string;

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

  @IsString()
  @IsOptional()
  calendarEventId?: string;
}
