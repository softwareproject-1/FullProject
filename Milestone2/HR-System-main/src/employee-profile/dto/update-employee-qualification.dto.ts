import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { GraduationType } from '../enums/employee-profile.enums';

export class UpdateEmployeeQualificationDto {
  @IsOptional()
  @IsString()
  employeeProfileId?: string;

  @IsOptional()
  @IsString()
  establishmentName?: string;

  @IsOptional()
  @IsEnum(GraduationType)
  graduationType?: GraduationType;
}

