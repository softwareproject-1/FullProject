import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  MinLength,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John', description: 'First name of the employee' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiPropertyOptional({ example: 'Michael', description: 'Middle name of the employee' })
  @IsString()
  @IsOptional()
  middleName?: string;

  @ApiProperty({ example: 'Doe', description: 'Last name of the employee' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '12345678901234', description: 'National ID number' })
  @IsString()
  @IsNotEmpty()
  nationalId: string;

  @ApiProperty({ example: 'password123', description: 'Password (minimum 6 characters)', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: 'john.doe@personal.com', description: 'Personal email address' })
  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Mobile phone number' })
  @IsOptional()
  @IsString()
  mobilePhone?: string;

  @ApiProperty({ example: 'EMP001', description: 'Employee number' })
  @IsString()
  @IsNotEmpty()
  employeeNumber: string;

  @ApiProperty({ example: '2024-01-15', description: 'Date of hire (ISO date string)' })
  @IsDateString()
  @IsNotEmpty()
  dateOfHire: string;

  @ApiPropertyOptional({ example: 'john.doe@company.com', description: 'Work email address' })
  @IsOptional()
  @IsEmail()
  workEmail?: string;
}

