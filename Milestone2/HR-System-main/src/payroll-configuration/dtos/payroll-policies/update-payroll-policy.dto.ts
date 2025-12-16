import { PartialType } from '@nestjs/mapped-types';
import { CreatePayrollPolicyDto } from './create-payroll-policy.dto';

export class UpdatePayrollPolicyDto extends PartialType(
  CreatePayrollPolicyDto,
) {}
