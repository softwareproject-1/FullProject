import { IsString, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class DateRangeDto {
  @ApiProperty({ description: 'Start date', example: '2024-01-01' })
  from: Date;

  @ApiProperty({ description: 'End date', example: '2024-01-15' })
  to: Date;
}

export class RetroactiveDeductionDto {
  @ApiProperty({ description: 'Employee ID', example: '507f1f77bcf86cd799439011' })
  @IsString()
  employeeId: string;

  @ApiProperty({ description: 'Leave type ID', example: '507f1f77bcf86cd799439012' })
  @IsString()
  leaveTypeId: string;

  @ApiProperty({ description: 'Date range for retroactive deduction', type: DateRangeDto })
  @IsObject()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dates: { from: Date; to: Date };

  @ApiProperty({ description: 'Reason for retroactive deduction', example: 'Unapproved absence detected' })
  @IsString()
  reason: string;
}

