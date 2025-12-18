import { IsNotEmpty, IsString, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';
import { ConfigStatus } from '../../enums/payroll-configuration-enums';

export class CreateSigningBonusDto {
  @IsNotEmpty()
  @IsString()
  positionName: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsEnum(ConfigStatus)
  status?: ConfigStatus;
}

