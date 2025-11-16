import 'reflect-metadata';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type DataBackupDocument = HydratedDocument<DataBackup>;

@Schema({ timestamps: true })
export class DataBackup {
  @Prop({ type: Date, default: Date.now })
  backupDate!: Date; 

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  initiatedBy?: Types.ObjectId; // has to be admin or scheduler

  @Prop({ type: String, enum: ['Full', 'Incremental'], default: 'Full', required: true })
  backupType!: 'Full' | 'Incremental';

  @Prop({ type: String, required: true })
  filePath!: string; 

  @Prop({ type: String, enum: ['Success', 'Failed'], required: true })
  status!: 'Success' | 'Failed';

  @Prop({ type: Number, min: 1, default: 30 })
  retentionPeriodDays!: number; //backup kept lhad emta ala el system

  @Prop({ type: Date })
  nextScheduledBackup?: Date; //ybaa alarm kda

  @Prop({ type: String })
  notes?: string; //remark
}

export const DataBackupSchema = SchemaFactory.createForClass(DataBackup);

