import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TimeException, TimeExceptionDocument } from '../Models/TimeException';

@Injectable()
export class TimeExceptionService {
  constructor(
    @InjectModel(TimeException.name) private timeExceptionModel: Model<TimeExceptionDocument>,
  ) {}
}

