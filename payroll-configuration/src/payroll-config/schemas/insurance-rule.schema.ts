import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InsuranceRuleDocument = InsuranceRule & Document;

@Schema({ timestamps: true })
export class InsuranceRule {
  @Prop({ required: true })
  name: string; // e.g. "Social Insurance 2025"

  @Prop({ required: true })
  employeeContributionPercent: number;

  @Prop({ required: true })
  companyContributionPercent: number;

  @Prop({ required: true })
  salaryCap: number;
}

export const InsuranceRuleSchema = SchemaFactory.createForClass(InsuranceRule);
