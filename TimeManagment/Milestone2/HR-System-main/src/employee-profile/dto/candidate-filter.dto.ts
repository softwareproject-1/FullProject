import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';
import 'reflect-metadata';
import { Type } from 'class-transformer';
import { CandidateStatus } from '../enums/employee-profile.enums';

export class CandidateFilterDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @IsEnum(CandidateStatus)
  status?: CandidateStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departmentIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  positionIds?: string[];

  @IsOptional()
  @IsString()
  search?: string;
}

