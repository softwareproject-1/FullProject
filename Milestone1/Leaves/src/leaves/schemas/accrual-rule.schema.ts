import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: true })
export class AccrualRule extends Document {
  @Prop({ required: true, unique: true, index: true })
  ruleId: string;

  @Prop({ required: true })
  name: string; // e.g., 'Monthly Accrual', 'Yearly Accrual'

  @Prop({
    required: true,
    enum: ['monthly', 'quarterly', 'yearly'],
  })
  frequency: string; // How often accrual happens

  @Prop({ required: true })
  rate: number; // Days accrued per period

  @Prop({
    required: true,
    enum: ['none', 'arithmetic', 'ceil', 'floor'],
  })
  roundingMethod: string; // How to round accrual values

  @Prop({ required: true, default: 45 })
  maxCarryoverDays: number; // Maximum carry-forward days

  @Prop({ required: true, default: 1 })
  carryoverExpiryYears: number; // Years before expiry

  @Prop({ required: true, default: false })
  suspendDuringUnpaidLeave: boolean; // Pause accrual during unpaid leave

  @Prop({ default: true })
  isActive: boolean; //pause accrual during unpaid leave

  //criterion date 
  @Prop({ sparse: true, default: null })
  deletedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const AccrualRuleSchema = SchemaFactory.createForClass(AccrualRule);
AccrualRuleSchema.index({ frequency: 1, isActive: 1 });




