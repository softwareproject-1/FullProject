import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AttendanceCorrectionRequest, AttendanceCorrectionRequestDocument } from '../Models/AttendanceCorrectionRequest';

@Injectable()
export class AttendanceCorrectionRequestService {
  constructor(
    @InjectModel(AttendanceCorrectionRequest.name) private attendanceCorrectionRequestModel: Model<AttendanceCorrectionRequestDocument>,
  ) {}
}

