import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Enums for Anomaly Type and Status
export enum AnomalyType {
  MISSING_BANK_DETAILS = 'MissingBankDetails',
  NEGATIVE_NET_PAY = 'NegativeNetPay',
  RETROACTIVE_ADJUSTMENT = 'RetroactiveAdjustmentNeeded',
  UNEXPECTED_DEDUCTION = 'UnexpectedDeduction',
  OTHER = 'Other',
}

export enum AnomalyStatus {
  OPEN = 'Open',
  RESOLVED = 'Resolved',
  IGNORED = 'Ignored',
}

export type PayrollAnomalityDocument = PayrollAnomality & Document;

/**
 * AnomalyModel (PayrollAnomality)
 * Purpose: To track and manage data exceptions generated during payslip calculation.
 * Assigned To: Member 3 (Rahma)
 */
@Schema({ timestamps: true, collection: 'payrollAnomalies' })
export class PayrollAnomality {
  // We use the default MongoDB _id for anomalyId

  @Prop({ type: Types.ObjectId, required: true, index: true, ref: 'PayrollRun' })
  payrollRun: Types.ObjectId; // REF: Team 6 (PayrollRun)

  @Prop({ type: Types.ObjectId, required: true, index: true, ref: 'Employee' })
  employee: Types.ObjectId; // REF: Team 1 (Employee)

  @Prop({ type: String, enum: AnomalyType, required: true })
  type: AnomalyType; // Reason for the flag

  @Prop({ type: String, enum: AnomalyStatus, default: AnomalyStatus.OPEN })
  status: AnomalyStatus; // Current state

  @Prop({ type: String })
  resolutionNotes: string; // Notes detailing the action taken by the Payroll Manager

  @Prop({ type: Types.ObjectId, ref: 'User' })
  resolvedBy: Types.ObjectId; // REF: Team 1 (User) - HR/Payroll Manager who resolved it
}

export const PayrollAnomalitySchema = SchemaFactory.createForClass(PayrollAnomality);