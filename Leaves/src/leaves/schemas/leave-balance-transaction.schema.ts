import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
//full referance to payroll
//amount refernece offboarding settlement
@Schema({ timestamps: true })
export class LeaveBalanceTransaction extends Document {
  @Prop({ required: true, unique: true, index: true })
  transactionId: string;

  @Prop({ required: true, index: true })
  employeeId: string; // Reference to employee

  @Prop({ type: Types.ObjectId, ref: 'LeaveType', required: true, index: true })
  leaveTypeId: Types.ObjectId;

  @Prop({ required: true })
  amount: number; // Positive (accrual) or negative (deduction)

  @Prop({
    required: true,
    enum: ['accrual', 'take', 'adjustment', 'encashment', 'retro', 'reserve_release'],
    index: true,
  })
  transactionType: string; // Type of balance change

  @Prop({ type: Types.ObjectId, ref: 'LeaveRequest', sparse: true })
  requestId?: Types.ObjectId; // Origin leave request if applicable

  @Prop({ type: Types.ObjectId, ref: 'User', sparse: true })
  performedBy?: Types.ObjectId; // User who performed action (null for system-automated)

  @Prop({ sparse: true })
  reason?: string; // Why this transaction occurred

  @Prop({ type: Date, default: () => new Date() })
  createdAt: Date;

  updatedAt: Date;
}

export const LeaveBalanceTransactionSchema =
  SchemaFactory.createForClass(LeaveBalanceTransaction);

// Indexes for efficient querying
LeaveBalanceTransactionSchema.index({ employeeId: 1, leaveTypeId: 1, createdAt: -1 });
LeaveBalanceTransactionSchema.index({ requestId: 1 });
LeaveBalanceTransactionSchema.index({ performedBy: 1, transactionType: 1 });
LeaveBalanceTransactionSchema.index({ transactionType: 1, createdAt: -1 });
