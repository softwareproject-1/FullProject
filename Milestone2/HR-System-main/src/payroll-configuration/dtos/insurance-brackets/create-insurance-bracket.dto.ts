import {
  IsString,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ConfigStatus } from '../../enums/payroll-configuration-enums';

export class CreateInsuranceBracketDto {
  @IsString()
  name: string;

  // @IsNumber()
  // @Min(0)
  // amount: number;

  @IsNumber()
  minSalary: number;

  @IsNumber()
  maxSalary: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  employeeRate: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  employerRate: number;

  // @IsOptional()
  // @IsEnum(ConfigStatus)
  // status?: ConfigStatus;
}
