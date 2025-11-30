import { IsOptional, IsMongoId, IsNumber, IsString, IsDate, IsObject, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PayslipDataDto } from './create-payslip.dto';

export class UpdatePayslipDto {
  @IsMongoId()
  @IsOptional()
  employee?: string;

  @IsMongoId()
  @IsOptional()
  payrollRunId?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  payDate?: Date;

  @IsNumber()
  @Min(0)
  @IsOptional()
  salary?: number;

  @IsObject()
  @ValidateNested()
  @Type(() => PayslipDataDto)
  @IsOptional()
  payslipData?: PayslipDataDto;

  @IsString()
  @IsOptional()
  documentUrl?: string;
}
