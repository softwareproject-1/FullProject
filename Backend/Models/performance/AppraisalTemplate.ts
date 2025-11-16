import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// enums
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
