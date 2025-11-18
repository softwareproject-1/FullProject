import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

//payroll depends on it and time management
//payroll , time management can be external system
//action can b

@Schema({ timestamps: true })
export class IntegrationLog extends Document {
  @Prop({ required: true, unique: true, index: true })
  logId: string;

  @Prop({
    required: true,
    enum: ['leaveRequest', 'leaveBalance', 'leaveTransaction', 'offboarding'],
    index: true,
  })
  entityType: string; // What entity is being synced

  @Prop({ required: true, type: Types.ObjectId, index: true })
  entityId: Types.ObjectId; // The document being synced

  @Prop({
    required: true,
    enum: ['PAYROLL', 'TIME_MANAGEMENT', 'OTHER'],
    index: true,
  })
  externalSystem: string; // Target external system

  @Prop({ sparse: true })
  payloadSummary?: string; // Hash or summary of payload sent

  @Prop({
    required: true,
    enum: ['pending', 'sent', 'success', 'failed'],
    default: 'pending',
    index: true,
  })
  status: string; // Current sync status

  @Prop({
    required: false,
    enum: ['block_attendance', 'unblock_attendance', 'encashment', 'update_balance', 'generic'],
    index: true,
    default: 'generic',
  })
  action?: string; // Explicit operation for downstream workers

  @Prop({ sparse: true })
  externalId?: string; // ID returned by external system

  @Prop({ required: true, default: 0 })
  attempts: number; // Number of retry attempts

  @Prop({ type: Date, sparse: true })
  lastAttemptAt?: Date; // Last time sync was attempted

  @Prop({ sparse: true })
  lastError?: string; // Error message if failed

  @Prop({ type: Date, default: () => new Date() })
  createdAt: Date;

  updatedAt: Date;
}

export const IntegrationLogSchema = SchemaFactory.createForClass(IntegrationLog);

// Indexes for efficient querying
IntegrationLogSchema.index({ entityId: 1, externalSystem: 1 });
IntegrationLogSchema.index({ status: 1, externalSystem: 1 });
IntegrationLogSchema.index({ lastAttemptAt: 1, status: 1 }); // For retry jobs
IntegrationLogSchema.index({ action: 1, status: 1 });
IntegrationLogSchema.index({ createdAt: -1 }); // For audit


