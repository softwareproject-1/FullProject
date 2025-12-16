import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveStatus } from '../enums/leave-status.enum';

export class ReviewLeaveRequestDto {
  @ApiProperty({ description: 'HR Admin ID who is reviewing', example: '507f1f77bcf86cd799439011' })
  @IsString()
  hrId: string;

  @ApiProperty({ description: 'Review status', enum: LeaveStatus, example: LeaveStatus.APPROVED })
  @IsEnum(LeaveStatus)
  status: LeaveStatus;

  @ApiPropertyOptional({ description: 'Override reason if HR overrides manager decision', example: 'Manager decision overridden due to policy compliance' })
  @IsOptional()
  @IsString()
  overrideReason?: string;
}

