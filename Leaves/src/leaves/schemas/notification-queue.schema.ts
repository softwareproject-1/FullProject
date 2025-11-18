import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';



@Schema({ timestamps: true })
export class NotificationQueue extends Document {
  @Prop({ required: true, unique: true, index: true })
  queueId: string;

  @Prop({ type: Types.ObjectId, ref: 'LeaveRequest', required: true, index: true })
  requestId: Types.ObjectId; // Associated leave request

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  targetUserId: Types.ObjectId; // Who receives this notification

  @Prop({
    required: true,
    enum: ['approval_reminder', 'escalation', 'notification'],
    index: true,
  })
  type: string; // Type of notification/escalation

  @Prop({ required: true, type: Date, index: true })
  scheduledAt: Date; // When to send (for scheduling)

  @Prop({ type: Date, sparse: true })
  sentAt?: Date; // When actually sent

  @Prop({
    required: true,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending',
    index: true,
  })
  status: string; // Current status

  @Prop({ required: true, default: 0 })
  attempts: number; // Number of retry attempts

  @Prop({ sparse: true })
  lastError?: string; // Error message if failed

  @Prop({ type: Date, default: () => new Date() })
  createdAt: Date;

  updatedAt: Date;
}

export const NotificationQueueSchema =
  SchemaFactory.createForClass(NotificationQueue);

// Indexes for efficient querying
NotificationQueueSchema.index({ requestId: 1, targetUserId: 1 });
NotificationQueueSchema.index({ scheduledAt: 1, status: 1 }); // For background job queries
NotificationQueueSchema.index({ status: 1, type: 1 }); // For filtering pending notifications
NotificationQueueSchema.index({ createdAt: -1 }); // For audit

