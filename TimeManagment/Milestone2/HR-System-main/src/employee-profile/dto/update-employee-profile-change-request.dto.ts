import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { ProfileChangeStatus } from '../enums/employee-profile.enums';

export class UpdateEmployeeProfileChangeRequestDto {
  @IsOptional()
  @IsString()
  requestId?: string;

  @IsOptional()
  @IsString()
  employeeProfileId?: string;

  @IsOptional()
  @IsString()
  requestDescription?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(ProfileChangeStatus)
  status?: ProfileChangeStatus;

  @IsOptional()
  @IsDateString()
  submittedAt?: string;

  @IsOptional()
  @IsDateString()
  processedAt?: string;
}

