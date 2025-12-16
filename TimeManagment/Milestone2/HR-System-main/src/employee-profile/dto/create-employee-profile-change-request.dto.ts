import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ProfileChangeStatus } from '../enums/employee-profile.enums';

export class CreateEmployeeProfileChangeRequestDto {
  @IsString()
  @IsNotEmpty()
  requestId: string;

  @IsString()
  @IsNotEmpty()
  employeeProfileId: string;

  @IsString()
  @IsNotEmpty()
  requestDescription: string;

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

