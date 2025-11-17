import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum OfferStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  EXPIRED = 'Expired'
}

export enum EmploymentType {
  FULL_TIME = 'Full-Time',
  PART_TIME = 'Part-Time',
  CONTRACT = 'Contract',
  INTERNSHIP = 'Internship'
}

@Schema({ timestamps: true })
export class Offer extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Application', required: true })
  applicationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Candidate', required: true })
  candidateId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'JobPosting', required: true })
  jobId: Types.ObjectId;

  @Prop({ required: true })
  offerAmount: number;

  @Prop({ default: 0 })
  signingBonus: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  position: string;

  @Prop()
  department: string;

  @Prop({ type: String, enum: EmploymentType, default: EmploymentType.FULL_TIME })
  employmentType: EmploymentType;

  @Prop()
  probationPeriod: number; // in months

  @Prop({ type: [String] })
  benefits: string[];

  @Prop({ type: String, enum: OfferStatus, default: OfferStatus.DRAFT })
  status: OfferStatus;

  @Prop()
  sentDate: Date;

  @Prop()
  expiryDate: Date;

  @Prop()
  responseDate: Date;

  @Prop()
  signedOfferUrl: string;

  @Prop()
  offerLetterTemplate: string;

  @Prop()
  approvedBy: string;

  @Prop()
  approvalDate: Date;

  @Prop()
  notes: string;
}

export const OfferSchema = SchemaFactory.createForClass(Offer);