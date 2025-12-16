import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SyncLog, SyncLogDocument } from '../Models/SyncLog';

@Injectable()
export class SyncLogService {
  constructor(
    @InjectModel(SyncLog.name) private syncLogModel: Model<SyncLogDocument>,
  ) {}
}

