import 'reflect-metadata';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { AuditEntry } from './AuditEntry';
export type AttendanceCorrectionRequestDocument = HydratedDocument<AttendanceCorrectionRequest>;


@Schema({ timestamps: true })
export class AttendanceCorrectionRequest {
  @Prop({ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Employee", 
    required: true 
  })
  employee!: Types.ObjectId;

  @Prop({ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "AttendanceLog", 
    required: true 
  })
  logToCorrect!: Types.ObjectId;

  @Prop({ type: Date })
  requestedClockIn?: Date;

  @Prop({ type: Date })
  requestedClockOut?: Date;

  @Prop({ type: String })
  reason?: string;

  @Prop({ 
    type: String, 
    enum: ["Pending", "Approved", "Rejected"], 
    default: "Pending" 
  })
  status!: "Pending" | "Approved" | "Rejected";

  @Prop({ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Employee" 
  })
  manager?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: [AuditEntry], default: [] })
  auditTrail!: AuditEntry[];
}

export const AttendanceCorrectionRequestSchema = SchemaFactory.createForClass(AttendanceCorrectionRequest);
