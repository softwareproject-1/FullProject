import { IsDateString, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DeactivateEntityDto {
  @ApiPropertyOptional({
    description: 'MongoDB ObjectId of the employee performing this action',
    example: '507f1f77bcf86cd799439013',
  })
  @IsMongoId()
  @IsOptional()
  performedByEmployeeId?: string;

  @ApiPropertyOptional({
    description: 'End date for deactivation in ISO 8601 format',
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Reason for deactivation',
    example: 'Department restructuring',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

