import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Policy, PolicyDocument } from '../Models/policyschema';

@Injectable()
export class PolicyService {
  constructor(
    @InjectModel(Policy.name) private policyModel: Model<PolicyDocument>,
  ) {}
}

