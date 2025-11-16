import 'reflect-metadata';
import { Prop, Schema } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';

@Schema({ _id: false })
export class AuditEntry {
  @Prop({ type: String, required: true })
  action!: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  performedBy!: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  timestamp?: Date;

  @Prop({ type: String })
  note?: string;
}

