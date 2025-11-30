import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

//payroll sync status
//timeSyncstatus in time management
//start date reference time management
//referance to employee from other subsystems
@Schema({ _id: true })
export class Attachment {
  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ type: Date, default: () => new Date() })
  uploadedAt: Date;
}

@Schema({ _id: true })
export class ApprovalRecord {
  @Prop({ required: true })
  stepNumber: number;

  @Prop({ required: true })
  approverId: string; // User ID

  @Prop({ required: true })
  approverRole: string; // Manager, HR, Director, etc.

  @Prop({
    required: true,
    enum: ['approved', 'rejected', 'delegated', 'overridden'],
  })
  action: string;

  @Prop({ sparse: true })
  reason: string; // Reason for rejection/override

  @Prop({ default: false })
  isOverride: boolean;

  @Prop({ sparse: true })
  overrideReason: string;

  @Prop({ type: Date, default: () => new Date() })
  timestamp: Date;
}

@Schema({ timestamps: true })
export class LeaveRequest extends Document {
  @Prop({ required: true, unique: true, index: true })
  requestId: string;

  @Prop({ required: true, index: true })
  employeeId: string; // Reference to employee

  @Prop({ type: Types.ObjectId, ref: 'entitlement', required: true, index: true})
  ruleId: Types.ObjectId; // Reference to entitlement

  @Prop({ type: Types.ObjectId, ref: 'LeaveType', required: true, index: true })
  leaveTypeId: Types.ObjectId;

  // Leave dates and duration
  @Prop({ required: true, index: true })
  startDate: Date;

  @Prop({ required: true, index: true })
  endDate: Date;

  @Prop({ required: true })
  requestedDays: number; // Raw days requested

  @Prop({ required: true })
  netDays: number; // Days excluding weekends/holidays

  // Request details
  @Prop({ required: true })
  justification: string;

  @Prop({ type: [Attachment], default: [] })
  attachments: Attachment[]; // Supporting documents

  // Request status
  @Prop({
    required: true,
    enum: [
      'Submitted',
      'PendingManager',
      'ManagerApproved',
      'ManagerRejected',
      'HRApproved',
      'HRRejected',
      'Finalized',
      'Canceled',
    ],
    default: 'Submitted',
    index: true,
  })
  status: string;

  @Prop({ default: false })
  isPostLeaveRequest: boolean; // Submitted after leave taken

  @Prop({ type: Date, sparse: true })
  modificationsAllowedUntil: Date; // Deadline to modify request

  // Approval workflow
  @Prop({ type: [ApprovalRecord], default: [] })
  approvalRecords: ApprovalRecord[]; // Embedded approval history

  // Overlap and conflict checking
  @Prop({ default: false })
  hasOverlapWithApprovedLeave: boolean;

  @Prop([String])
  overlappingLeaveRequestIds: string[]; // IDs of overlapping requests team conflicts

  // Finalization
  @Prop({ sparse: true })
  finalizedBy: string; // HR user ID who finalized
  @Prop({ sparse: true })
  gracePeriod: number; 

  @Prop({ sparse: true })
  finalizedAt: Date;

  @Prop({ default: false })
  exceedsEntitlement: boolean;

  @Prop({ default: 0 })
  convertedToUnpaidDays: number;

  @Prop({ enum: ['pending','sent','success','failed'], default: 'pending' })
  payrollSyncStatus: string;

  @Prop({ enum: ['pending','sent','success','failed'], default: 'pending' })
  timeSyncStatus: string;

  @Prop({ type: Types.ObjectId, ref: 'User', sparse: true, default: null })
  currentApprover: Types.ObjectId;

  @Prop({ type: Date, sparse: true })
  processedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', sparse: true })
  calculatedBy?: Types.ObjectId; // service/user who calculated netDays

  createdAt: Date;
  updatedAt: Date;
}

export const LeaveRequestSchema = SchemaFactory.createForClass(LeaveRequest);

// Indexes for efficient querying
LeaveRequestSchema.index({ employeeId: 1, startDate: 1, endDate: 1 });
LeaveRequestSchema.index({ employeeId: 1, status: 1 });
LeaveRequestSchema.index({ leaveTypeId: 1, status: 1 });
LeaveRequestSchema.index({ status: 1, createdAt: -1 });
LeaveRequestSchema.index({ 'approvalRecords.approverId': 1, status: 1 });
LeaveRequestSchema.index({ currentApprover: 1, status: 1 });

