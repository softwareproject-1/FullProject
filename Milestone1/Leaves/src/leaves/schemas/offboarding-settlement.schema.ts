import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

//payrollintegrationLogId reference payroll
@Schema({ timestamps: true })
export class OffboardingSettlement extends Document {
  @Prop({ required: true, unique: true, index: true })
  settlementId: string;

  @Prop({ required: true, index: true })
  employeeId: string;

  @Prop({ type: Object, required: true })
  balanceSnapshot: any; // snapshot of leave balances at time of offboarding

  @Prop({ required: true, default: 0 })
  encashedDays: number; // days converted to cash

  @Prop({ required: true, default: 0 })
  encashmentAmount: number; // computed money amount

  @Prop({ required: true, default: 0 })
  deductedDays: number; // days deducted from balances as termination policy

  @Prop({ type: Types.ObjectId, ref: 'User', sparse: true })
  processedBy?: Types.ObjectId;

  @Prop({ type: Date, default: () => new Date() })
  processedAt: Date;

  @Prop({ sparse: true })
  payrollIntegrationLogId?: string; // link to IntegrationLog record for payroll

  @Prop({ sparse: true })
  notes?: string;

  // Persist inputs used to compute encashment for auditability
  @Prop({ required: false })
  dailySalaryRateAtSettlement?: number;

  @Prop({ required: false, default: 30 })
  encashmentCapDays?: number; // cap used when calculating encashment (default 30)

  @Prop({ required: false })
  computedEncashmentAmount?: number; // result of the calculation

  createdAt: Date;
  updatedAt: Date;
}

export const OffboardingSettlementSchema = SchemaFactory.createForClass(OffboardingSettlement);
OffboardingSettlementSchema.index({ employeeId: 1, processedAt: -1 });
OffboardingSettlementSchema.index({ settlementId: 1 });

