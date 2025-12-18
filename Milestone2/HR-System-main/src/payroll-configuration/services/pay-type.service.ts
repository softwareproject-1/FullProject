import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { ConfigStatus } from '../enums/payroll-configuration-enums';

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
    if (!doc) throw new NotFoundException('Pay type not found');
    return doc;
  }

  async update(id: string, dto: UpdatePayTypeDto) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('pay type not found');

    // Workflow rule: cannot update if not draft
    if (doc.status !== 'draft') {
      throw new BadRequestException(
        `Cannot update pay type because it is already ${doc.status}. Only draft pay types can be updated.`,
      );
    }
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
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('Pay type not found');

    // Workflow rule: cannot delete if not draft
    if (doc.status !== 'draft') {
      throw new BadRequestException(
        `Cannot delete pay type because it is already ${doc.status}. Only draft pay types can be deleted.`,
      );
    }

    const removed = await this.model.findByIdAndDelete(id).exec();
    return {
      message: buildDeleteMessage('pay type'),
      data: removed,
    };
  }

  // STATUS UPDATE → Payroll Manager ONLY
  async updateStatus(
    id: string,
    status: ConfigStatus.APPROVED | ConfigStatus.REJECTED,
  ) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('pay type not found');

    // Allowed transitions:
    // draft → approved
    // draft → rejected
    // rejected → approved (resubmission scenario)
    if (![ConfigStatus.DRAFT, ConfigStatus.REJECTED].includes(doc.status)) {
      throw new BadRequestException(
        `Cannot change status because pay type is currently '${doc.status}'. Only draft or rejected pay types can be modified.`,
      );
    }

    doc.status = status;
    return doc.save();
  }
}
