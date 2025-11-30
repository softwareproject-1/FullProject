import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Refund, RefundDocument, RefundStatus } from '../schemas/refund.schema';
import { CreateRefundDto } from '../dto/create-refund.dto';
import { UpdateRefundDto } from '../dto/update-refund.dto';

@Injectable()
export class RefundService {
  constructor(
    @InjectModel(Refund.name)
    private refundModel: Model<RefundDocument>,
  ) {}

  async create(createRefundDto: CreateRefundDto): Promise<Refund> {
    const createData: any = {
      ...createRefundDto,
      employee: new Types.ObjectId(createRefundDto.employee),
      status: RefundStatus.PENDING,
      createdAt: new Date(),
    };

    if (createRefundDto.sourceDispute) {
      createData.sourceDispute = new Types.ObjectId(createRefundDto.sourceDispute);
    }
    if (createRefundDto.sourceClaim) {
      createData.sourceClaim = new Types.ObjectId(createRefundDto.sourceClaim);
    }

    const createdRefund = new this.refundModel(createData);
    return createdRefund.save();
  }

  async findAll(): Promise<Refund[]> {
    return this.refundModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Refund> {
    const refund = await this.refundModel
      .findById(id)
      .exec();

    if (!refund) {
      throw new NotFoundException(`Refund with ID ${id} not found`);
    }
    return refund;
  }

  // CRITICAL: This endpoint is EXPORTED to Team 6 for integration
  async getPendingRefunds(): Promise<Refund[]> {
    return this.refundModel
      .find({ status: RefundStatus.PENDING })
      .sort({ createdAt: 1 }) // oldest first for processing
      .exec();
  }

  async findByEmployee(employeeId: string): Promise<Refund[]> {
    return this.refundModel
      .find({ employee: new Types.ObjectId(employeeId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByStatus(status: RefundStatus): Promise<Refund[]> {
    return this.refundModel
      .find({ status })
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(id: string, updateRefundDto: UpdateRefundDto): Promise<Refund> {
    const updateData: any = { ...updateRefundDto };

    if (updateRefundDto.processedInPayrollRun) {
      updateData.processedInPayrollRun = new Types.ObjectId(updateRefundDto.processedInPayrollRun);
    }

    const updatedRefund = await this.refundModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedRefund) {
      throw new NotFoundException(`Refund with ID ${id} not found`);
    }
    return updatedRefund;
  }

  async markAsProcessed(id: string, payrollRunId: string): Promise<Refund> {
    const updatedRefund = await this.refundModel
      .findByIdAndUpdate(
        id,
        {
          status: RefundStatus.PROCESSED,
          processedInPayrollRun: new Types.ObjectId(payrollRunId),
        },
        { new: true }
      )
      .exec();

    if (!updatedRefund) {
      throw new NotFoundException(`Refund with ID ${id} not found`);
    }
    return updatedRefund;
  }

  async remove(id: string): Promise<void> {
    const result = await this.refundModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Refund with ID ${id} not found`);
    }
  }
}
