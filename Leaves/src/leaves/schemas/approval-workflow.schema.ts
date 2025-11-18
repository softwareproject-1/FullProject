import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: true })
export class ApprovalStep {
  @Prop({ required: true })
  stepNumber: number; // 1, 2, 3, etc.

  @Prop({ required: true })
  role: string; // 'Manager', 'HR', 'Director', etc.

  @Prop({ required: true })
  position: string; // Organizational position

  @Prop({ default: false })
  canDelegate: boolean; // Can delegate to another approver
}

@Schema({ timestamps: true })
export class ApprovalWorkflow extends Document {
  @Prop({ required: true, unique: true, index: true })
  workflowId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  // Link to leave type or policy
  @Prop({ required: true })
  applicableLeaveTypes: string[]; // leaveTypeIds

  @Prop({ type: [ApprovalStep], required: true })
  steps: ApprovalStep[]; // Multi-level approval chain

  @Prop({ required: true, default: 48 })
  autoEscalateHours: number; // Auto-escalate after this many hours

  @Prop({ default: true })
  isActive: boolean; 

  @Prop({ sparse: true, default: null })
  deletedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const ApprovalWorkflowSchema = SchemaFactory.createForClass(ApprovalWorkflow);
ApprovalWorkflowSchema.index({ applicableLeaveTypes: 1, isActive: 1 });


