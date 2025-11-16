import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TaxBracketDocument = TaxBracket & Document;

@Schema({ timestamps: true })
export class TaxBracket {
  @Prop({ required: true })
  minSalary: number;

  @Prop({ required: true })
  maxSalary: number;

  @Prop({ required: true })
  taxRate: number; // e.g. 15 means 15%

  @Prop({ required: true })
  year: number; // e.g. 2025
}

export const TaxBracketSchema = SchemaFactory.createForClass(TaxBracket);




