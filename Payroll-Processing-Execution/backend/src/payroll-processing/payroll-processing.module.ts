import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayrollProcessingController } from './payroll-processing.controller';
import { PayrollProcessingService } from './payroll-processing.service';


// --- Import all your schemas ---
import { PayrollRun, PayrollRunSchema } from './schemas/payroll-run.schema';
import { PayslipDetail, PayslipDetailSchema } from './schemas/payslip-detail.schema';
import { CycleAdjustment, CycleAdjustmentSchema } from './schemas/cycle-adjustment.schema';
import { PayrollAnomality, PayrollAnomalitySchema } from './schemas/payroll-anomaly.schema';

@Module({
  imports: [
    // --- THIS IS THE CRITICAL SECTION ---
    MongooseModule.forFeature([
      { name: PayrollRun.name, schema: PayrollRunSchema },

      { name: PayslipDetail.name, schema: PayslipDetailSchema },
      // Register the CycleAdjustment Schema
      { name: CycleAdjustment.name, schema: CycleAdjustmentSchema },
      // Register the PayrollAnomality Schema
      { name: PayrollAnomality.name, schema: PayrollAnomalitySchema },
    ]),
  ],
  controllers: [PayrollProcessingController],
  providers: [PayrollProcessingService],
  // You may also want to 'export' the Mongoose models/providers 
  // if other modules need to interact with them.
  exports: [
    MongooseModule.forFeature([
      { name: PayrollRun.name, schema: PayrollRunSchema },
      { name: PayslipDetail.name, schema: PayslipDetailSchema },
      { name: CycleAdjustment.name, schema: CycleAdjustmentSchema },
      { name: PayrollAnomality.name, schema: PayrollAnomalitySchema },
    ]),
    PayrollProcessingService // If the service is used outside
  ]
})
export class PayrollProcessingModule { }
