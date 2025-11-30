import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

// Mongoose Schema Definition
export type TaxDocumentDocument = HydratedDocument<TaxDocument>;

@Schema({ timestamps: true }) // 'timestamps: true' adds createdAt and updatedAt fields
export class TaxDocument {
  @Prop({ type: Types.ObjectId, required: true, index: true, ref: 'Employee' })
  employee: Types.ObjectId; // -> REF: Team 1 (Employee)

  @Prop({
    required: true,
    enum: ['Annual Tax Summary', 'Insurance Certificate', 'T4', 'Other'],
  })
  documentType: string; // (REQ-PY-15)

  @Prop({ required: true })
  year: number; // The tax year this document applies to

  @Prop({ required: true })
  generatedAt: Date; // The date the document was generated

  @Prop({ required: true })
  documentUrl: string; // URL where the tax document can be downloaded (REQ-PY-15)
}

export const TaxDocumentSchema = SchemaFactory.createForClass(TaxDocument);