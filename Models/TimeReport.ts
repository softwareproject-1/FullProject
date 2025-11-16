import 'reflect-metadata';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { AuditEntry } from './AuditEntry';

export type TimeReportDocument = HydratedDocument<TimeReport>;

@Schema({ timestamps: true })
export class TimeReport {
 
  @Prop({
    type: String,
    enum: ['Overtime', 'Exceptions', 'Lateness', 'AttendanceSummary'],
    required: true,
  })
  reportType!: 'Overtime' | 'Exceptions' | 'Lateness' | 'AttendanceSummary'; 

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  generatedBy!: Types.ObjectId; // HR or Payroll accountability


  @Prop({ type: Object, default: {} })
  parameters!: Record<string, any>; 

 
  @Prop({ type: [String], default: [] })
  exportFormats!: string[]; 

  @Prop({ type: Object, default: {} })
  filePaths!: Record<string, string>; 


  @Prop({ type: [AuditEntry], default: [] })
  auditTrail!: AuditEntry[]; 
}

export const TimeReportSchema = SchemaFactory.createForClass(TimeReport);

