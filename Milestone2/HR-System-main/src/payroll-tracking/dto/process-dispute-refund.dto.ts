import { IsNumber, IsNotEmpty, Min } from 'class-validator';

export class ProcessDisputeRefundDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0.01, { message: 'Refund amount must be greater than 0' })
  refundAmount: number;
}

