import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Document } from 'mongoose';
import { ExpenseClaim, ClaimStatus } from '../schemas/expense-claim.schema';
import { CreateExpenseClaimDto } from '../dto/create-expense-claim.dto';
import { UpdateExpenseClaimDto } from '../dto/update-expense-claim.dto';

export type ExpenseClaimDocument = ExpenseClaim & Document;

@Injectable()
export class ExpenseClaimService {
  constructor(
    @InjectModel(ExpenseClaim.name)
    private expenseClaimModel: Model<ExpenseClaimDocument>,
  ) {}

  async create(createExpenseClaimDto: CreateExpenseClaimDto): Promise<ExpenseClaim> {
    const createdClaim = new this.expenseClaimModel({
      ...createExpenseClaimDto,
      employee: new Types.ObjectId(createExpenseClaimDto.employee),
    });
    return createdClaim.save();
  }

  async findAll(): Promise<ExpenseClaim[]> {
    return this.expenseClaimModel
      .find()
      .sort({ submittedAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<ExpenseClaim> {
    const claim = await this.expenseClaimModel.findById(id).exec();

    if (!claim) {
      throw new NotFoundException(`Expense claim with ID ${id} not found`);
    }
    return claim;
  }

  async findByEmployee(employeeId: string): Promise<ExpenseClaim[]> {
    return this.expenseClaimModel
      .find({ employee: new Types.ObjectId(employeeId) })
      .sort({ submittedAt: -1 })
      .exec();
  }

  async findByStatus(status: ClaimStatus): Promise<ExpenseClaim[]> {
    return this.expenseClaimModel
      .find({ status })
      .sort({ submittedAt: -1 })
      .exec();
  }

  async update(id: string, updateExpenseClaimDto: UpdateExpenseClaimDto): Promise<ExpenseClaim> {
    const updateData: any = { ...updateExpenseClaimDto };

    // Convert string IDs to ObjectId if provided
    if (updateExpenseClaimDto.employee) {
      updateData.employee = new Types.ObjectId(updateExpenseClaimDto.employee);
    }
    if (updateExpenseClaimDto.refund) {
      updateData.refund = new Types.ObjectId(updateExpenseClaimDto.refund);
    }
    if (updateExpenseClaimDto.reviewedBySpecialist) {
      updateData.reviewedBySpecialist = new Types.ObjectId(updateExpenseClaimDto.reviewedBySpecialist);
    }

    const updatedClaim = await this.expenseClaimModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedClaim) {
      throw new NotFoundException(`Expense claim with ID ${id} not found`);
    }
    return updatedClaim;
  }

  async linkRefund(id: string, refundId: string): Promise<ExpenseClaim> {
    const updatedClaim = await this.expenseClaimModel
      .findByIdAndUpdate(
        id,
        { refund: new Types.ObjectId(refundId) },
        { new: true }
      )
      .exec();

    if (!updatedClaim) {
      throw new NotFoundException(`Expense claim with ID ${id} not found`);
    }
    return updatedClaim;
  }

  async remove(id: string): Promise<void> {
    const result = await this.expenseClaimModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Expense claim with ID ${id} not found`);
    }
  }
}
