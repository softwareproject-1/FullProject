// import { randomUUID } from 'crypto';
// import { Injectable, NotFoundException } from '@nestjs/common';
// import { Model } from 'mongoose';
// import { InjectModel } from '@nestjs/mongoose';
// import { CompanyWideSettings } from '../models/CompanyWideSettings.schema';
// import { CreateCompanySettingsDto } from '../dtos/company-settings/create-company-settings.dto';
// import { UpdateCompanySettingsDto } from '../dtos/company-settings/update-company-settings.dto';

// @Injectable()
// export class CompanySettingsService {
//   private settingsStore = new Map<string, CreateCompanySettingsDto>();

//   create(dto: CreateCompanySettingsDto) {
//     const id = randomUUID();
//     this.settingsStore.set(id, dto);
//     return { id, ...dto };
//   }

//   findAll() {
//     return Array.from(this.settingsStore.entries()).map(([id, data]) => ({ id, ...data }));
//   }

//   findOne(id: string) {
//     const entry = this.settingsStore.get(id);
//     if (!entry) throw new NotFoundException('Company settings not found');
//     return { id, ...entry };
//   }

//   update(id: string, dto: UpdateCompanySettingsDto) {
//     const existing = this.settingsStore.get(id);
//     if (!existing) throw new NotFoundException('Company settings not found');
//     const updated = { ...existing, ...dto };
//     this.settingsStore.set(id, updated);
//     return { id, ...updated };
//   }

//   remove(id: string) {
//     const existed = this.settingsStore.delete(id);
//     if (!existed) throw new NotFoundException('Company settings not found');
//     return { deleted: true, id };
//   }
// }
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompanyWideSettings } from '../models/CompanyWideSettings.schema';
import { CreateCompanySettingsDto } from '../dtos/company-settings/create-company-settings.dto';
import { UpdateCompanySettingsDto } from '../dtos/company-settings/update-company-settings.dto';
import { strictUpdate } from '../helpers/strict-update';
import {
  buildDeleteMessage,
  buildUpdateMessage,
} from '../helpers/response-message';

@Injectable()
export class CompanySettingsService {
  constructor(
    @InjectModel(CompanyWideSettings.name)
    private readonly model: Model<CompanyWideSettings>,
  ) {}

  // async create(dto: CreateCompanySettingsDto) {
  //   const newDoc = new this.model(dto);
  //   return newDoc.save();
  // }
async create(dto: CreateCompanySettingsDto) {
  // Validate that only allowed fields are in the DTO
  const safeDto = strictUpdate(dto, this.model);

  const created = new this.model(safeDto);
  return created.save();
}
  async findAll() {
    return this.model.find().exec();
  }

  async findOne(id: string) {
    return this.model.findById(id).exec();
  }

  // async update(id: string, dto: UpdateCompanySettingsDto) {
  //   return this.model.findByIdAndUpdate(id, dto, { new: true }).exec();
  // }
  async update(id: string, dto: UpdateCompanySettingsDto) {
    const safeDto = strictUpdate(dto, this.model);

    const updated = await this.model
      .findByIdAndUpdate(id, safeDto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('company settings not found');

    const fields = Object.keys(safeDto);
    return {
      message: buildUpdateMessage('company settings', fields),
      data: updated,
    };
  }

  async remove(id: string) {
    const removed = await this.model.findByIdAndDelete(id).exec();
    if (!removed) throw new NotFoundException('company settings not found');

    return {
      message: buildDeleteMessage('company settings'),
      data: removed,
    };
  }
  
}
