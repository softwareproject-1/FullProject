import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose'; // <-- Make sure mongoose is imported
import { PayrollStatus } from '../enums/payroll-status.enum';

export type PayrollRunDocument = mongoose.HydratedDocument<PayrollRun>;

@Schema()
export class PayrollRun {
    // 1. runId
    @Prop({ required: true, unique: true })
    runId: string;

    // 2. period
    @Prop({ required: true })
    period: string;

    // 3. status
    @Prop({
        required: true,
        enum: Object.values(PayrollStatus),
        default: PayrollStatus.DRAFT,
    })
    status: string;

    // 4. initiatedBy (This is the updated line)
    @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    initiatedBy: mongoose.Schema.Types.ObjectId;

    // 5. draftGeneratedOn
    @Prop()
    draftGeneratedOn: Date;

    // 6. approvalHistory
    @Prop({ type: [mongoose.Schema.Types.Mixed], default: [] })
    approvalHistory: mongoose.Schema.Types.Mixed[];

    // 7. totalNetDisbursement
    @Prop({ required: true, default: 0 })
    totalNetDisbursement: number;
}

export const PayrollRunSchema = SchemaFactory.createForClass(PayrollRun);