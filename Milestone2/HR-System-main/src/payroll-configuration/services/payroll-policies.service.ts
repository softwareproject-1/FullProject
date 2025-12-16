import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  payrollPolicies,
  payrollPoliciesDocument,
} from '../models/payrollPolicies.schema';
import { CreatePayrollPolicyDto } from '../dtos/payroll-policies/create-payroll-policy.dto';
import { UpdatePayrollPolicyDto } from '../dtos/payroll-policies/update-payroll-policy.dto';
import { strictUpdate } from '../helpers/strict-update';
import {
  buildDeleteMessage,
  buildUpdateMessage,
} from '../helpers/response-message';

@Injectable()
export class PayrollPoliciesService {
  constructor(
    @InjectModel(payrollPolicies.name)
    private readonly policyModel: Model<payrollPoliciesDocument>,
  ) {}

  // async create(dto: CreatePayrollPolicyDto) {
  //   const created = new this.policyModel(dto);
  //   return created.save();
  // }
async create(dto: CreatePayrollPolicyDto) {
  // Validate that only allowed fields are in the DTO
  const safeDto = strictUpdate(dto, this.policyModel);

  const created = new this.policyModel(safeDto);
  return created.save();
}
  async findAll() {
    return this.policyModel.find().exec();
  }

  async findOne(id: string) {
    const found = await this.policyModel.findById(id).exec();
    if (!found) throw new NotFoundException('Payroll policy not found');
    return found;
  }

  async update(id: string, dto: UpdatePayrollPolicyDto) {
    const safeDto = strictUpdate(dto, this.policyModel);

    const updated = await this.policyModel
      .findByIdAndUpdate(id, safeDto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Payroll policy not found');
    const fields = Object.keys(safeDto);
    return {
      message: buildUpdateMessage('payroll policy', fields),
      data: updated,
    };
  }

  async remove(id: string) {
    const res = await this.policyModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Payroll policy not found');
    return {
      message: buildDeleteMessage('payroll policy'),
      data: res,
    };
  }
}
