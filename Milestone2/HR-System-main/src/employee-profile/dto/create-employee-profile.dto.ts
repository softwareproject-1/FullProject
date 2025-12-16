import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  ValidateNested,
} from 'class-validator';
import 'reflect-metadata';
import { Type } from 'class-transformer';
import {
  ContractType,
  EmployeeStatus,
  Gender,
  MaritalStatus,
  WorkType,
} from '../enums/employee-profile.enums';
import { AppraisalRatingScaleType } from '../../performance/enums/performance.enums';

class AddressDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  streetAddress?: string;

  @IsOptional()
  @IsString()
  country?: string;
}

class PerformanceSnapshotDto {
  @IsOptional()
  @IsString()
  lastAppraisalRecordId?: string;

  @IsOptional()
  @IsString()
  lastAppraisalCycleId?: string;

  @IsOptional()
  @IsString()
  lastAppraisalTemplateId?: string;

  @IsOptional()
  @IsDateString()
  lastAppraisalDate?: string;

  @IsOptional()
  @IsNumber()
  lastAppraisalScore?: number;

  @IsOptional()
  @IsString()
  lastAppraisalRatingLabel?: string;

  @IsOptional()
  @IsEnum(AppraisalRatingScaleType)
  lastAppraisalScaleType?: AppraisalRatingScaleType;

  @IsOptional()
  @IsString()
  lastDevelopmentPlanSummary?: string;
}

class OrgLinksDto {
  @IsOptional()
  @IsString()
  primaryPositionId?: string;

  @IsOptional()
  @IsString()
  primaryDepartmentId?: string;

  @IsOptional()
  @IsString()
  supervisorPositionId?: string;

  @IsOptional()
  @IsString()
  payGradeId?: string;
}

export class CreateEmployeeProfileDto {
  @IsString()
  @IsNotEmpty()
  employeeNumber: string;

  @IsDateString()
  dateOfHire: string;

  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @IsOptional()
  @IsEmail()
  workEmail?: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsString()
  @MinLength(6)
  nationalId: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  mobilePhone?: string;

  @IsOptional()
  @IsString()
  homePhone?: string;

  @IsOptional()
  @IsUrl()
  profilePictureUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @IsEnum(ContractType)
  contractType?: ContractType;

  @IsOptional()
  @IsEnum(WorkType)
  workType?: WorkType;

  @IsOptional()
  @IsDateString()
  contractStartDate?: string;

  @IsOptional()
  @IsDateString()
  contractEndDate?: string;

  @IsOptional()
  @IsString()
  biography?: string;

  @IsEnum(EmployeeStatus)
  status: EmployeeStatus;

  @IsOptional()
  @IsDateString()
  statusEffectiveFrom?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => OrgLinksDto)
  orgLinks?: OrgLinksDto;

  @IsOptional()
  @IsString()
  accessProfileId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PerformanceSnapshotDto)
  performanceSnapshot?: PerformanceSnapshotDto;
}

