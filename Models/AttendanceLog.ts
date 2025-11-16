import 'reflect-metadata';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { AuditEntry } from './AuditEntry';
export type AttendanceLogDocument = HydratedDocument<AttendanceLog>;

@Schema({ _id: false })
export class Penalties {
  @Prop({ type: Number, default: 0 })
  latenessMinutes!: number;

  @Prop({ type: Number, default: 0 })
  deductionAmount!: number;
}



@Schema({ timestamps: true })
export class AttendanceLog {
  @Prop({ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Employee", 
    required: true 
  })
  employee!: Types.ObjectId;

  @Prop({ type: Date })
  clockIn?: Date;

  @Prop({ type: Date })
  clockOut?: Date;

  @Prop({ type: Date, required: true })
  date!: Date;

  @Prop({ 
    type: String, 
    enum: ["Present", "Absent", "OnLeave", "Holiday"], 
    default: "Present" 
  })
  status!: "Present" | "Absent" | "OnLeave" | "Holiday";

  @Prop({ type: Penalties, default: {} })
  penalties!: Penalties;

  @Prop({ type: Number, default: 0 })
  overtimeHours!: number;

  @Prop({ type: Boolean, default: false })
  leaveBlock!: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: [AuditEntry], default: [] })
  auditTrail!: AuditEntry[];
}

export const AttendanceLogSchema = SchemaFactory.createForClass(AttendanceLog);

