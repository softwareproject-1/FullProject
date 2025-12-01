import 'reflect-metadata';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type SyncLogDocument = HydratedDocument<SyncLog>;

@Schema({ timestamps: true })
export class SyncLog {
  // ba check anhy model el anddo el verified attendance 
  @Prop({ type: String, enum: ['Payroll', 'Leaves', 'Benefits'], required: true })
  module!: 'Payroll' | 'Leaves' | 'Benefits'; //cross module sync 


  @Prop({ type: Date, default: Date.now })
  syncDate!: Date; 

  @Prop({ type: String, enum: ['NightlyJob', 'OnDemand'], default: 'NightlyJob' })
  triggerSource!: 'NightlyJob' | 'OnDemand'; 

  @Prop({ type: String, enum: ['Daily', 'Weekly', 'Monthly'], default: 'Daily' })
  syncFrequency!: 'Daily' | 'Weekly' | 'Monthly'; // Scheduling 

  @Prop({ type: Date })
  nextScheduledSync?: Date;


  @Prop({ type: Number, default: 0, min: 0 })
  recordsSynced!: number; // no of attendance records transferred

  @Prop({ type: Number, default: 0, min: 0 })
  recordsFailed!: number; 

  
  @Prop({
    type: String,
    enum: ['Success', 'Partial', 'Failed'],
    default: 'Success',
    required: true,
  })
  status!: 'Success' | 'Partial' | 'Failed';

  @Prop({ type: String })
  errorDetails?: string; //for tracing errors

 
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  initiatedBy?: Types.ObjectId; // HR admin/ it lw manual

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  validationBatchId?: Types.ObjectId; 
}

export const SyncLogSchema = SchemaFactory.createForClass(SyncLog);
