import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApplicationStage } from '../enums/application-stage.enum';
import { ApplicationStatus } from '../enums/application-status.enum';

export class UpdateApplicationStatusDto {
  @IsEnum(ApplicationStage)
  @IsOptional()
  currentStage?: ApplicationStage;

  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

  @IsMongoId()
  changedBy: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
