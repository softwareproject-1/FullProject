import 'reflect-metadata';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type PolicyDocument = HydratedDocument<Policy>;

@Schema({ timestamps: true })
export class Policy {
  // ==================== Basic Policy Information ====================
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String })
  description?: string;

  // Policy type/category
  @Prop({
    type: String,
    enum: ['Attendance', 'Overtime', 'Lateness', 'ShortTime', 'Comprehensive'],
    default: 'Comprehensive',
  })
  policyType?: 'Attendance' | 'Overtime' | 'Lateness' | 'ShortTime' | 'Comprehensive';

  // Effective dates
  @Prop({ type: Date, required: true })
  effectiveFrom!: Date;

  @Prop({ type: Date })
  effectiveTo?: Date;

  // Policy status
  @Prop({
    type: String,
    enum: ['Active', 'Inactive', 'Draft'],
    default: 'Active',
  })
  status!: 'Active' | 'Inactive' | 'Draft';

  // Applicability - can be applied to specific departments, employee groups, or all
  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'Department', default: [] })
  applicableDepartmentIds!: Types.ObjectId[];

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'Employee', default: [] })
  applicableEmployeeGroupIds!: Types.ObjectId[];

  @Prop({ type: Boolean, default: true })
  appliesToAll!: boolean; // If true, applies to all employees

  // ==================== BR-TM-10: Overtime Configuration ====================
  // Standard overtime rate
  @Prop({ type: Number })
  overtimeStandardRate?: number; // Multiplier (e.g., 1.5x, 2x)

  // Weekend overtime rate (BR-TM-10)
  @Prop({ type: Number })
  overtimeWeekendRate?: number;

  // Holiday overtime rate (BR-TM-10)
  @Prop({ type: Number })
  overtimeHolidayRate?: number;

  // Minimum hours before overtime applies
  @Prop({ type: Number, default: 0 })
  overtimeMinimumHours?: number;

  // Pre-approval required (BR-TM-10)
  @Prop({ type: Boolean, default: false })
  overtimeRequiresPreApproval!: boolean;

  // Overtime approval workflow configuration
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  overtimeDefaultApproverId?: Types.ObjectId;

  // Calculation logic: 'daily' or 'weekly'
  @Prop({ type: String, enum: ['daily', 'weekly'], default: 'daily' })
  overtimeCalculationBasis?: 'daily' | 'weekly';

  // Weekend work allowed (BR-TM-10)
  @Prop({ type: Boolean, default: false })
  weekendWorkAllowed!: boolean;

  // Weekend work requires approval
  @Prop({ type: Boolean, default: true })
  weekendWorkRequiresApproval!: boolean;

  // Holiday work requires approval
  @Prop({ type: Boolean, default: true })
  holidayWorkRequiresApproval!: boolean;

  // ==================== BR-TM-10: Short Time Configuration ====================
  // Penalty rate for short time
  @Prop({ type: Number })
  shortTimePenaltyRate?: number;

  // Minimum required hours per day
  @Prop({ type: Number })
  shortTimeMinimumRequiredHours?: number;

  // Threshold before penalty applies (in minutes)
  @Prop({ type: Number, default: 0 })
  shortTimePenaltyThresholdMinutes?: number;

  // Whether short time requires approval
  @Prop({ type: Boolean, default: false })
  shortTimeRequiresApproval!: boolean;

  // ==================== BR-TM-09, BR-TM-11: Lateness Rules ====================
  // Grace period in minutes (BR-TM-09, BR-TM-11)
  @Prop({ type: Number, default: 0 })
  latenessGracePeriodMinutes!: number;

  // Primary lateness threshold in minutes (BR-TM-09)
  @Prop({ type: Number })
  latenessThresholdMinutes?: number;

  // Penalty per minute after threshold (BR-TM-11)
  @Prop({ type: Number })
  latenessPenaltyPerMinute?: number;

  // Maximum penalty per occurrence
  @Prop({ type: Number })
  latenessMaxPenaltyPerOccurrence?: number;

  // Escalation thresholds (BR-TM-09)
  @Prop({ type: [Number], default: [] })
  latenessEscalationThresholds!: number[]; // e.g., [15, 30, 60] minutes

  // Automatic deduction enabled (BR-TM-11)
  @Prop({ type: Boolean, default: true })
  latenessAutomaticDeductionEnabled!: boolean;

  // ==================== BR-TM-12: Repeated Lateness Handling ====================
  // Number of occurrences to trigger flagging
  @Prop({ type: Number })
  repeatedLatenessOccurrenceThreshold?: number;

  // Time period for tracking (in days)
  @Prop({ type: Number })
  repeatedLatenessTrackingPeriodDays?: number;

  // Escalation threshold (number of occurrences)
  @Prop({ type: Number })
  repeatedLatenessEscalationThreshold?: number;

  // Auto-escalate to HR Manager
  @Prop({ type: Boolean, default: false })
  repeatedLatenessAutoEscalate!: boolean;

  // Escalation recipient
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  repeatedLatenessEscalationRecipientId?: Types.ObjectId;

  // Disciplinary action triggers
  @Prop({ type: [Number], default: [] })
  repeatedLatenessDisciplinaryActionThresholds!: number[]; // e.g., [5, 10, 15] occurrences

  // ==================== BR-TM-08, BR-TM-09: Shift-based Clock-in Restrictions ====================
  // Early clock-in allowed (in minutes before shift start)
  @Prop({ type: Number, default: 0 })
  clockInEarlyAllowedMinutes?: number;

  // Late clock-in allowed (in minutes after shift start)
  @Prop({ type: Number })
  clockInLateAllowedMinutes?: number;

  // Restrict early clock-in based on shift
  @Prop({ type: Boolean, default: true })
  clockInRestrictEarly!: boolean;

  // Restrict late clock-in based on shift
  @Prop({ type: Boolean, default: true })
  clockInRestrictLate!: boolean;

  // Multiple punches per day allowed (BR-TM-11)
  @Prop({ type: Boolean, default: true })
  clockInMultiplePunchesAllowed!: boolean;

  // Use first in/last out logic (BR-TM-11)
  @Prop({ type: Boolean, default: false })
  clockInUseFirstInLastOut!: boolean;

  // ==================== BR-TM-13: Attendance Correction Request Configuration ====================
  // Allow employees to submit correction requests
  @Prop({ type: Boolean, default: true })
  correctionAllowEmployeeSubmissions!: boolean;

  // Approval workflow required
  @Prop({ type: Boolean, default: true })
  correctionRequiresApproval!: boolean;

  // Default approver
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  correctionDefaultApproverId?: Types.ObjectId;

  // Maximum days to submit correction after occurrence
  @Prop({ type: Number, default: 7 })
  correctionMaxDaysToSubmit?: number;

  // Require reason for correction
  @Prop({ type: Boolean, default: true })
  correctionRequireReason!: boolean;

  // ==================== Location/Terminal Tracking (BR-TM-11) ====================
  // Require location/terminal ID for clock-ins
  @Prop({ type: Boolean, default: false })
  locationRequireLocationTracking!: boolean;

  // Require device ID for clock-ins
  @Prop({ type: Boolean, default: false })
  locationRequireDeviceTracking!: boolean;

  // Allowed locations/terminals (if restricted)
  @Prop({ type: [mongoose.Schema.Types.ObjectId], default: [] })
  locationAllowedLocationIds!: Types.ObjectId[];

  // Allowed devices (if restricted)
  @Prop({ type: [String], default: [] })
  locationAllowedDeviceIds!: string[];

  // ==================== Policy Management ====================
  // Created by (HR Manager)
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  // Last modified by
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  lastModifiedBy?: Types.ObjectId;

  // Version tracking for policy changes
  @Prop({ type: Number, default: 1 })
  version!: number;

  // Reference to previous version (for audit trail)
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Policy' })
  previousVersionId?: Types.ObjectId;
}

export const PolicySchema = SchemaFactory.createForClass(Policy);
