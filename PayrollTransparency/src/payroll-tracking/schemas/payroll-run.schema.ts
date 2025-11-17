import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * PayrollRun Schema - EXTERNAL REFERENCE
 * This belongs to Team 6 (Payroll Processing Subsystem)
 * We define it here only to enable .populate() in our queries
 * 
 * Note: This is a minimal schema definition. Team 6 owns the full schema.
 */

export type PayrollRunDocument = HydratedDocument<PayrollRun>;

@Schema({ collection: 'payrollruns', timestamps: true })
export class PayrollRun {
  @Prop()
  payPeriodStart?: Date;

  @Prop()
  payPeriodEnd?: Date;

  @Prop()
  status?: string;

  @Prop()
  processedDate?: Date;

  // Add any other fields you know Team 6 uses
  // This is just to enable populate - we don't control this schema
}

export const PayrollRunSchema = SchemaFactory.createForClass(PayrollRun);
