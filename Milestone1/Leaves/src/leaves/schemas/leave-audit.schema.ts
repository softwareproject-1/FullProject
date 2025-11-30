import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class LeaveAudit extends Document {
  @Prop({ required: true, unique: true, index: true })
  auditId: string;

  @Prop({
    required: true,
    enum: ['balance', 'request', 'transaction'],
    index: true,
  })
  targetType: string; // What was changed

  @Prop({ required: true, type: Types.ObjectId, index: true })
  targetId: Types.ObjectId; // ID of the document that changed

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  changedBy: Types.ObjectId; // User who made the change

  @Prop({ type: Object, sparse: true })
  before?: any; // Snapshot before change

  @Prop({ type: Object, sparse: true })
  after?: any; // Snapshot after change

  @Prop({ required: true })
  reason: string; // Justification/explanation for change

  @Prop({ type: Date, default: () => new Date() })
  createdAt: Date;

  updatedAt: Date;
}

export const LeaveAuditSchema = SchemaFactory.createForClass(LeaveAudit);

// Indexes for efficient querying
LeaveAuditSchema.index({ targetId: 1, createdAt: -1 }); // For audit trail of single entity
LeaveAuditSchema.index({ changedBy: 1, createdAt: -1 }); // Track changes by user
LeaveAuditSchema.index({ targetType: 1, createdAt: -1 }); // Filter by entity type
