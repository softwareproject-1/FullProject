import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { payGrade, payGradeSchema } from '../models/payGrades.schema'; // adjust filename if needed
import { CreatePayGradeDto } from '../dtos/pay-grades/create-pay-grade.dto';
import { UpdatePayGradeDto } from '../dtos/pay-grades/update-pay-grade.dto';
import { strictUpdate } from '../helpers/strict-update';
import {
  buildDeleteMessage,
  buildUpdateMessage,
} from '../helpers/response-message';

export type PayGradeDocument = Document & any;

@Injectable()
export class PayGradesService {
  constructor(
    @InjectModel(payGrade.name) private readonly model: Model<PayGradeDocument>,
  ) {}

  // async create(dto: CreatePayGradeDto) {
  //   const created = new this.model(dto);
  //   return created.save();
  // }
async create(dto: CreatePayGradeDto) {
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
    if (!doc) throw new NotFoundException('Pay grade not found');
    return doc;
  }

  async update(id: string, dto: UpdatePayGradeDto) {
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
    const removed = await this.model.findByIdAndDelete(id).exec();
    if (!removed) throw new NotFoundException('Pay grade not found');
    return {
      message: buildDeleteMessage('pay grade'),
      data: removed,
    };
  }
}
