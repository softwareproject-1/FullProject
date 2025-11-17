import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AllowanceRuleDocument = AllowanceRule & Document;

@Schema({ timestamps: true })
export class AllowanceRule {
  @Prop({ required: true })
  name: string; // e.g. "Transportation", "Housing"

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  isPercentage: boolean;

  @Prop({ type: [String], required: true })
  payGrades: string[]; // list of pay grades eligible for this allowance
}

export const AllowanceRuleSchema = SchemaFactory.createForClass(AllowanceRule);
