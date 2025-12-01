import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePositionDto {
  @ApiProperty({
    description: 'Unique code for the position',
    example: 'POS-ENG-001',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Title of the position',
    example: 'Senior Software Engineer',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the position',
    example: 'Responsible for developing and maintaining software applications',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'MongoDB ObjectId of the department. Either departmentId or departmentName must be provided.',
    example: '507f1f77bcf86cd799439011',
  })
  // Accept either departmentId OR departmentName (but at least one is required)
  @ValidateIf((o) => !o.departmentName)
  @IsMongoId()
  @IsNotEmpty()
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'Name of the department. Either departmentId or departmentName must be provided.',
    example: 'Engineering',
  })
  @ValidateIf((o) => !o.departmentId)
  @IsString()
  @IsNotEmpty()
  departmentName?: string;

  @ApiPropertyOptional({
    description: 'MongoDB ObjectId of the position this position reports to',
    example: '507f1f77bcf86cd799439012',
  })
  @IsMongoId()
  @IsOptional()
  reportsToPositionId?: string;

  @ApiPropertyOptional({
    description: 'MongoDB ObjectId of the employee performing this action',
    example: '507f1f77bcf86cd799439013',
  })
  @IsMongoId()
  @IsOptional()
  performedByEmployeeId?: string;
}

export class UpdatePositionDto {
  @ApiPropertyOptional({
    description: 'Title of the position',
    example: 'Senior Software Engineer',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Description of the position',
    example: 'Responsible for developing and maintaining software applications',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'MongoDB ObjectId of the department. Either departmentId or departmentName can be provided.',
    example: '507f1f77bcf86cd799439011',
  })
  // Accept either departmentId OR departmentName
  @ValidateIf((o) => !o.departmentName)
  @IsMongoId()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'Name of the department. Either departmentId or departmentName can be provided.',
    example: 'Engineering',
  })
  @ValidateIf((o) => !o.departmentId)
  @IsString()
  @IsOptional()
  departmentName?: string;

  @ApiPropertyOptional({
    description: 'MongoDB ObjectId of the position this position reports to',
    example: '507f1f77bcf86cd799439012',
  })
  @IsMongoId()
  @IsOptional()
  reportsToPositionId?: string;

  @ApiPropertyOptional({
    description: 'Whether the position is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'MongoDB ObjectId of the employee performing this action',
    example: '507f1f77bcf86cd799439013',
  })
  @IsMongoId()
  @IsOptional()
  performedByEmployeeId?: string;
}
