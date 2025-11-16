import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PayrollDispute, PayrollDisputeDocument, DisputeStatus } from '../schemas/payroll-dispute.schema';
import { CreatePayrollDisputeDto } from '../dto/create-payroll-dispute.dto';
import { UpdatePayrollDisputeDto } from '../dto/update-payroll-dispute.dto';

@Injectable()
export class PayrollDisputeService {
  constructor(
    @InjectModel(PayrollDispute.name)
    private payrollDisputeModel: Model<PayrollDisputeDocument>,
  ) {}

  async create(createPayrollDisputeDto: CreatePayrollDisputeDto): Promise<PayrollDispute> {
    const createdDispute = new this.payrollDisputeModel({
      ...createPayrollDisputeDto,
      employee: new Types.ObjectId(createPayrollDisputeDto.employee),
      payslip: new Types.ObjectId(createPayrollDisputeDto.payslip),
      status: DisputeStatus.SUBMITTED,
      submittedAt: new Date(),
    });
    return createdDispute.save();
  }

  async findAll(): Promise<PayrollDispute[]> {
    return this.payrollDisputeModel
      .find()
      .sort({ submittedAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<PayrollDispute> {
    const dispute = await this.payrollDisputeModel
      .findById(id)
      .exec();

    if (!dispute) {
      throw new NotFoundException(`PayrollDispute with ID ${id} not found`);
    }
    return dispute;
  }

  async findByEmployee(employeeId: string): Promise<PayrollDispute[]> {
    return this.payrollDisputeModel
      .find({ employee: new Types.ObjectId(employeeId) })
      .sort({ submittedAt: -1 })
      .exec();
  }

  async findByStatus(status: DisputeStatus): Promise<PayrollDispute[]> {
    return this.payrollDisputeModel
      .find({ status })
      .sort({ submittedAt: -1 })
      .exec();
  }

  async update(id: string, updatePayrollDisputeDto: UpdatePayrollDisputeDto): Promise<PayrollDispute> {
    const updateData: any = { ...updatePayrollDisputeDto };

    // Convert string IDs to ObjectId if provided
    if (updatePayrollDisputeDto.reviewedBySpecialist) {
      updateData.reviewedBySpecialist = new Types.ObjectId(updatePayrollDisputeDto.reviewedBySpecialist);
    }
    if (updatePayrollDisputeDto.reviewedByManager) {
      updateData.reviewedByManager = new Types.ObjectId(updatePayrollDisputeDto.reviewedByManager);
    }
    if (updatePayrollDisputeDto.refund) {
      updateData.refund = new Types.ObjectId(updatePayrollDisputeDto.refund);
    }

    const updatedDispute = await this.payrollDisputeModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedDispute) {
      throw new NotFoundException(`PayrollDispute with ID ${id} not found`);
    }
    return updatedDispute;
  }

  async remove(id: string): Promise<void> {
    const result = await this.payrollDisputeModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`PayrollDispute with ID ${id} not found`);
    }
  }

  async linkRefund(disputeId: string, refundId: string): Promise<PayrollDispute> {
    const updatedDispute = await this.payrollDisputeModel
      .findByIdAndUpdate(
        disputeId,
        { 
          refund: new Types.ObjectId(refundId),
          status: DisputeStatus.RESOLVED 
        },
        { new: true }
      )
      .exec();

    if (!updatedDispute) {
      throw new NotFoundException(`PayrollDispute with ID ${disputeId} not found`);
    }
    return updatedDispute;
  }
}
