import { IsNotEmpty, IsMongoId, IsNumber, IsString, IsDate, IsObject, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PayslipDataDto {
  @IsNumber()
  @Min(0)
  grossEarnings: number;

  @IsNumber()
  @Min(0)
  totalDeductions: number;

  @IsNumber()
  @Min(0)
  netPay: number;

  @IsDate()
  @Type(() => Date)
  payPeriodStart: Date;

  @IsDate()
  @Type(() => Date)
  payPeriodEnd: Date;
}

export class CreatePayslipDto {
  @IsMongoId()
  @IsNotEmpty()
  employee: string;

  @IsMongoId()
  @IsNotEmpty()
  payrollRunId: string;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  payDate: Date;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  salary: number;

  @IsObject()
  @ValidateNested()
  @Type(() => PayslipDataDto)
  @IsNotEmpty()
  payslipData: PayslipDataDto;

  @IsString()
  @IsNotEmpty()
  documentUrl: string;
}
