import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDisputeDto {
  @IsString()
  @IsNotEmpty()
  payslipId: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}