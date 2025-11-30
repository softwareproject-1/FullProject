import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class HolidayCalendar extends Document {
  @Prop({ required: true, unique: true, index: true })
  eventId: string;

  @Prop({
    required: true,
    enum: ['holiday', 'blocked_period'],
  })
  type: string; // Holiday or blocked period

  @Prop({ required: true })
  name: string; // e.g., 'New Year', 'Exam Period'
  
  @Prop({ required: true })
  netnonWorkingDays: number; 
  

  @Prop({ sparse: true })
  description: string;

  @Prop({ required: true, index: true })
  startDate: Date;

  @Prop({ required: true, index: true })
  endDate: Date;

  @Prop({ required: true, default: 'all' })
  locationScope: string; // 'all', country code, or region

  @Prop([String])
  affectsLeaveTypes: string[]; // leaveTypeIds - leave types affected by this

  @Prop({ required: true, default: true })
  excludeFromLeaveCounting: boolean; // Should be excluded from leave day count

  @Prop({ sparse: true })
  reason: string; // e.g., 'Government closure', 'Company exams period'

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ sparse: true, default: null })
  deletedAt: Date;

  createdAt: Date;
  updatedAt: Date;
   @Prop({ default: false })
   isManuallyAdjusted: boolean;

   @Prop({ sparse: true })
   manualAdjustmentReason: string;


}

export const HolidayCalendarSchema = SchemaFactory.createForClass(HolidayCalendar);
HolidayCalendarSchema.index({ startDate: 1, endDate: 1, type: 1 });
HolidayCalendarSchema.index({ locationScope: 1, isActive: 1 });


