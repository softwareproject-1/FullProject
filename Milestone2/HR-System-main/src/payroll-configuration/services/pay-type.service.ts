import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { payType } from '../models/payType.schema';
import { CreatePayTypeDto } from '../dtos/pay-type/create-pay-type.dto';
import { UpdatePayTypeDto } from '../dtos/pay-type/update-pay-type.dto';
import { strictUpdate } from '../helpers/strict-update';
import {
  buildDeleteMessage,
  buildUpdateMessage,
} from '../helpers/response-message';

export type PayTypeDocument = Document & any;

@Injectable()
export class PayTypeService {
  constructor(
    @InjectModel(payType.name) private readonly model: Model<PayTypeDocument>,
  ) {}

  // async create(dto: CreatePayTypeDto) {
  //   const created = new this.model(dto);
  //   return created.save();
  // }
async create(dto: CreatePayTypeDto) {
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
    if (!doc) throw new NotFoundException('Pay type not found');
    return doc;
  }

  async update(id: string, dto: UpdatePayTypeDto) {
    const safeDto = strictUpdate(dto, this.model);

    const updated = await this.model
      .findByIdAndUpdate(id, safeDto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Pay type not found');
    const fields = Object.keys(safeDto);
    return {
      message: buildUpdateMessage('pay type', fields),
      data: updated,
    };
  }

  async remove(id: string) {
    const removed = await this.model.findByIdAndDelete(id).exec();
    if (!removed) throw new NotFoundException('Pay type not found');
    return {
      message: buildDeleteMessage('pay type'),
      data: removed,
    };
  }
}
