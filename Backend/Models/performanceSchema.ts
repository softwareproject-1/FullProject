import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// enum

export enum AppraisalCycleStatus {
  DRAFT = 'Draft',
  ACTIVE = 'Active',
  CLOSED = 'Closed',
}

export enum AppraisalStatus {
  PENDING = 'Pending',
  SELF_ASSESSMENT_COMPLETE = 'SelfAssessmentComplete',
  MANAGER_REVIEW_COMPLETE = 'ManagerReviewComplete',
  PUBLISHED = 'Published',
  DISPUTED = 'Disputed',
}

@Schema({ collection: 'AppraisalTemplate', timestamps: true })
export class AppraisalTemplate extends Document {
  @Prop({ type: Types.ObjectId, required: true, auto: true })
  declare _id: Types.ObjectId; // Primary Key

  @Prop({ required: true })
  name: string;

  @Prop({
    type: [
      {
        title: { type: String, required: true },
        description: { type: String },
      },
    ],
    default: [],
  })
  criteria: {
    title: string;
    description?: string;
  }[];

  @Prop({
    type: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      labels: [{ type: String }],
    },
    required: true,
  })
  ratingScale: {
    min: number;
    max: number;
    labels: string[];
  };
}

export const AppraisalTemplateSchema = SchemaFactory.createForClass(AppraisalTemplate);

// appraisal cycle

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
  //ype: String,enum: Object.values(AppraisalCycleStatus),default: AppraisalCycleStatus.DRAFT
  @Prop({
    type: String,
    enum: Object.values(AppraisalCycleStatus),
    default: AppraisalCycleStatus.DRAFT,
  })
  status: AppraisalCycleStatus;
}

export const AppraisalCycleSchema = SchemaFactory.createForClass(AppraisalCycle);

@Schema({ collection: 'PerformanceAppraisal', timestamps: true })
export class PerformanceAppraisal extends Document {
  @Prop({ type: Types.ObjectId, required: true, auto: true })
  declare _id: Types.ObjectId; // Primary Key

  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employee: Types.ObjectId; // REF  (Employee)

  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  manager: Types.ObjectId; // REF (Employee)

  @Prop({ type: Types.ObjectId, ref: 'AppraisalCycle', required: true })
  cycle: Types.ObjectId; // REF  (AppraisalCycle)

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
