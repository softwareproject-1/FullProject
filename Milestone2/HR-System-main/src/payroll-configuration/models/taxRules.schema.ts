import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { EmployeeProfile as Employee } from '../../employee-profile/models/employee-profile.schema';
import { ConfigStatus } from '../enums/payroll-configuration-enums';

export type taxRulesDocument = HydratedDocument<taxRules>;

@Schema({ timestamps: true })
export class taxRules {
  @Prop({ required: true })
  name: string;
  @Prop()
  description?: string;
  @Prop({
    required: true,
    enum: ['Single Rate', 'Progressive Brackets', 'Flat Rate with Exemption'],
  })
  taxType: 'Single Rate' | 'Progressive Brackets' | 'Flat Rate with Exemption';
  @Prop({ required: true, min: 0 })
  rate: number; // tax rate in percentage
  @Prop({ min: 0 })
  exemptionAmount?: number; // tax-free amount
  @Prop({ min: 0 })
  thresholdAmount?: number; // income threshold
  @Prop([
    {
      minIncome: { type: Number, required: true, min: 0 },
      maxIncome: { type: Number, required: true, min: 0 },
      rate: { type: Number, required: true, min: 0 },
    },
  ])
  brackets?: { minIncome: number; maxIncome: number; rate: number }[]; // for progressive brackets

  @Prop({
    required: true,
    type: String,
    enum: ConfigStatus,
    default: ConfigStatus.DRAFT,
  })
  status: ConfigStatus; // draft, approved, rejected

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Employee.name })
  createdBy?: mongoose.Types.ObjectId;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Employee.name })
  approvedBy?: mongoose.Types.ObjectId;
  @Prop({})
  approvedAt?: Date;
}

export const taxRulesSchema = SchemaFactory.createForClass(taxRules);
