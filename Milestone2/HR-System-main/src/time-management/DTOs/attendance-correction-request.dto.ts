import { IsMongoId, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CorrectionRequestStatus } from '../models/enums/index';

export class CreateAttendanceCorrectionRequestDto {
  @ApiProperty({ description: 'Employee ID', example: '692c8d144f91641d7db3e521' })
  @IsMongoId()
  employeeId: string;

  @ApiProperty({ description: 'Attendance record ID', example: '692d6215e560a13dcc80eacb' })
  @IsMongoId()
  attendanceRecord: string;

  @ApiPropertyOptional({ description: 'Reason for correction request', example: 'Forgot to punch in' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdateAttendanceCorrectionRequestDto {
  @ApiProperty({ description: 'Request status', enum: CorrectionRequestStatus })
  @IsEnum(CorrectionRequestStatus)
  status: CorrectionRequestStatus;

  @ApiPropertyOptional({ description: 'Reason for correction request', example: 'Approved by manager' })
  @IsString()
  @IsOptional()
  reason?: string;
}

