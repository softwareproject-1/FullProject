import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Enums for Action Type
export enum ActionType {
  RUN_REJECTION = 'RunRejection',
  MANUAL_DATA_EDIT = 'ManualDataEdit',
  CYCLE_UNFREEZE = 'CycleUnfreeze',
}

export type CycleAdjustmentDocument = CycleAdjustment & Document;

/**
 * CycleAdjustment Model
 * Purpose: To maintain a robust, mandatory audit trail (BR 17) for high-impact administrative
 * actions, ensuring traceability and accountability.
 * Assigned To: Member 3 (Rahma)
 */
@Schema({ timestamps: true, collection: 'cycleAdjustments' })
export class CycleAdjustment {
  // MongoDB automatically creates the primary key field '_id', which serves as the adjustmentId.

  @Prop({ type: String, enum: ActionType, required: true })
  actionType: ActionType; // The critical action performed

  @Prop({ type: Types.ObjectId, required: true, index: true, ref: 'PayrollRun' })
  payrollRun: Types.ObjectId; // Link to the run affected by the action (REF: Team 6 PayrollRun)

  @Prop({ type: String, required: true })
  justification: string; // MANDATORY TEXT FIELD. The specified reason for the action.

  @Prop({ type: Date, default: Date.now })
  actionDate: Date; // Timestamp of the action

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  actor: Types.ObjectId; // REF: Team 1 (User) - User who performed the action
}

export const CycleAdjustmentSchema = SchemaFactory.createForClass(CycleAdjustment);