import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AppraisalRatingScaleType, AppraisalTemplateType } from '../enums/performance.enums';

export class RatingScaleDefinitionDto {
  @IsEnum(AppraisalRatingScaleType)
  type: AppraisalRatingScaleType;

  @IsNumber()
  min: number;

  @IsNumber()
  max: number;

  @IsOptional()
  @IsNumber()
  step?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];
}

export class EvaluationCriterionDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weight?: number;

  @IsOptional()
  @IsNumber()
  maxScore?: number;

  @IsOptional()
  @IsBoolean()
  required?: boolean;
}

export class CreateAppraisalTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(AppraisalTemplateType)
  templateType: AppraisalTemplateType;

  @ValidateNested()
  @Type(() => RatingScaleDefinitionDto)
  ratingScale: RatingScaleDefinitionDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvaluationCriterionDto)
  criteria: EvaluationCriterionDto[];

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableDepartmentIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicablePositionIds?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}


