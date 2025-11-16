import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';


@Schema({ timestamps: true })
export class Position extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  department: Types.ObjectId;

  // Reporting line: position that this role reports to manager msln wla meen
  @Prop({ type: Types.ObjectId, ref: 'Position', default: null })
  reportsTo?: Types.ObjectId;

  @Prop()
  payGrade?: string;

  @Prop({ default: true }) //position available lsa wla
  isActive: boolean;

  @Prop()
  deactivatedAt?: Date;
}

export const PositionSchema = SchemaFactory.createForClass(Position);
