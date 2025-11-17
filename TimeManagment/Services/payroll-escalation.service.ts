import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PayrollEscalation, PayrollEscalationDocument } from '../Models/payrollEscalation';

@Injectable()
export class PayrollEscalationService {
  constructor(
    @InjectModel(PayrollEscalation.name) private payrollEscalationModel: Model<PayrollEscalationDocument>,
  ) {}
}

