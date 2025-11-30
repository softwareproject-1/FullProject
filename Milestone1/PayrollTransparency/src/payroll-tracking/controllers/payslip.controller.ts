import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PayslipService } from '../services/payslip.service';
import { CreatePayslipDto } from '../dto/create-payslip.dto';
import { UpdatePayslipDto } from '../dto/update-payslip.dto';
import { Payslip } from '../schemas/payslip.schema';

@Controller('api/v1/payslips')
export class PayslipController {
  constructor(private readonly payslipService: PayslipService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPayslipDto: CreatePayslipDto): Promise<Payslip> {
    return this.payslipService.create(createPayslipDto);
  }

  @Get()
  async findAll(): Promise<Payslip[]> {
    return this.payslipService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Payslip> {
    return this.payslipService.findOne(id);
  }

  @Get('employee/:employeeId')
  async findByEmployee(@Param('employeeId') employeeId: string): Promise<Payslip[]> {
    return this.payslipService.findByEmployee(employeeId);
  }

  @Get('payroll-run/:payrollRunId')
  async findByPayrollRun(@Param('payrollRunId') payrollRunId: string): Promise<Payslip[]> {
    return this.payslipService.findByPayrollRun(payrollRunId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePayslipDto: UpdatePayslipDto,
  ): Promise<Payslip> {
    return this.payslipService.update(id, updatePayslipDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.payslipService.remove(id);
  }
}
