import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  terminationAndResignationBenefits,
  terminationAndResignationBenefitsDocument,
} from '../models/terminationAndResignationBenefits';
import { CreateTerminationBenefitsDto } from '../dtos/termination-and-resignation-benefits/create-termination-benefits.dto';
import { UpdateTerminationBenefitsDto } from '../dtos/termination-and-resignation-benefits/update-termination-benefits.dto';
import { strictUpdate } from '../helpers/strict-update';
import {
  buildDeleteMessage,
  buildUpdateMessage,
} from '../helpers/response-message';

@Injectable()
export class TerminationAndResignationBenefitsService {
  constructor(
    @InjectModel(terminationAndResignationBenefits.name)
    private readonly model: Model<terminationAndResignationBenefitsDocument>,
  ) {}

  // async create(dto: CreateTerminationBenefitsDto) {
  //   const created = new this.model(dto);
  //   return created.save();
  // }
async create(dto: CreateTerminationBenefitsDto) {
  // Validate that only allowed fields are in the DTO
  const safeDto = strictUpdate(dto, this.model);

  const created = new this.model(safeDto);
  return created.save();
}
  async findAll() {
    return this.model.find().exec();
  }

  async findOne(id: string) {
    const found = await this.model.findById(id).exec();
    if (!found)
      throw new NotFoundException('Termination/Resignation benefit not found');
    return found;
  }

  async update(id: string, dto: UpdateTerminationBenefitsDto) {
    const safeDto = strictUpdate(dto, this.model);

    const updated = await this.model
      .findByIdAndUpdate(id, safeDto, { new: true })
      .exec();
    if (!updated)
      throw new NotFoundException('Termination/Resignation benefit not found');
    const fields = Object.keys(safeDto);
    return {
      message: buildUpdateMessage('termination/resignation benefit', fields),
      data: updated,
    };
  }

  async remove(id: string) {
    const res = await this.model.findByIdAndDelete(id).exec();
    if (!res)
      throw new NotFoundException('Termination/Resignation benefit not found');
    return {
      message: buildDeleteMessage('termination/resignation benefit'),
      data: res,
    };
  }
}
