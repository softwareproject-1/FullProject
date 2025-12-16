import 'reflect-metadata';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { AuditEntry } from './AuditEntry';

export type HolidayCalendarDocument = HydratedDocument<HolidayCalendar>;

@Schema({ timestamps: true })
export class HolidayCalendar {

  @Prop({ type: String, required: true })
  name!: string; 

  @Prop({
    type: String,
    enum: ['National', 'Organizational', 'WeeklyRest','Other'],
    required: true,
  })
  type!: 'National' | 'Organizational' | 'WeeklyRest'|'Other'; 


  @Prop({ type: Date, required: true })
  date!: Date; 

  @Prop({ type: Boolean, default: false })
  recurring?: boolean; // True lw el holiday maadha sabet anually

  
  @Prop({ type: String })
  description?: string; // Optional explanation lel holiday

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId; // (who added/updated)


  @Prop({ type: [AuditEntry], default: [] })
  auditTrail!: AuditEntry[]; 
}

export const HolidayCalendarSchema = SchemaFactory.createForClass(HolidayCalendar);



