import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payslip, PayslipDocument } from '../schemas/payslip.schema';
import { CreatePayslipDto } from '../dto/create-payslip.dto';
import { UpdatePayslipDto } from '../dto/update-payslip.dto';

@Injectable()
export class PayslipService {
  constructor(
    @InjectModel(Payslip.name)
    private payslipModel: Model<PayslipDocument>,
  ) {}

  async create(createPayslipDto: CreatePayslipDto): Promise<Payslip> {
    const createdPayslip = new this.payslipModel({
      ...createPayslipDto,
      employee: new Types.ObjectId(createPayslipDto.employee),
      payrollRunId: new Types.ObjectId(createPayslipDto.payrollRunId),
    });
    return createdPayslip.save();
  }

  async findAll(): Promise<Payslip[]> {
    return this.payslipModel
      .find()
      .populate('payrollRunId') // Fetch PayrollRun data from Team 6
      .sort({ payDate: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Payslip> {
    const payslip = await this.payslipModel
      .findById(id)
      .populate('payrollRunId') // Fetch PayrollRun data from Team 6
      .exec();

    if (!payslip) {
      throw new NotFoundException(`Payslip with ID ${id} not found`);
    }
    return payslip;
  }

  async findByEmployee(employeeId: string): Promise<Payslip[]> {
    return this.payslipModel
      .find({ employee: new Types.ObjectId(employeeId) })
      .populate('payrollRunId') // Fetch PayrollRun data from Team 6
      .sort({ payDate: -1 })
      .exec();
  }

  async findByPayrollRun(payrollRunId: string): Promise<Payslip[]> {
    return this.payslipModel
      .find({ payrollRunId: new Types.ObjectId(payrollRunId) })
      .populate('payrollRunId') // Fetch PayrollRun data from Team 6
      .sort({ payDate: -1 })
      .exec();
  }

  async update(id: string, updatePayslipDto: UpdatePayslipDto): Promise<Payslip> {
    const updateData: any = { ...updatePayslipDto };

    // Convert string IDs to ObjectId if provided
    if (updatePayslipDto.employee) {
      updateData.employee = new Types.ObjectId(updatePayslipDto.employee);
    }
    if (updatePayslipDto.payrollRunId) {
      updateData.payrollRunId = new Types.ObjectId(updatePayslipDto.payrollRunId);
    }

    const updatedPayslip = await this.payslipModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('payrollRunId') // Fetch PayrollRun data from Team 6
      .exec();

    if (!updatedPayslip) {
      throw new NotFoundException(`Payslip with ID ${id} not found`);
    }
    return updatedPayslip;
  }

  async remove(id: string): Promise<void> {
    const result = await this.payslipModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Payslip with ID ${id} not found`);
    }
  }
}
