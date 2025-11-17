import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ShiftAssignment, ShiftAssignmentDocument } from '../Models/ShiftAssignment';

@Injectable()
export class ShiftAssignmentService {
  constructor(
    @InjectModel(ShiftAssignment.name) private shiftAssignmentModel: Model<ShiftAssignmentDocument>,
  ) {}
}

