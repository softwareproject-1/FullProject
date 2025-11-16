import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VacationLink, VacationLinkDocument } from '../Models/VacationLink';

@Injectable()
export class VacationLinkService {
  constructor(
    @InjectModel(VacationLink.name) private vacationLinkModel: Model<VacationLinkDocument>,
  ) {}
}

