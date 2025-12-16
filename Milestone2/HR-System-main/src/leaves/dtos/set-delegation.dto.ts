import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetDelegationDto {
  @ApiProperty({ description: 'Manager ID who is delegating authority', example: '507f1f77bcf86cd799439011' })
  @IsString()
  managerId: string;

  @ApiProperty({ description: 'Employee ID who will receive delegation authority', example: '507f1f77bcf86cd799439012' })
  @IsString()
  delegateId: string;

  @ApiPropertyOptional({ description: 'Start date of delegation (defaults to now)', example: '2024-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date of delegation (null = indefinite)', example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;
}

