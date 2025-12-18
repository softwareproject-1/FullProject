import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { ConfigStatus } from '../enums/payroll-configuration-enums';

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

    const created = new this.insuranceModel({
      ...safeDto,
      status: 'draft', // enforce workflow rule
    });
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
    const doc = await this.insuranceModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Insurance bracket not found');

    // Workflow rule: cannot update if not draft
    if (doc.status !== 'draft') {
      throw new BadRequestException(
        `Cannot update insurance bracket because it is already ${doc.status}. Only draft insurance brackets can be updated.`,
      );
    }

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
    const doc = await this.insuranceModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Insurance bracket not found');

    // Workflow rule: cannot delete if not draft
    if (doc.status !== 'draft') {
      throw new BadRequestException(
        `Cannot delete insurance bracket because it is already ${doc.status}. Only draft insurance brackets can be deleted.`,
      );
    }

    const res = await this.insuranceModel.findByIdAndDelete(id).exec();
    return {
      message: buildDeleteMessage('insurance bracket'),
      data: res,
    };
  }

  // STATUS UPDATE → Payroll Manager ONLY
  async updateStatus(
    id: string,
    status: ConfigStatus.APPROVED | ConfigStatus.REJECTED,
  ) {
    const doc = await this.insuranceModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Insurance bracket not found');

    // Allowed transitions:
    // draft → approved
    // draft → rejected
    // rejected → approved (resubmission scenario)
    if (![ConfigStatus.DRAFT, ConfigStatus.REJECTED].includes(doc.status)) {
      throw new BadRequestException(
        `Cannot change status because insurance bracket is currently '${doc.status}'. Only draft or rejected insurance brackets can be modified.`,
      );
    }

    doc.status = status;
    return doc.save();
  }
}
