import { IsString, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';
import { ConfigStatus } from '../../enums/payroll-configuration-enums';

export class CreateTerminationBenefitsDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  terms?: string;

  // @IsOptional()
  // @IsEnum(ConfigStatus)
  // status?: ConfigStatus;
}
