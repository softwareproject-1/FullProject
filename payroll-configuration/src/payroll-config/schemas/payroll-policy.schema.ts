import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PayrollPolicyDocument = PayrollPolicy & Document;

@Schema({ timestamps: true })
export class PayrollPolicy {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['Monthly', 'BiWeekly'] })
  payCycle: string;

  @Prop({ required: true })
  payDate: number;
}

export const PayrollPolicySchema = SchemaFactory.createForClass(PayrollPolicy);
