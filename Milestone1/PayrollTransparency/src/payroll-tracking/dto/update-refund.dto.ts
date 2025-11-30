import { IsEnum, IsOptional, IsMongoId } from 'class-validator';
import { RefundStatus } from '../schemas/refund.schema';

export class UpdateRefundDto {
  @IsEnum(RefundStatus)
  @IsOptional()
  status?: RefundStatus;

  @IsMongoId()
  @IsOptional()
  processedInPayrollRun?: string;
}
