//import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { AccrualMethod } from '../enums/accrual-method.enum';
import { IsEnum, IsNumber, IsOptional, IsBoolean , IsString } from 'class-validator';

export class AccrualPolicyDto {
  @IsString()
  leaveTypeCode: string;

 @IsEnum(AccrualMethod, { message: 'accrualRate must be a valid AccrualMethod' })
  accrualRate: AccrualMethod;

  @IsNumber()
  carryOverCap: number;

  @IsString()
  resetDateType: string; // e.g. 'HireDate', 'WorkAnniversary'

  @IsBoolean()
  pauseDuringUnpaid: boolean;

  @IsOptional()
  @IsNumber()
  accrualStartAfterMonths?: number;

  @IsOptional()
  @IsBoolean()
  isProrated?: boolean;
}
