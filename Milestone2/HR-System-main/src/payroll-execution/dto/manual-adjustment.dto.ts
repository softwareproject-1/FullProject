// src/payroll-execution/dto/manual-adjustment.dto.ts
import { IsNumber, IsString, IsEnum, IsOptional, Min } from 'class-validator';

export enum AdjustmentType {
  BONUS = 'BONUS',
  DEDUCTION = 'DEDUCTION'
}

export class ManualAdjustmentDto {
  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @IsEnum(AdjustmentType)
  type: AdjustmentType;

  @IsString()
  @IsOptional()
  reason?: string;
}