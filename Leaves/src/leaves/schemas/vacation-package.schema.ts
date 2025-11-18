import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class VacationPackage extends Document {
  @Prop({ required: true, unique: true, index: true })
  packageCode: string; // e.g., 'VACATION_EGYPTIAN', 'VACATION_FOREIGN'

  @Prop({ required: true })
  packageName: string;

  @Prop({ required: true })
  description: string; // e.g., 'Package for Egyptian employees per labor law'

  // Entitlements per leave type
  @Prop({ type: Map, of: Number, required: true })
  entitlementsByLeaveType: Map<string, number>; // leaveTypeId -> days

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ sparse: true, default: null })
  deletedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const VacationPackageSchema = SchemaFactory.createForClass(VacationPackage);
VacationPackageSchema.index({ packageCode: 1, isActive: 1 });
