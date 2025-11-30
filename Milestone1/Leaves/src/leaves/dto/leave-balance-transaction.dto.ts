import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';

export enum BalanceTransactionType {
  ACCRUAL = 'accrual',
  TAKE = 'take',
  ADJUSTMENT = 'adjustment',
  ENCASHMENT = 'encashment',
  RETRO = 'retro', // Retroactive deduction (BR-19, REQ-013)
  EXPIRY = 'expiry',
  RESERVE_RELEASE = 'reserve_release',
}

export class CreateLeaveBalanceTransactionDto {
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  leaveTypeId: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number; // Positive (accrual/adjustment +) or negative (deduction)

  @IsEnum(BalanceTransactionType)
  @IsNotEmpty()
  transactionType: BalanceTransactionType;

  @IsOptional()
  @IsString()
  requestId?: string; // Origin leave request if applicable

  @IsOptional()
  @IsString()
  performedBy?: string; // User/service that performed action

  @IsOptional()
  @IsString()
  reason?: string; // Why this transaction occurred (audit trail for BR-17)

  @IsOptional()
  @IsDateString()
  createdAt?: string;
}

export default CreateLeaveBalanceTransactionDto;
