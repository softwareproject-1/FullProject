import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateLeaveAdjustmentDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  leaveTypeId: string;

  @IsNumber()
  @IsNotEmpty()
  adjustmentAmount: number; // positive or negative

  @IsString()
  @IsNotEmpty()
  reason: string; // Justification for adjustment

  @IsOptional()
  @IsString()
  transactionType?: string; // 'adjustment', 'retro', etc.
}

export default CreateLeaveAdjustmentDto;
