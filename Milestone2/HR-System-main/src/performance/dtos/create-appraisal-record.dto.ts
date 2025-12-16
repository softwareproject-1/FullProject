import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RatingEntryDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  ratingValue: number;

  @IsOptional()
  @IsString()
  ratingLabel?: string;

  @IsOptional()
  @IsNumber()
  weightedScore?: number;

  @IsOptional()
  @IsString()
  comments?: string;
}

export class CreateAppraisalRecordDto {
  @IsString()
  @IsNotEmpty()
  assignmentId: string;

  @IsString()
  @IsNotEmpty()
  cycleId: string;

  @IsString()
  @IsNotEmpty()
  templateId: string;

  @IsString()
  @IsNotEmpty()
  employeeProfileId: string;

  @IsString()
  @IsNotEmpty()
  managerProfileId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RatingEntryDto)
  ratings: RatingEntryDto[];

  @IsOptional()
  @IsNumber()
  totalScore?: number;

  @IsOptional()
  @IsString()
  overallRatingLabel?: string;

  @IsOptional()
  @IsString()
  managerSummary?: string;

  @IsOptional()
  @IsString()
  strengths?: string;

  @IsOptional()
  @IsString()
  improvementAreas?: string;

  @IsOptional()
  @IsDateString()
  managerSubmittedAt?: string;
}


