import { Injectable, NotFoundException } from '@nestjs/common';
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

  const created = new this.model(safeDto);
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
    const removed = await this.model.findByIdAndDelete(id).exec();
    if (!removed) throw new NotFoundException('Tax rule not found');
    return {
      message: buildDeleteMessage('tax rule'),
      data: removed,
    };
  }
}
