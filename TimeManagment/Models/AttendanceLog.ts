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


@Schema({ _id: false })
export class ClockEvent {
  @Prop({ type: Date, required: true })
  time!: Date;

  @Prop({ type: String, enum: ["In", "Out"], required: true })
  type!: "In" | "Out";

  @Prop({ type: String, default: "Device" })
  source!: string; 
}


@Schema({ _id: false })
export class RoundingRules {
  @Prop({ type: Number, default: 5 }) // minutes
  interval!: number;

  @Prop({ type: String, enum: ["Nearest", "Ceiling", "Floor"], default: "Nearest" })
  mode!: "Nearest" | "Ceiling" | "Floor";

  @Prop({ type: Boolean, default: false })
  alignToShiftStart!: boolean;

  @Prop({ type: Boolean, default: false })
  alignToShiftEnd!: boolean;
}


@Schema({ timestamps: true })
export class AttendanceLog {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true })
  employee!: Types.ObjectId;

  
  @Prop({ type: [ClockEvent], default: [] })
  clockEvents!: ClockEvent[];

  
  @Prop({ type: Date })
  clockIn?: Date;

  @Prop({ type: Date })
  clockOut?: Date;

  @Prop({ type: Date, required: true })
  date!: Date;

  @Prop({
    type: String,
    enum: ["Present", "Absent", "OnLeave", "Holiday"],
    default: "Present",
  })
  status!: "Present" | "Absent" | "OnLeave" | "Holiday";

  @Prop({ type: Penalties, default: {} })
  penalties!: Penalties;

  @Prop({ type: Number, default: 0 })
  overtimeHours!: number;

  
  @Prop({
    type: String,
    enum: ["FirstInLastOut", "MultiplePairs"],
    default: "FirstInLastOut",
  })
  calculationMode!: "FirstInLastOut" | "MultiplePairs";

  
  @Prop({ type: RoundingRules, default: {} })
  rounding!: RoundingRules;

  @Prop({ type: Boolean, default: false })
  leaveBlock!: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User" })
  createdBy?: Types.ObjectId;

  @Prop({ type: [AuditEntry], default: [] })
  auditTrail!: AuditEntry[];
}

export const AttendanceLogSchema = SchemaFactory.createForClass(AttendanceLog);
