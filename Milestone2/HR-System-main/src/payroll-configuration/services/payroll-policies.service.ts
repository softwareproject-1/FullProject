import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { ConfigStatus } from '../enums/payroll-configuration-enums';

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

    const created = new this.policyModel({
      ...safeDto,
      status: 'draft', // enforce workflow rule
    });
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
    const doc = await this.policyModel.findById(id).exec();
    if (!doc) throw new NotFoundException('payroll policy not found');

    // Workflow rule: cannot update if not draft
    if (doc.status !== 'draft') {
      throw new BadRequestException(
        `Cannot update payroll policy  because it is already ${doc.status}. Only draft payroll policies can be updated.`,
      );
    }
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
    const doc = await this.policyModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Payroll policy not found');

    // Workflow rule: cannot delete if not draft
    if (doc.status !== 'draft') {
      throw new BadRequestException(
        `Cannot delete payroll policy because it is already ${doc.status}. Only draft payroll policies can be deleted.`,
      );
    }

    const res = await this.policyModel.findByIdAndDelete(id).exec();
    return {
      message: buildDeleteMessage('payroll policy'),
      data: res,
    };
  }

  // STATUS UPDATE → Payroll Manager ONLY
  async updateStatus(
    id: string,
    status: ConfigStatus.APPROVED | ConfigStatus.REJECTED,
  ) {
    const doc = await this.policyModel.findById(id).exec();
    if (!doc) throw new NotFoundException('payroll policy not found');

    // Allowed transitions:
    // draft → approved
    // draft → rejected
    // rejected → approved (resubmission scenario)
    if (![ConfigStatus.DRAFT, ConfigStatus.REJECTED].includes(doc.status)) {
      throw new BadRequestException(
        `Cannot change status because payroll policy is currently '${doc.status}'. Only draft or rejected payroll policies can be modified.`,
      );
    }
    doc.status = status;
    return doc.save();
  }
}
