import { IsString, IsNotEmpty, IsOptional, ValidateIf, IsEmail } from 'class-validator';

export class LoginDto {
  @ValidateIf((o) => !o.workEmail && !o.personalEmail)
  @IsString()
  @IsNotEmpty()
  nationalId?: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @ValidateIf((o) => !o.nationalId && !o.personalEmail)
  @IsOptional()
  @IsEmail()
  @IsString()
  workEmail?: string;

  @ValidateIf((o) => !o.nationalId && !o.workEmail)
  @IsOptional()
  @IsEmail()
  @IsString()
  personalEmail?: string;
}

