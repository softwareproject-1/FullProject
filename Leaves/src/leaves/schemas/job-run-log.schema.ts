import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class JobRunLog extends Document {
  @Prop({ required: true, unique: true, index: true })
  runId: string;

  @Prop({ required: true, enum: ['year_end', 'carry_forward', 'accrual_run', 'cleanup', 'other'] })
  runType: string;

  @Prop({ required: true })
  period: string; // e.g., '2024', '2024-12', '2024-Q4'

  @Prop({ type: Types.ObjectId, ref: 'User', sparse: true })
  executedBy?: Types.ObjectId; // user that triggered the run (null for system)

  @Prop({ type: Date, default: () => new Date() })
  startedAt: Date;

  @Prop({ type: Date, sparse: true })
  finishedAt?: Date;

  @Prop({ required: true, enum: ['running', 'success', 'failed', 'partial'] , default: 'running'})
  status: string;

  @Prop({ type: Object, sparse: true })
  summary?: any; // Small JSON summary of actions taken (counts, totals)

  @Prop({ type: Object, sparse: true })
  errorss?: any; // Error details if failed

  createdAt: Date;
  updatedAt: Date;
}

export const JobRunLogSchema = SchemaFactory.createForClass(JobRunLog);
JobRunLogSchema.index({ runType: 1, period: 1 });
JobRunLogSchema.index({ startedAt: -1 });
