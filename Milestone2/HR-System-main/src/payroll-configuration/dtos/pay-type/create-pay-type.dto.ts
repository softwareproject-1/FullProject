import { IsNotEmpty, IsString, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';
import { ConfigStatus } from '../../enums/payroll-configuration-enums';

export class CreatePayTypeDto {
  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(6000)
  amount: number;

  // @IsOptional()
  // @IsEnum(ConfigStatus)
  // status?: ConfigStatus;
}
