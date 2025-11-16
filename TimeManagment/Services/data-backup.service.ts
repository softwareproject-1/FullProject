import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DataBackup, DataBackupDocument } from '../Models/DataBackup';

@Injectable()
export class DataBackupService {
  constructor(
    @InjectModel(DataBackup.name) private dataBackupModel: Model<DataBackupDocument>,
  ) {}
}

