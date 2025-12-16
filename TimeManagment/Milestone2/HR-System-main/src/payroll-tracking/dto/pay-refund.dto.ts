import { IsMongoId, IsNotEmpty } from 'class-validator';

// This DTO defines the data expected when the finance staff pays a refund.
export class PayRefundDto {

  // REQ-PY-20 (M2 Plan) requires a payrollRunId to link the payment.
  @IsMongoId({ message: 'payrollRunId must be a valid MongoDB ID.' })
  @IsNotEmpty({ message: 'payrollRunId is required for processing the payment.' })
  payrollRunId: string;
}