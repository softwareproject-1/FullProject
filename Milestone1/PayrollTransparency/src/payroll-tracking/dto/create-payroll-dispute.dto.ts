import { IsString, IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';

export class CreatePayrollDisputeDto {
  @IsMongoId()
  @IsNotEmpty()
  employee: string;

  @IsMongoId()
  @IsNotEmpty()
  payslip: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  employeeComments?: string;
}
