import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { signingBonus } from '../models/signingBonus.schema';
import { CreateSigningBonusDto } from '../dtos/signing-bonus/create-signing-bonus.dto';
import { UpdateSigningBonusDto } from '../dtos/signing-bonus/update-signing-bonus.dto';
import { strictUpdate } from '../helpers/strict-update';
import {
  buildDeleteMessage,
  buildUpdateMessage,
} from '../helpers/response-message';

export type SigningBonusDocument = Document & any;

@Injectable()
export class SigningBonusService {
  constructor(
    @InjectModel(signingBonus.name)
    private readonly model: Model<SigningBonusDocument>,
  ) {}

  // async create(dto: CreateSigningBonusDto) {
  //   const created = new this.model(dto);
  //   return created.save();
  // }
async create(dto: CreateSigningBonusDto) {
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
    if (!doc) throw new NotFoundException('Signing bonus not found');
    return doc;
  }

  async update(id: string, dto: UpdateSigningBonusDto) {
    const safeDto = strictUpdate(dto, this.model);

    const updated = await this.model
      .findByIdAndUpdate(id, safeDto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Signing bonus not found');
    const fields = Object.keys(safeDto);
    return {
      message: buildUpdateMessage('signing bonus', fields),
      data: updated,
    };
  }

  async remove(id: string) {
    const removed = await this.model.findByIdAndDelete(id).exec();
    if (!removed) throw new NotFoundException('Signing bonus not found');
    return {
      message: buildDeleteMessage('signing bonus'),
      data: removed,
    };
  }
}
