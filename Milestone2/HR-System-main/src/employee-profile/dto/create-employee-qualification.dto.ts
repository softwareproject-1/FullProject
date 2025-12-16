import {
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { GraduationType } from '../enums/employee-profile.enums';

export class CreateEmployeeQualificationDto {
  @IsString()
  @IsNotEmpty()
  employeeProfileId: string;

  @IsString()
  @IsNotEmpty()
  establishmentName: string;

  @IsEnum(GraduationType)
  @IsNotEmpty()
  graduationType: GraduationType;
}

