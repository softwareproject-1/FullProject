import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

// Define a type for the structure of the nested payslipData object
export type PayslipData = {
  grossEarnings: number; // REQ-PY-11, REQ-PY-14
  totalDeductions: number; // REQ-PY-11
  netPay: number; // Calculated field
  payPeriodStart: Date;
  payPeriodEnd: Date;
  // Add other required fields if specified in the full contract (e.g., deductions breakdown)
};

// Mongoose Schema Definition
export type PayslipDocument = HydratedDocument<Payslip>;

@Schema({ timestamps: true }) // 'timestamps: true' adds createdAt and updatedAt fields
export class Payslip {
  @Prop({ type: Types.ObjectId, required: true, index: true, ref: 'Employee' })
  employee: Types.ObjectId; // -> REF: Team 1 (Employee)

  @Prop({ type: Types.ObjectId, required: true, index: true, ref: 'PayrollRun' })
  payrollRunId: Types.ObjectId; // -> REF: Team 6 (PayrollRun) - A reference to the specific payroll execution run

  @Prop({ required: true })
  payDate: Date; // The date the employee was paid

  @Prop({ required: true })
  salary: number; // The employee's base salary at the time of the pay run (REQ-PY-13)

  @Prop({ type: Object, required: true })
  payslipData: PayslipData; // Nested object containing earnings, deductions, and net pay details (REQ-PY-11, REQ-PY-14)

  @Prop({ required: true })
  documentUrl: string; // URL where the PDF payslip can be downloaded
}

export const PayslipSchema = SchemaFactory.createForClass(Payslip);