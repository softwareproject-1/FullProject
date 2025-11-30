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
import { RefundService } from '../services/refund.service';
import { CreateRefundDto } from '../dto/create-refund.dto';
import { UpdateRefundDto } from '../dto/update-refund.dto';
import { RefundStatus } from '../schemas/refund.schema';

@Controller('api/v1/refunds')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Post()
  create(@Body() createRefundDto: CreateRefundDto) {
    return this.refundService.create(createRefundDto);
  }

  @Get()
  findAll(@Query('status') status?: RefundStatus) {
    if (status) {
      return this.refundService.findByStatus(status);
    }
    return this.refundService.findAll();
  }

  // CRITICAL ENDPOINT: This is EXPORTED to Team 6 for integration
  // Team 6 will call this endpoint to get pending refunds for the next payroll run
  @Get('pending')
  getPendingRefunds() {
    return this.refundService.getPendingRefunds();
  }

  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.refundService.findByEmployee(employeeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.refundService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRefundDto: UpdateRefundDto) {
    return this.refundService.update(id, updateRefundDto);
  }

  @Patch(':id/mark-processed/:payrollRunId')
  markAsProcessed(@Param('id') id: string, @Param('payrollRunId') payrollRunId: string) {
    return this.refundService.markAsProcessed(id, payrollRunId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.refundService.remove(id);
  }
}
