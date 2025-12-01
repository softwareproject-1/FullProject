import { IsString, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class DateRangeDto {
  @ApiProperty({ description: 'Start date', example: '2024-01-01' })
  from: Date;

  @ApiProperty({ description: 'End date', example: '2024-01-15' })
  to: Date;
}

export class SubmitLeaveRequestDto {
  @ApiProperty({ description: 'Employee ID', example: '507f1f77bcf86cd799439011' })
  @IsString()
  employeeId: string;

  @ApiProperty({ description: 'Leave type ID', example: '507f1f77bcf86cd799439012' })
  @IsString()
  leaveTypeId: string;

  @ApiProperty({ description: 'Leave date range', type: DateRangeDto })
  @IsObject()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dates: { from: Date; to: Date };

  @ApiProperty({ description: 'Justification for leave request', example: 'Family emergency' })
  @IsString()
  justification: string;

  @ApiPropertyOptional({ description: 'Attachment ID for supporting documents', example: '507f1f77bcf86cd799439013' })
  @IsOptional()
  @IsString()
  attachmentId?: string;
}

