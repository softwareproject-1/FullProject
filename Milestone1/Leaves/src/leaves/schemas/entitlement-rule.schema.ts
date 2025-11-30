import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: true })
export class EntitlementRule extends Document {
  @Prop({ required: true, unique: true, index: true })
  ruleId: string;

  @Prop({ required: true })
  name: string; // e.g., 'New Employee Rule', 'Senior Employee Rule'

  @Prop({ required: true })
  description: string;

  // Eligibility criteria
  @Prop([String])
  eligibleEmploymentTypes: string[]; // Full-time, Part-time, Contract, etc.

  @Prop({ required: true })
  minTenureMonths: number; // Minimum months of service required

  @Prop([String])
  locations: string[]; // Applicable locations

  @Prop([String])
  jobGrades: string[]; // Applicable job grades

  @Prop([String])
  positions: string[]; // Applicable positions

  // Entitlement
  @Prop({ required: true })
  defaultEntitlementDays: number; // Base days entitled

  @Prop({ type: Map, of: Number })
  entitlementByEmploymentType: Map<string, number>; // Days per employment type

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ sparse: true, default: null })
  deletedAt: Date;

  createdAt: Date;
  updatedAt: Date;

  @Prop({ default: false })
  requiresDocumentation: boolean; // e.g., sick leave > 1 day needs medical cert

  // Year-end & carry-forward controls
  @Prop({ required: false })
  expiryMonths?: number; // If set, entitlement days expire after N months

  @Prop({
    required: false,
    enum: ['none', 'limited', 'unlimited'],
    default: 'limited',
  })
  carryForwardPolicy?: string; // none/limited/unlimited

  @Prop({ required: false, default: 0 })
  carryForwardMaxDays?: number; // Max days allowed to carry forward when policy is 'limited'

  @Prop({ required: false, default: 0 })
  carryForwardExpiryMonths?: number; // Months until carried days expire
}

export const EntitlementRuleSchema = SchemaFactory.createForClass(EntitlementRule);
EntitlementRuleSchema.index({ minTenureMonths: 1, isActive: 1 });

