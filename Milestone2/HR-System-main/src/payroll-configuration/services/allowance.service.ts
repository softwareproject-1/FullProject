import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { allowance } from '../models/allowance.schema';
import { CreateAllowanceDto } from '../dtos/allowance/create-allowance.dto';
import { UpdateAllowanceDto } from '../dtos/allowance/update-allowance.dto';
import { strictUpdate } from '../helpers/strict-update';
import {
  buildDeleteMessage,
  buildUpdateMessage,
} from '../helpers/response-message';

export type AllowanceDocument = Document & any;

@Injectable()
export class AllowanceService {
  constructor(
    @InjectModel(allowance.name)
    private readonly model: Model<AllowanceDocument>,
  ) {}

  // async create(dto: CreateAllowanceDto) {
  //   const created = new this.model(dto);
  //   return created.save();
  // }
async create(dto: CreateAllowanceDto) {
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
    if (!doc) throw new NotFoundException('Allowance not found');
    return doc;
  }

  // async update(id: string, dto: UpdateAllowanceDto) {
  //   const updated = await this.model.findByIdAndUpdate(id, dto, { new: true }).exec();
  //   if (!updated) throw new NotFoundException('Allowance not found');
  //   return updated;
  // }
  async update(id: string, dto: UpdateAllowanceDto) {
    const safeDto = strictUpdate(dto, this.model);

    const updated = await this.model
      .findByIdAndUpdate(id, safeDto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Allowance not found');

    const fields = Object.keys(safeDto);
    return {
      message: buildUpdateMessage('allowance', fields),
      data: updated,
    };
  }

  async remove(id: string) {
    const removed = await this.model.findByIdAndDelete(id).exec();
    if (!removed) throw new NotFoundException('Allowance not found');

    return {
      message: buildDeleteMessage('allowance'),
      data: removed,
    };
  }
}
