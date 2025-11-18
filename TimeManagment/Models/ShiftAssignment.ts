import 'reflect-metadata';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { AuditEntry } from './AuditEntry';
export type ShiftAssignmentDocument = HydratedDocument<ShiftAssignment>;

@Schema({ timestamps: true })
export class ShiftAssignment {
  @Prop({ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Employee", 
    required: true 
  })
  employee!: Types.ObjectId;
   @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "Position"
  })
  position?: Types.ObjectId;

  
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department"
  })
  department?: Types.ObjectId;


  @Prop({ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "ShiftTemplate", 
    required: true 
  })
  shiftTemplate!: Types.ObjectId;

  @Prop({ type: Date, required: true })
  startDate!: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ 
    type: String, 
    enum: ["Approved", "Cancelled", "Entered", "Expired", "Postponed", "Rejected", "Submitted"],
    required: true
  })
  status!: "Approved" | "Cancelled" | "Entered" | "Expired" | "Postponed" | "Rejected" | "Submitted";

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: [AuditEntry], default: [] })
  auditTrail!: AuditEntry[];
}

export const ShiftAssignmentSchema = SchemaFactory.createForClass(ShiftAssignment);
