import 'reflect-metadata';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { AuditEntry } from './AuditEntry';

export type VacationLinkDocument = HydratedDocument<VacationLink>;

@Schema({ timestamps: true })
export class VacationLink {
 
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true })
  employeeId!: Types.ObjectId; 

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'LeavePackage', required: true })
  leavePackageId!: Types.ObjectId; 


  @Prop({ type: Date, required: true })
  startDate!: Date;

  @Prop({ type: Date, required: true })
  endDate!: Date;


  @Prop({ type: Boolean, default: true, required: true })
  suppressAttendance!: boolean; // attendance rows ignored

  @Prop({ type: Boolean, default: true, required: true })
  suppressPenalties!: boolean;

  @Prop({
    type: String,
    enum: ['Pending', 'Applied', 'Expired'],
    default: 'Pending',
    required: true,
  })
  suppressionStatus!: | 'Pending'| 'Applied' | 'Expired'; 

  @Prop({ type: Date })
  suppressionAppliedAt?: Date; 

  @Prop({ type: Boolean, default: false, required: true })
  autoLinked!: boolean; 

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId; 

  
  @Prop({ type: [AuditEntry], default: [] })
  auditTrail!: AuditEntry[];
}

export const VacationLinkSchema = SchemaFactory.createForClass(VacationLink);
