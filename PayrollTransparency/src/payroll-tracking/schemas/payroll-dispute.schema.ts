import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PayrollDisputeDocument = PayrollDispute & Document;

export enum DisputeStatus {
  SUBMITTED = 'Submitted',
  UNDER_REVIEW = 'UnderReview',
  MANAGER_APPROVED = 'ManagerApproved',
  REJECTED = 'Rejected',
  RESOLVED = 'Resolved',
}

@Schema({ timestamps: true })
export class PayrollDispute {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Employee' })
  employee: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Payslip' })
  payslip: Types.ObjectId;

  @Prop({ required: true, type: String })
  reason: string;

  @Prop({ type: String })
  employeeComments: string;

  @Prop({
    type: String,
    enum: Object.values(DisputeStatus),
    default: DisputeStatus.SUBMITTED,
    required: true,
  })
  status: DisputeStatus;

  @Prop({ type: Date, default: Date.now })
  submittedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBySpecialist: Types.ObjectId;

  @Prop({ type: String })
  specialistComments: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedByManager: Types.ObjectId;

  @Prop({ type: String })
  managerComments: string;

  @Prop({ type: Types.ObjectId, ref: 'Refund' })
  refund: Types.ObjectId;
}

export const PayrollDisputeSchema = SchemaFactory.createForClass(PayrollDispute);

// Add indexes for common queries
PayrollDisputeSchema.index({ employee: 1, status: 1 });
PayrollDisputeSchema.index({ payslip: 1 });
PayrollDisputeSchema.index({ submittedAt: -1 });
