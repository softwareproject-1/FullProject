import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TimeReport, TimeReportDocument } from '../Models/TimeReport';

@Injectable()
export class TimeReportService {
  constructor(
    @InjectModel(TimeReport.name) private timeReportModel: Model<TimeReportDocument>,
  ) {}
}

