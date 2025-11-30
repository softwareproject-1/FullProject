import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateLeaveBalanceDto {
  @IsString()
  employeeId: string;

  @IsString()
  leaveTypeId: string;

  @IsNumber()
  @IsOptional()
  entitledDays?: number;

  @IsNumber()
  @IsOptional()
  accruedDays?: number;

  @IsNumber()
  @IsOptional()
  takenDays?: number;

  @IsNumber()
  @IsOptional()
  availableBalance?: number;

  @IsNumber()
  @IsOptional()
  reservedDays?: number;

  @IsNumber()
  @IsOptional()
  maxBalanceCap?: number;

  @IsNumber()
  @IsOptional()
  carryForwardCap?: number;

  @IsString()
  @IsOptional()
  resetCriteria?: string;
}

export class UpdateLeaveBalanceDto {
  @IsNumber()
  @IsOptional()
  availableBalance?: number;

  @IsNumber()
  @IsOptional()
  takenDays?: number;

  @IsNumber()
  @IsOptional()
  reservedDays?: number;

  @IsNumber()
  @IsOptional()
  accruedDays?: number;

  @IsNumber()
  @IsOptional()
  carriedForwardDays?: number;

  @IsNumber()
  @IsOptional()
  maxBalanceCap?: number;
}

export default CreateLeaveBalanceDto;
