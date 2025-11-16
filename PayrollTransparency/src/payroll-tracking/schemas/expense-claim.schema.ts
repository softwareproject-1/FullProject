import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Define the ClaimStatus enum for clarity and type safety
export enum ClaimStatus {
  Submitted = 'Submitted',
  UnderReview = 'UnderReview',
  ManagerApproved = 'ManagerApproved',
  Rejected = 'Rejected',
  Processed = 'Processed',
}

// Define the ClaimType enum
export enum ClaimType {
  Travel = 'Travel',
  Meals = 'Meals',
  Supplies = 'Supplies',
  Other = 'Other',
}

// Extend Document to give the schema Mongoose methods
@Schema({ timestamps: true, collection: 'ExpenseClaims' })
export class ExpenseClaim extends Document {
  // --- References (ObjectIds) ---

  // -> REF: Team 1 (Employee) - Links to the submitting employee
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employee: Types.ObjectId;

  // -> REF: Team 7 (Refund) - Link to the refund, if one is processed (Phase 4)
  @Prop({ type: Types.ObjectId, ref: 'Refund', default: null })
  refund: Types.ObjectId;

  // -> REF: Team 1 (User) - Payroll Specialist who reviewed (from REQ-PY-39)
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  reviewedBySpecialist: Types.ObjectId;

  // --- Core Claim Details ---

  @Prop({
    type: String,
    enum: Object.values(ClaimType),
    required: true,
  })
  claimType: ClaimType;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true })
  claimDate: Date;

  @Prop({ required: true })
  receiptUrl: string;

  // --- Workflow Status ---

  @Prop({
    type: String,
    enum: Object.values(ClaimStatus),
    default: ClaimStatus.Submitted,
    required: true,
  })
  status: ClaimStatus;

  @Prop({ default: Date.now })
  submittedAt: Date;
}

// Create the Mongoose Schema object from the class
export const ExpenseClaimSchema = SchemaFactory.createForClass(ExpenseClaim);
