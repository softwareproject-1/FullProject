import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import 'reflect-metadata';
import { Type } from 'class-transformer';
import {
  EmployeeStatus,
  WorkType,
  ContractType,
} from '../enums/employee-profile.enums';

class DateRangeDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}

export class EmployeeProfileFilterDto {
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
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departmentIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  positionIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  payGradeIds?: string[];

  @IsOptional()
  @IsEnum(WorkType)
  workType?: WorkType;

  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;

  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateOfHireRange?: DateRangeDto;

  @IsOptional()
  @IsString()
  search?: string;
}

