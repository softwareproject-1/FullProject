import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SystemRole } from '../enums/employee-profile.enums';

export class CreateEmployeeSystemRoleDto {
  @ApiProperty({
    description: 'The ID of the employee profile',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  employeeProfileId: string;

  @ApiPropertyOptional({
    description: 'Array of system roles to assign',
    enum: SystemRole,
    isArray: true,
    example: ['System Admin'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SystemRole, { each: true })
  roles?: SystemRole[];

  @ApiPropertyOptional({
    description: 'Array of permissions to assign',
    type: [String],
    example: ['read:*', 'write:*', 'delete:*'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({
    description: 'Whether the system role is active',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignSystemRoleDto {
  @ApiPropertyOptional({
    description: 'Array of system roles to assign',
    enum: SystemRole,
    isArray: true,
    example: ['System Admin'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SystemRole, { each: true })
  roles?: SystemRole[];

  @ApiPropertyOptional({
    description: 'Array of permissions to assign',
    type: [String],
    example: ['read:*', 'write:*', 'delete:*'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({
    description: 'Whether the system role is active',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

