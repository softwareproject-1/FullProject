import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RefundDocument = Refund & Document;

export enum RefundStatus {
  PENDING = 'Pending',
  PROCESSED = 'Processed',
}

@Schema({ timestamps: true })
export class Refund {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Employee' })
  employee: Types.ObjectId;

  @Prop({ required: true, type: Number, min: 0 })
  amount: number;

  @Prop({ required: true, type: String })
  reason: string;

  @Prop({ type: Types.ObjectId, ref: 'PayrollDispute' })
  sourceDispute: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ExpenseClaim' })
  sourceClaim: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(RefundStatus),
    default: RefundStatus.PENDING,
    required: true,
  })
  status: RefundStatus;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'PayrollRun' })
  processedInPayrollRun: Types.ObjectId;
}

export const RefundSchema = SchemaFactory.createForClass(Refund);

// Add indexes for common queries
RefundSchema.index({ employee: 1, status: 1 });
RefundSchema.index({ status: 1, createdAt: -1 });
RefundSchema.index({ sourceDispute: 1 });
RefundSchema.index({ sourceClaim: 1 });
