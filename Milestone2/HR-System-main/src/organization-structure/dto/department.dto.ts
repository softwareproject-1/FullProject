import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({
    description: 'Unique code for the department',
    example: 'DEPT-ENG',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Name of the department',
    example: 'Engineering',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the department',
    example: 'Engineering department responsible for software development',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'MongoDB ObjectId of the head position for this department',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  @IsOptional()
  headPositionId?: string;

  @ApiPropertyOptional({
    description: 'MongoDB ObjectId of the employee performing this action',
    example: '507f1f77bcf86cd799439013',
  })
  @IsMongoId()
  @IsOptional()
  performedByEmployeeId?: string;
}

export class UpdateDepartmentDto {
  @ApiPropertyOptional({
    description: 'Name of the department',
    example: 'Engineering',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the department',
    example: 'Engineering department responsible for software development',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'MongoDB ObjectId of the head position for this department',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  @IsOptional()
  headPositionId?: string;

  @ApiPropertyOptional({
    description: 'MongoDB ObjectId of the employee performing this action',
    example: '507f1f77bcf86cd799439013',
  })
  @IsMongoId()
  @IsOptional()
  performedByEmployeeId?: string;
}

