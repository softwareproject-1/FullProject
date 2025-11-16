import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ShiftTemplate, ShiftTemplateDocument } from '../Models/ShiftTemplate';

@Injectable()
export class ShiftTemplateService {
  constructor(
    @InjectModel(ShiftTemplate.name) private shiftTemplateModel: Model<ShiftTemplateDocument>,
  ) {}
}

