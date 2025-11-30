import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  MinLength,
  IsDateString,
} from 'class-validator';

export class RegisterDto {
  // Required fields from UserProfileBase
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  nationalId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  // Optional fields from UserProfileBase
  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @IsOptional()
  @IsString()
  mobilePhone?: string;

  // Required fields from EmployeeProfile
  @IsString()
  @IsNotEmpty()
  employeeNumber: string;

  @IsDateString()
  @IsNotEmpty()
  dateOfHire: string;

  // Optional fields from EmployeeProfile
  @IsOptional()
  @IsEmail()
  workEmail?: string;
}

