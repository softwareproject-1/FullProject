import { IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for processing dispute refund
 * Since disputes don't have a fixed amount like claims, 
 * finance staff must specify the refund amount
 */
export class ProcessDisputeRefundDto {
  @ApiProperty({
    description: 'The refund amount to process for the dispute',
    example: 500.00,
    minimum: 0.01,
  })
  @IsNumber({}, { message: 'refundAmount must be a valid number' })
  @IsPositive({ message: 'refundAmount must be a positive number' })
  refundAmount: number;
}
