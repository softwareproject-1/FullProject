import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { taxRules } from '../models/taxRules.schema';
import { CreateTaxRuleDto } from '../dtos/tax-rules/create-tax-rule.dto';
import { UpdateTaxRuleDto } from '../dtos/tax-rules/update-tax-rule.dto';
import { strictUpdate } from '../helpers/strict-update';
import {
  buildDeleteMessage,
  buildUpdateMessage,
} from '../helpers/response-message';

export type TaxRuleDocument = Document & any;
import { ConfigStatus } from '../enums/payroll-configuration-enums';

@Injectable()
export class TaxRulesService {
  constructor(
    @InjectModel(taxRules.name) private readonly model: Model<TaxRuleDocument>,
  ) {}

  // async create(dto: CreateTaxRuleDto) {
  //   const created = new this.model(dto);
  //   return created.save();
  // }
  async create(dto: CreateTaxRuleDto) {
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
    if (!doc) throw new NotFoundException('Tax rule not found');
    return doc;
  }

  async update(id: string, dto: UpdateTaxRuleDto) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('tax rule not found');

    // Workflow rule: cannot update if not draft
    if (doc.status !== 'draft') {
      throw new BadRequestException(
        `Cannot update tax rule  because it is already ${doc.status}. Only draft tax rules can be updated.`,
      );
    }
    const safeDto = strictUpdate(dto, this.model);

    const updated = await this.model
      .findByIdAndUpdate(id, safeDto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Tax rule not found');
    const fields = Object.keys(safeDto);
    return {
      message: buildUpdateMessage('tax rule', fields),
      data: updated,
    };
  }

  async remove(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('Tax rule not found');

    // Workflow rule: cannot delete if not draft
    if (doc.status !== 'draft') {
      throw new BadRequestException(
        `Cannot delete tax rule because it is already ${doc.status}. Only draft tax rules can be deleted.`,
      );
    }

    const removed = await this.model.findByIdAndDelete(id).exec();
    return {
      message: buildDeleteMessage('tax rule'),
      data: removed,
    };
  }

  // STATUS UPDATE → Payroll Manager ONLY
  async updateStatus(
    id: string,
    status: ConfigStatus.APPROVED | ConfigStatus.REJECTED,
  ) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('tax rule not found');

    // Allowed transitions:
    // draft → approved
    // draft → rejected
    // rejected → approved (resubmission scenario)
    if (![ConfigStatus.DRAFT, ConfigStatus.REJECTED].includes(doc.status)) {
      throw new BadRequestException(
        `Cannot change status because tax rule is currently '${doc.status}'. Only draft or rejected tax rules can be modified.`,
      );
    }

    doc.status = status;
    return doc.save();
  }
}
