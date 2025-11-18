import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOffboardingSettlementDto {
  @IsString()
  @IsNotEmpty()
  settlementId: string;

  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsArray()
  @IsOptional()
  balanceSnapshot?: any[];

  @IsNumber()
  @IsOptional()
  encashedDays?: number;

  @IsNumber()
  @IsOptional()
  encashmentAmount?: number;

  @IsNumber()
  @IsOptional()
  deductedDays?: number;

  @IsOptional()
  @IsString()
  processedBy?: string;

  @IsOptional()
  @IsNumber()
  dailySalaryRateAtSettlement?: number;

  @IsOptional()
  @IsNumber()
  encashmentCapDays?: number;
}

export default CreateOffboardingSettlementDto;
