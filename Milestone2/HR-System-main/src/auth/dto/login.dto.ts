import { IsString, IsNotEmpty, IsOptional, ValidateIf, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiPropertyOptional({ 
    example: '12345678901234', 
    description: 'National ID (required if workEmail and personalEmail are not provided)' 
  })
  @ValidateIf((o) => !o.workEmail && !o.personalEmail)
  @IsString()
  @IsNotEmpty()
  nationalId?: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ 
    example: 'john.doe@company.com', 
    description: 'Work email (required if nationalId and personalEmail are not provided)' 
  })
  @ValidateIf((o) => !o.nationalId && !o.personalEmail)
  @IsOptional()
  @IsEmail()
  @IsString()
  workEmail?: string;

  @ApiPropertyOptional({ 
    example: 'john.doe@personal.com', 
    description: 'Personal email (required if nationalId and workEmail are not provided)' 
  })
  @ValidateIf((o) => !o.nationalId && !o.workEmail)
  @IsOptional()
  @IsEmail()
  @IsString()
  personalEmail?: string;
}

