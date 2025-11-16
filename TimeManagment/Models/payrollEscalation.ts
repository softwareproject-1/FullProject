import 'reflect-metadata';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { AuditEntry } from './AuditEntry';

export type PayrollEscalationDocument = HydratedDocument<PayrollEscalation>;

@Schema({ timestamps: true })
export class PayrollEscalation {

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true })
  employeeId!: Types.ObjectId; 

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  requestId!: Types.ObjectId; 

  @Prop({ type: String, enum: ['TimeException', 'Permission'], required: true })
  requestType!: 'TimeException' | 'Permission'; 

  @Prop({ type: Date, required: true })
  escalationDate!: Date; 

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  escalatedTo!: Types.ObjectId; //manager aw admin

  
  @Prop({ type: String, enum: ['Pending', 'Resolved'], default: 'Pending', required: true })
  status!: 'Pending' | 'Resolved';

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  resolvedBy?: Types.ObjectId; //tracking

  @Prop({ type: Date })
  resolvedAt?: Date;

  @Prop({ type: String })
  notes?: string;

  // Audit ----------------------------------------------------------------------
  @Prop({ type: [AuditEntry], default: [] })
  auditTrail!: AuditEntry[];
}

export const PayrollEscalationSchema = SchemaFactory.createForClass(PayrollEscalation);

