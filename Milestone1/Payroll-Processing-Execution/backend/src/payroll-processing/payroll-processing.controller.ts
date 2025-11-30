import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Param, // <-- Import Param
} from '@nestjs/common';
import { PayrollProcessingService } from './payroll-processing.service';
import { InitiatePayrollDto } from './dto/initiate-payroll.dto';

@Controller('payroll-processing')
export class PayrollProcessingController {
  constructor(private readonly payrollService: PayrollProcessingService) { }

  /**
   * POST /api/v1/payroll-processing/initiate
   * Triggers Phase 1: Initiation
   */
  @Post('initiate')
  @HttpCode(HttpStatus.CREATED)
  async initiatePayrollRun(@Body() initiateDto: InitiatePayrollDto) {
    // This is a dummy user ID for Milestone 1b
    // Must be a valid 24-character hex string to work as an ObjectId
    const dummyUserId = '60f8f8f8f8f8f8f8f8f8f8f8';

    const newRun = await this.payrollService.initiateRun(
      initiateDto,
      dummyUserId,
    );
    return {
      message: 'Payroll run initiated successfully',
      data: newRun,
    };
  }

  /**
   * POST /api/v1/payroll-processing/:runId/generate-draft
   * Triggers Phase 1.1: Draft Generation
   */
  @Post(':runId/generate-draft')
  @HttpCode(HttpStatus.OK)
  async generateDraft(@Param('runId') runId: string) {
    const updatedRun = await this.payrollService.generateDraft(runId);
    return {
      message: 'Draft generated successfully. Status set to Under Review.',
      data: updatedRun,
    };
  }
}

// import { Controller, Get, Post } from '@nestjs/common';
// import { PayrollProcessingService } from './payroll-processing.service';

// @Controller('payroll-processing')
// export class PayrollProcessingController {
// // 	constructor(private readonly svc: PayrollProcessingService) {}

// // 	@Get('payslip-details/exists')
// // 	async exists() {
// // 		const exists = await this.svc.collectionExists();
// // 		return { collection: 'payslipdetails', exists };
// // 	}

// // 	@Post('payslip-details/ensure')
// // 	async ensure() {
// // 		return this.svc.ensureCollectionCreated();
// // 	}

// // 	@Post('payslip-details/sample')
// // 	async insertSample() {
// // 		return this.svc.insertSample();
// // 	}
// }

