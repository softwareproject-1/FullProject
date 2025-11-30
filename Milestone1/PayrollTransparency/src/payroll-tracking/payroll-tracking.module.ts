import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas
import { ExpenseClaim, ExpenseClaimSchema } from './schemas/expense-claim.schema';
import { PayrollDispute, PayrollDisputeSchema } from './schemas/payroll-dispute.schema';
import { Payslip, PayslipSchema } from './schemas/payslip.schema';
import { Refund, RefundSchema } from './schemas/refund.schema';
import { TaxDocument, TaxDocumentSchema } from './schemas/tax-document.schema';
import { PayrollRun, PayrollRunSchema } from './schemas/payroll-run.schema'; // Team 6 external reference

// Services
import { ExpenseClaimService } from './services/expense-claim.service';
import { PayrollDisputeService } from './services/payroll-dispute.service';
import { PayslipService } from './services/payslip.service';
import { RefundService } from './services/refund.service';
import { TaxDocumentService } from './services/tax-document.service';

// Controllers
import { ExpenseClaimController } from './controllers/expense-claim.controller';
import { PayrollDisputeController } from './controllers/payroll-dispute.controller';
import { PayslipController } from './controllers/payslip.controller';
import { RefundController } from './controllers/refund.controller';
import { TaxDocumentController } from './controllers/tax-document.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ExpenseClaim.name, schema: ExpenseClaimSchema },
      { name: PayrollDispute.name, schema: PayrollDisputeSchema },
      { name: Payslip.name, schema: PayslipSchema },
      { name: Refund.name, schema: RefundSchema },
      { name: TaxDocument.name, schema: TaxDocumentSchema },
      { name: PayrollRun.name, schema: PayrollRunSchema }, // Team 6 - for populate support
    ]),
  ],
  controllers: [
    ExpenseClaimController,
    PayrollDisputeController,
    PayslipController,
    RefundController,
    TaxDocumentController,
  ],
  providers: [
    ExpenseClaimService,
    PayrollDisputeService,
    PayslipService,
    RefundService,
    TaxDocumentService,
  ],
  exports: [
    MongooseModule,
    ExpenseClaimService,
    PayrollDisputeService,
    PayslipService,
    RefundService,
    TaxDocumentService,
  ],
})
export class PayrollTrackingModule {}
