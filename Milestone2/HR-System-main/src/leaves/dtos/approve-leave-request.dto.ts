import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveStatus } from '../enums/leave-status.enum';

export class ApproveLeaveRequestDto {
  @ApiProperty({ description: 'Manager ID who is approving (can be delegate ID)', example: '507f1f77bcf86cd799439011' })
  @IsString()
  managerId: string;

  @ApiProperty({ description: 'Approval status', enum: LeaveStatus, example: LeaveStatus.APPROVED })
  @IsEnum(LeaveStatus)
  status: LeaveStatus;

  @ApiPropertyOptional({ description: 'Reason for approval/rejection', example: 'Approved - within policy' })
  @IsOptional()
  @IsString()
  reason?: string;
}

