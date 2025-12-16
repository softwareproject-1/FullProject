import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AppraisalTemplate, AppraisalCycleStatus } from './AppraisalTemplate';

@Schema({ collection: 'AppraisalCycle', timestamps: true })
export class AppraisalCycle extends Document {
  @Prop({ type: Types.ObjectId, required: true, auto: true })
  declare _id: Types.ObjectId; // Primary Key

  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'AppraisalTemplate', required: true })
  template: Types.ObjectId; // REF (AppraisalTemplate)

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({
    type: String,
    enum: Object.values(AppraisalCycleStatus),
    default: AppraisalCycleStatus.DRAFT,
  })
  status: AppraisalCycleStatus;
}

export const AppraisalCycleSchema = SchemaFactory.createForClass(AppraisalCycle);
