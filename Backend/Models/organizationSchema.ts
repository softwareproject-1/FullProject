import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Department extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);

@Schema({ timestamps: true })
export class Position extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true })
  code: string;

  // Reference to Department
  @Prop({ type: String, ref: Department.name, required: true })
  department: string;

  // Reporting line: position that this role reports to manager msln wla meen
  @Prop({ type: String, ref: 'Position', default: null })
  reportsTo?: string;

  @Prop()
  payGrade?: string;

  @Prop({ default: true }) //position available lsa wla
  isActive: boolean;

  @Prop()
  deactivatedAt?: Date;
}

export const PositionSchema = SchemaFactory.createForClass(Position);
