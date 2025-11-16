import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { PayrollDisputeService } from '../services/payroll-dispute.service';
import { CreatePayrollDisputeDto } from '../dto/create-payroll-dispute.dto';
import { UpdatePayrollDisputeDto } from '../dto/update-payroll-dispute.dto';
import { DisputeStatus } from '../schemas/payroll-dispute.schema';

@Controller('api/v1/payroll-disputes')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class PayrollDisputeController {
  constructor(private readonly payrollDisputeService: PayrollDisputeService) {}

  @Post()
  create(@Body() createPayrollDisputeDto: CreatePayrollDisputeDto) {
    return this.payrollDisputeService.create(createPayrollDisputeDto);
  }

  @Get()
  findAll(@Query('status') status?: DisputeStatus) {
    if (status) {
      return this.payrollDisputeService.findByStatus(status);
    }
    return this.payrollDisputeService.findAll();
  }

  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.payrollDisputeService.findByEmployee(employeeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.payrollDisputeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePayrollDisputeDto: UpdatePayrollDisputeDto) {
    return this.payrollDisputeService.update(id, updatePayrollDisputeDto);
  }

  @Patch(':id/link-refund/:refundId')
  linkRefund(@Param('id') id: string, @Param('refundId') refundId: string) {
    return this.payrollDisputeService.linkRefund(id, refundId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.payrollDisputeService.remove(id);
  }
}
