import 'reflect-metadata';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { AuditEntry } from './AuditEntry';
export type ShiftTemplateDocument = HydratedDocument<ShiftTemplate>;

@Schema({ timestamps: true })
export class ShiftTemplate {
  @Prop({ 
    type: String, 
    enum: ["Fixed Core Hours", "Flex-Time", "Rotational", "Split", "Custom Weekly Patterns", "Overtime"],
    required: true 
  })
  name!: "Fixed Core Hours" | "Flex-Time" | "Rotational" | "Split" | "Custom Weekly Patterns" | "Overtime";

  @Prop({ 
    type: String, 
    enum: ["Normal", "Split", "Overnight", "Rotational"], 
    required: true 
  })
  type!: "Normal" | "Split" | "Overnight" | "Rotational";

  @Prop({ type: String, required: true })
  startTime!: string;

  @Prop({ type: String, required: true })
  endTime!: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: [AuditEntry], default: [] })
  auditTrail!: AuditEntry[];
}

export const ShiftTemplateSchema = SchemaFactory.createForClass(ShiftTemplate);
