import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
//timeManagement sync and payroll integration

//payroll paycode

@Schema({ timestamps: true })
export class LeaveType extends Document {
  @Prop({ required: true, unique: true, index: true })
  typeId: string; // Unique code for leave type

  @Prop({ required: true })
  name: string; // Annual, Sick, Maternity, Mission, Marriage, etc.

  @Prop({ required: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'LeaveCategory', required: true, index: true })
  categoryId: Types.ObjectId; // Reference to LeaveCategory

  @Prop({ sparse: true })
  paycode: string; // Link to Payroll paycode 

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object, default: {} })
  meta: Record<string, any>; // Free-form metadata

  @Prop({ sparse: true, default: null })
  deletedAt: Date; // soft-delete

  createdAt: Date;
  updatedAt: Date;
  @Prop({ required: true, default: 0 })
  accrualActualValue: number; // Pre-rounded

  @Prop({ required: true, default: 0 })
  accrualRoundedValue: number; // Post-rounded

  // Accrual & carry-forward policy defaults for this leave type
  @Prop({ required: false, default: 0 })
  accrualRate?: number; // default days accrued per accrual period

  @Prop({ required: false, enum: ['monthly', 'quarterly', 'annual', 'one-time'], default: 'monthly' })
  accrualFrequency?: string;

  @Prop({ required: false, default: 0 })
  expiryMonths?: number; // months until unused days expire for this leave type

  @Prop({ required: false, enum: ['none', 'limited', 'unlimited'], default: 'limited' })
  carryForwardPolicy?: string;

  @Prop({ required: false, default: 0 })
  carryForwardMaxDays?: number;


}

export const LeaveTypeSchema = SchemaFactory.createForClass(LeaveType);
LeaveTypeSchema.index({ categoryId: 1, isActive: 1 });
LeaveTypeSchema.index({ typeId: 1 });


