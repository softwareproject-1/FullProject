import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  DepartmentType,
  EmploymentStatus,
  EmploymentType,
  RoleType,
  leaveType,
} from '../../Models/employeeSchema';

class BankDetailsDto {
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;
}

export class CreateEmployeeDto {
  @IsString()
  @Length(2, 50)
  firstName: string;

  @IsString()
  @Length(2, 50)
  lastName: string;

  @IsString()
  @Length(5, 10)
  employeeId: string;

  @IsDateString()
  hireDate: string;

  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @IsEnum(EmploymentStatus)
  employmentStatus: EmploymentStatus;

  @IsMongoId()
  position: string;

  @IsOptional()
  @IsMongoId()
  manager?: string;

  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails: BankDetailsDto;

  @IsString()
  @Length(5, 15)
  socialInsuranceNumber: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(10, 15)
  phone: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsUrl()
  profilePictureUrl?: string;

  @IsEnum(RoleType)
  role: RoleType;

  @IsEnum(DepartmentType)
  department: DepartmentType;

  @IsOptional()
  @IsString()
  payGrade?: string;

  @IsOptional()
  @IsNumber()
  baseSalary?: number;

  @IsOptional()
  @Min(1)
  @Max(5)
  lastPerformanceRating?: number;

  @IsOptional()
  @IsDateString()
  lastAppraisalDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(leaveType)
  leaveType?: leaveType;
}

export class UpdateEmployeeContactDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(10, 15)
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsUrl()
  profilePictureUrl?: string;
}

export class ProfileChangeRequestDto {
  @IsMongoId()
  employeeId: string;

  @IsOptional()
  @IsMongoId()
  position?: string;

  @IsOptional()
  @IsEnum(DepartmentType)
  department?: DepartmentType;

  @IsOptional()
  @IsEnum(RoleType)
  role?: RoleType;

  @IsOptional()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto;

  @IsOptional()
  @IsEnum(EmploymentStatus)
  employmentStatus?: EmploymentStatus;

  @IsOptional()
  @IsString()
  payGrade?: string;

  @IsOptional()
  @IsNumber()
  baseSalary?: number;

  @IsOptional()
  @IsString()
  justification?: string;
}

export class DeactivateEmployeeDto {
  @IsMongoId()
  employeeId: string;

  @IsDateString()
  terminationDate: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class EmployeeFilterDto {
  @IsOptional()
  @IsEnum(DepartmentType)
  department?: DepartmentType;

  @IsOptional()
  @IsEnum(EmploymentStatus)
  employmentStatus?: EmploymentStatus;

  @IsOptional()
  @IsEnum(RoleType)
  @IsOptional()
  @IsEnum(RoleType)
  role?: RoleType;
}
