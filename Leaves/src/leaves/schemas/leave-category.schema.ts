import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class LeaveCategory extends Document {
  @Prop({ required: true, unique: true, index: true })
  categoryId: string;

  @Prop({ required: true })
  name: string; // e.g., 'Annual Leaves', 'Other'

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  isDeductedFromBalance: boolean; // true for Annual, false for Other

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ sparse: true, default: null })
  deletedAt: Date; // soft-delete

  createdAt: Date;
  updatedAt: Date;
}

export const LeaveCategorySchema = SchemaFactory.createForClass(LeaveCategory);
LeaveCategorySchema.index({ isActive: 1, createdAt: -1 });