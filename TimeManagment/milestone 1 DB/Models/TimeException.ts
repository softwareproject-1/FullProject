import 'reflect-metadata';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { AuditEntry } from './AuditEntry';

export type TimeExceptionDocument = HydratedDocument<TimeException>;

@Schema({ timestamps: true })
export class TimeException {

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true })
  employeeId!: Types.ObjectId; 

  @Prop({ type: String, enum: ['Correction', 'Overtime', 'Permission'], required: true })
  type!: 'Correction' | 'Overtime' | 'Permission';

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  referenceId?: Types.ObjectId; 


  @Prop({ type: Date, required: true })
  startTime!: Date; 

  @Prop({ type: Date, required: true })
  endTime!: Date;

  @Prop({ type: String })
  reason?: string; 

 
  @Prop({ type: Date, default: Date.now })
  requestedDate?: Date;

  @Prop({ type: String, enum: ['ESS', 'Mobile', 'Manual'], default: 'ESS' })
  submittedVia?: 'ESS' | 'Mobile' | 'Manual';

 
  @Prop({
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Escalated'],
    default: 'Pending',
    required: true,
  })
  status!: 'Pending' | 'Approved' | 'Rejected' | 'Escalated'; 

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  approverId?: Types.ObjectId; 

  @Prop({ type: Date })
  approvedAt?: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  escalatedTo?: Types.ObjectId; 

  @Prop({ type: Date })
  escalatedAt?: Date;

  @Prop({ type: Date })
  deadlineDate?: Date; 

  @Prop({ type: String })
  rejectionReason?: string;

  @Prop({ type: String })
  comments?: string; 

  
  @Prop({ type: String, enum: ['EarlyIn', 'LateOut', 'OutOfHours', 'Total'] })
  permissionType?: 'EarlyIn' | 'LateOut' | 'OutOfHours' | 'Total'; // BR-TM-16

  // Reference to Policy schema (replaces PermissionPolicy)
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Policy' })
  policyId?: Types.ObjectId;

  @Prop({ type: Date })
  contractStartDate?: Date; 

  @Prop({ type: Date })
  probationEndDate?: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  financialPeriodId?: Types.ObjectId;

  @Prop({ type: String, enum: ['Valid', 'Invalid', 'Pending'], default: 'Pending' })
  validationStatus?: 'Valid' | 'Invalid' | 'Pending';

  
  @Prop({ type: String, enum: ['Applied', 'Pending', 'NotApplied'], default: 'Pending' })
  payrollImpact?: 'Applied' | 'Pending' | 'NotApplied';

  @Prop({ type: String, enum: ['Applied', 'Pending', 'NotApplied'], default: 'Pending' })
  benefitsImpact?: 'Applied' | 'Pending' | 'NotApplied';

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  payrollRecordId?: Types.ObjectId;

  
  @Prop({ type: [AuditEntry], default: [] })
  auditTrail!: AuditEntry[]; // BR-TM-24
}

export const TimeExceptionSchema = SchemaFactory.createForClass(TimeException);


