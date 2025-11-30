import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PayslipDetailDocument = PayslipDetail & Document;

@Schema({ timestamps: true })
export class PayslipDetail {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'PayrollRun',
    required: true,
  })
  payrollRun: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  })
  employee: MongooseSchema.Types.ObjectId;

  // --- EARNINGS ---

  @Prop({ type: Number, required: true, default: 0 })
  baseSalary: number;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {},
  })
  allowances: {
    transportation?: number;
    housing?: number;
    [key: string]: number | undefined;
  };

  @Prop({ type: Number, default: 0 })
  overtimePay: number;

  @Prop({ type: Number, default: 0 })
  signingBonus: number;

  @Prop({ type: Number, default: 0 })
  severancePay: number;

  @Prop({ type: Number, default: 0 })
  refunds: number;

  @Prop({ type: Number, required: true, default: 0 })
  grossSalary: number;

  @Prop({ type: Number, default: 0 })
  leaveDeductions: number;

  @Prop({ type: Number, default: 0 })
  timePenalties: number;

  @Prop({ type: Number, default: 0 })
  taxDeduction: number;

  @Prop({ type: Number, default: 0 })
  insuranceDeduction: number;

  @Prop({ type: Number, required: true, default: 0 })
  totalDeductions: number;

  @Prop({ type: Number, required: true, default: 0 })
  netSalary: number;

  @Prop({
    type: String,
    enum: ['Pending', 'Calculated', 'Paid', 'Error'],
    default: 'Pending',
  })
  status: string;
}

export const PayslipDetailSchema = SchemaFactory.createForClass(PayslipDetail);

// Add indexes for better query performance
PayslipDetailSchema.index({ payrollRun: 1, employee: 1 }, { unique: true });
PayslipDetailSchema.index({ employee: 1 });
