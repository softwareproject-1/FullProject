import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { payGrade, payGradeSchema } from '../models/payGrades.schema'; // adjust filename if needed
import { allowance } from '../models/allowance.schema';
import { CreatePayGradeDto } from '../dtos/pay-grades/create-pay-grade.dto';
import { UpdatePayGradeDto } from '../dtos/pay-grades/update-pay-grade.dto';
import { strictUpdate } from '../helpers/strict-update';
import {
  buildDeleteMessage,
  buildUpdateMessage,
} from '../helpers/response-message';

import { ConfigStatus } from '../enums/payroll-configuration-enums';

export type PayGradeDocument = Document & any;

@Injectable()
export class PayGradesService {
  constructor(
    @InjectModel(payGrade.name) private readonly model: Model<PayGradeDocument>,
    @InjectModel(allowance.name)
    private readonly allowanceModel: Model<any>,
  ) {}

  // Helper method to validate gross salary computation
  private async validateGrossSalary(
    baseSalary: number,
    grossSalary: number,
  ): Promise<void> {
    // Fetch approved allowances and sum their amounts
    const allowances = await this.allowanceModel
      .find({ status: ConfigStatus.APPROVED })
      .exec();

    const totalAllowances = allowances.reduce(
      (sum, allowance) => sum + allowance.amount,
      0,
    );

    const expectedGross = baseSalary + totalAllowances;
    if (Math.abs(grossSalary - expectedGross) > 0.01) {
      throw new BadRequestException(
        `Gross salary must equal base salary + approved allowances. Expected: ${expectedGross} (Base: ${baseSalary} + Allowances: ${totalAllowances}), Got: ${grossSalary}`,
      );
    }
  }

  // async create(dto: CreatePayGradeDto) {
  //   const created = new this.model(dto);
  //   return created.save();
  // }
  async create(dto: CreatePayGradeDto) {
    // Validate gross salary = base + allowances
    await this.validateGrossSalary(dto.baseSalary, dto.grossSalary);

    // Validate that only allowed fields are in the DTO
    const safeDto = strictUpdate(dto, this.model);

    const created = new this.model({
      ...safeDto,
      status: 'draft', // enforce workflow rule
    });
    return created.save();
  }
  async findAll() {
    return this.model.find().exec();
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('Pay grade not found');
    return doc;
  }

  async update(id: string, dto: UpdatePayGradeDto) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('Pay grade not found');

    // Workflow rule: cannot update if not draft
    if (doc.status !== 'draft') {
      throw new BadRequestException(
        `Cannot update Pay grade because it is already ${doc.status}. Only draft pay grades can be updated.`,
      );
    }

    // If updating financial fields, validate gross salary
    if (
      dto.baseSalary !== undefined ||
      dto.grossSalary !== undefined ||
      false // allowances removed; validation based on allowance service
    ) {
      const finalBaseSalary = dto.baseSalary ?? doc.baseSalary;
      const finalGrossSalary = dto.grossSalary ?? doc.grossSalary;
      await this.validateGrossSalary(finalBaseSalary, finalGrossSalary);
    }

    const safeDto = strictUpdate(dto, this.model);

    const updated = await this.model
      .findByIdAndUpdate(id, safeDto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Pay grade not found');
    const fields = Object.keys(safeDto);
    return {
      message: buildUpdateMessage('pay grade', fields),
      data: updated,
    };
  }

  async remove(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('Pay grade not found');

    // Workflow rule: cannot delete if not draft
    if (doc.status !== 'draft') {
      throw new BadRequestException(
        `Cannot delete pay grade because it is already ${doc.status}. Only draft pay grades can be deleted.`,
      );
    }

    const removed = await this.model.findByIdAndDelete(id).exec();
    return {
      message: buildDeleteMessage('pay grade'),
      data: removed,
    };
  }

  // STATUS UPDATE → Payroll Manager ONLY
  async updateStatus(
    id: string,
    status: ConfigStatus.APPROVED | ConfigStatus.REJECTED,
  ) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('Pay Grade not found');

    // Allowed transitions:
    // draft → approved
    // draft → rejected
    // rejected → approved (resubmission scenario)
    if (![ConfigStatus.DRAFT, ConfigStatus.REJECTED].includes(doc.status)) {
      throw new BadRequestException(
        `Cannot change status because insurance bracket is currently '${doc.status}'. Only draft or rejected pay grades can be modified.`,
      );
    }

    doc.status = status;
    return doc.save();
  }
}
