import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AppraisalStatus } from './AppraisalTemplate';

@Schema({ collection: 'PerformanceAppraisal', timestamps: true })
export class PerformanceAppraisal extends Document {
  @Prop({ type: Types.ObjectId, required: true, auto: true })
  declare _id: Types.ObjectId; // Primary Key

  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employee: Types.ObjectId; // REF (Employee)

  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  manager: Types.ObjectId; // REF (Employee)

  @Prop({ type: Types.ObjectId, ref: 'AppraisalCycle', required: true })
  cycle: Types.ObjectId; // REF (AppraisalCycle)

  @Prop({
    type: String,
    enum: Object.values(AppraisalStatus),
    default: AppraisalStatus.PENDING,
  })
  status: AppraisalStatus;

  @Prop({
    type: [
      {
        criteria: { type: String, required: true },
        rating: { type: Number, min: 1, max: 5, required: true },
        comment: { type: String },
      },
    ],
    default: [],
  })
  managerRatings: {
    criteria: string;
    rating: number;
    comment?: string;
  }[];

  @Prop({
    type: [
      {
        criteria: { type: String, required: true },
        comment: { type: String },
      },
    ],
    default: [],
  })
  employeeSelfAssessment: {
    criteria: string;
    comment: string;
  }[];

  @Prop()
  finalRating?: number;

  @Prop()
  disputeReason?: string; // Used if status = 'Disputed'

  @Prop({
    type: {
      totalWorkingDays: { type: Number, default: 0 },
      presentDays: { type: Number, default: 0 },
      absences: { type: Number, default: 0 },
      lateArrivals: { type: Number, default: 0 },
      earlyLeaves: { type: Number, default: 0 },
    },
    default: {},
  })
  attendanceSummary: {
    totalWorkingDays: number;
    presentDays: number;
    absences: number;
    lateArrivals: number;
    earlyLeaves: number;
  };
}

export const PerformanceAppraisalSchema = SchemaFactory.createForClass(PerformanceAppraisal);
