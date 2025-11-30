import { IsString, IsNotEmpty, IsOptional, ValidateIf, IsEmail } from 'class-validator';

export class LoginDto {
  @ValidateIf((o) => !o.workEmail && !o.personalEmail)
  @IsString()
  @IsNotEmpty()
  nationalId?: string; // Login using nationalId from UserProfileBase

  @IsString()
  @IsNotEmpty()
  password: string;

  @ValidateIf((o) => !o.nationalId && !o.personalEmail)
  @IsOptional()
  @IsEmail()
  @IsString()
  workEmail?: string; // Login using workEmail from EmployeeProfile

  @ValidateIf((o) => !o.nationalId && !o.workEmail)
  @IsOptional()
  @IsEmail()
  @IsString()
  personalEmail?: string; // Login using personalEmail from UserProfileBase
}

