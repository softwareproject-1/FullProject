import { IsNotEmpty, IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class AdminResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;

  @IsOptional()
  @IsBoolean()
  forcePasswordChange?: boolean; // If true, user must change password on next login
}

