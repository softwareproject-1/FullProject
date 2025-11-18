import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

//last payroll sync date
//last time management sync date references time management
//encashed days reference offboarding
@Schema({ timestamps: true })
export class LeaveBalance extends Document {
  @Prop({ required: true, index: true })
  employeeId: string; // Reference to employee

  @Prop({ type: Types.ObjectId, ref: 'LeaveType', required: true, index: true })
  leaveTypeId: Types.ObjectId; // Reference to LeaveType

  @Prop({ sparse: true })
  vacationPackageCode: string; // Reference to VacationPackage

  // Entitlement
  @Prop({ required: true, default: 0 })
  entitledDays: number; // Days employee is entitled to

  // Accrual information
  @Prop({ required: true, default: 0 })
  accruedDays: number; // Total accrued days

  @Prop({ required: true, default: 0 })
  accrualActualValue: number; // Pre-rounded accrual value

  @Prop({ required: true, default: 0 })
  accrualRoundedValue: number; // Post-rounded accrual value

  @Prop({ type: Date, sparse: true })
  lastAccrualDate: Date; // Last date accrual was processed

  @Prop({ required: false, default: 0 })
  accrualRate?: number; // Days per accrual period (e.g., 1.5 days/month)

  @Prop({ required: false, enum: ['monthly', 'quarterly', 'annual', 'one-time'], default: 'monthly' })
  accrualFrequency?: string; // Frequency used for accrual runs

  @Prop({ type: Date, sparse: true })
  nextAccrualAt?: Date; // Planned next accrual run

  @Prop({ type: Date, sparse: true })
  accrualPausedUntil?: Date; // If accrual is paused (e.g., unpaid leave)

  // Usage
  @Prop({ required: true, default: 0 })
  takenDays: number; // Days already taken/used

  @Prop({ required: true, default: 0 })
  pendingDays: number; // Days in pending approval

  @Prop({ required: true, default: 0 })
  availableBalance: number; // Remaining available balance

  // Carry-forward and adjustments
  @Prop({ required: true, default: 0 })
  carriedForwardDays: number; // Days carried from previous period

  @Prop({ required: true, default: 0 })
  encashedDays: number; // Days converted to payment

  @Prop({ required: false, default: 0 })
  maxBalanceCap?: number; // Absolute cap for this balance (enforce at year-end)

  // Reset information
  @Prop({
    required: true,
    enum: ['hireDate', 'firstVacation', 'revisedHireDate', 'workReceivingDate'],
  })
  resetCriteria: string; // When/how balance resets

  @Prop({ type: Date, required: true })
  lastResetDate: Date; // Last balance reset date

  @Prop({ default: false })
  suspended: boolean; // Is accrual suspended (unpaid leave, etc.)

  // Special tracking for specific leave types
  @Prop({ required: false, default: 0 })
  sickLeave3YearCumulative: number; // Cumulative sick leave (3-year cycle, max 360 days)

  @Prop({ required: false, default: 0 })
  maternityLeaveCount: number; // Track number of times maternity leave taken

  @Prop({ required: true, default: 0 })
  reservedDays: number; // Days temporarily reserved by pending requests

  @Prop({ type: [Types.ObjectId], ref: 'LeaveRequest', default: [] })
  pendingRequests: Types.ObjectId[]; // Pending request refs to prevent double-booking

  @Prop({ type: [Types.ObjectId], ref: 'LeaveBalanceTransaction', default: [] })
  lastTransactions: Types.ObjectId[]; // Small recent transaction refs

  createdAt: Date;
  updatedAt: Date;

  @Prop({ type: Date, sparse: true })
  lastPayrollSyncDate: Date; // When last synced to payroll

  @Prop({ type: Date, sparse: true })
  lastTimeManagementSyncDate: Date; // When last synced to time management
  
  @Prop({ required: false })
  expiryMonths?: number; // Months until unused days expire

  @Prop({ required: false, default: false })
  carryForwardAllowed?: boolean; // Whether carry-forward is allowed for this balance

  @Prop({ required: false, default: 0 })
  carryForwardCap?: number; // Max days allowed to carry forward
  
}

export const LeaveBalanceSchema = SchemaFactory.createForClass(LeaveBalance);

// Indexes for common queries
LeaveBalanceSchema.index({ employeeId: 1, leaveTypeId: 1 }, { unique: true });
LeaveBalanceSchema.index({ employeeId: 1, lastResetDate: -1 });
LeaveBalanceSchema.index({ suspended: 1 });
LeaveBalanceSchema.index({ employeeId: 1, pendingRequests: 1 });