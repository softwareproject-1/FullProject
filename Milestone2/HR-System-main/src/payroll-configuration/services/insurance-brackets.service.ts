import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  insuranceBrackets,
  insuranceBracketsDocument,
} from '../models/insuranceBrackets.schema';
import { CreateInsuranceBracketDto } from '../dtos/insurance-brackets/create-insurance-bracket.dto';
import { UpdateInsuranceBracketDto } from '../dtos/insurance-brackets/update-insurance-bracket.dto';
import { strictUpdate } from '../helpers/strict-update';
import {
  buildDeleteMessage,
  buildUpdateMessage,
} from '../helpers/response-message';

@Injectable()
export class InsuranceBracketsService {
  constructor(
    @InjectModel(insuranceBrackets.name)
    private readonly insuranceModel: Model<insuranceBracketsDocument>,
  ) {}

  // async create(dto: CreateInsuranceBracketDto) {
  //   const created = new this.insuranceModel(dto);
  //   return created.save();
  // }
async create(dto: CreateInsuranceBracketDto) {
  // Validate that only allowed fields are in the DTO
  const safeDto = strictUpdate(dto, this.insuranceModel);

  const created = new this.insuranceModel(safeDto);
  return created.save();
}
  async findAll() {
    return this.insuranceModel.find().exec();
  }

  async findOne(id: string) {
    const found = await this.insuranceModel.findById(id).exec();
    if (!found) throw new NotFoundException('Insurance bracket not found');
    return found;
  }

  async update(id: string, dto: UpdateInsuranceBracketDto) {
    const safeDto = strictUpdate(dto, this.insuranceModel);

    const updated = await this.insuranceModel
      .findByIdAndUpdate(id, safeDto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Insurance bracket not found');
    const fields = Object.keys(safeDto);
    return {
      message: buildUpdateMessage('insurance bracket', fields),
      data: updated,
    };
  }

  async remove(id: string) {
    const res = await this.insuranceModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Insurance bracket not found');
    return {
      message: buildDeleteMessage('insurance bracket'),
      data: res,
    };
  }
}
