import { IsEmail, IsEnum, IsMongoId, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { Role } from '../../Models/userSchema';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class UpdateUserRoleDto {
  @IsEnum(Role)
  role: Role;
}

export class AttachEmployeeProfileDto {
  @IsMongoId()
  userId: string;

  @IsMongoId()
  employeeId: string;
}
