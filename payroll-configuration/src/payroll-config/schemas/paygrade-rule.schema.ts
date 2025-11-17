import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PayGradeRuleDocument = PayGradeRule & Document;

@Schema({ timestamps: true })
export class PayGradeRule {
  @Prop({ required: true })
  payGrade: string; // e.g. "G-10"

  @Prop({ required: true })
  baseSalary: number;

  @Prop({ required: true })
  currency: string; // e.g. "EGP"
}

export const PayGradeRuleSchema = SchemaFactory.createForClass(PayGradeRule);
