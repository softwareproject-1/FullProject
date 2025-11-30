import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AttendanceLog, AttendanceLogDocument } from '../Models/AttendanceLog';

@Injectable()
export class AttendanceLogService {
  constructor(
    @InjectModel(AttendanceLog.name) private attendanceLogModel: Model<AttendanceLogDocument>,
  ) {}
}

