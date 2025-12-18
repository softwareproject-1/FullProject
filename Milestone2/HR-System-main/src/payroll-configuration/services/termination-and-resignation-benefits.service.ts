import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

import { ConfigStatus } from '../enums/payroll-configuration-enums';

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
    const found = await this.model.findById(id).exec();
    if (!found)
      throw new NotFoundException('Termination/Resignation benefit not found');
    return found;
  }

  async update(id: string, dto: UpdateTerminationBenefitsDto) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('termenation benefit not found');

    // Workflow rule: cannot update if not draft
    if (doc.status !== 'draft') {
      throw new BadRequestException(
        `Cannot update termination benefit because it is already ${doc.status}. Only draft termination/resignation benefits can be updated.`,
      );
    }
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
    const doc = await this.model.findById(id).exec();
    if (!doc)
      throw new NotFoundException('Termination/Resignation benefit not found');

    // Workflow rule: cannot delete if not draft
    if (doc.status !== 'draft') {
      throw new BadRequestException(
        `Cannot delete termination/resignation benefit because it is already ${doc.status}. Only draft termination/resignation benefits can be deleted.`,
      );
    }

    const res = await this.model.findByIdAndDelete(id).exec();
    return {
      message: buildDeleteMessage('termination/resignation benefit'),
      data: res,
    };
  }

  // STATUS UPDATE → Payroll Manager ONLY
  async updateStatus(
    id: string,
    status: ConfigStatus.APPROVED | ConfigStatus.REJECTED,
  ) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('termination benefit not found');

    // Allowed transitions:
    // draft → approved
    // draft → rejected
    // rejected → approved (resubmission scenario)
    if (![ConfigStatus.DRAFT, ConfigStatus.REJECTED].includes(doc.status)) {
      throw new BadRequestException(
        `Cannot change status because benefit is currently '${doc.status}'. Only draft or rejected termenation benefits can be modified.`,
      );
    }

    doc.status = status;
    return doc.save();
  }
}
