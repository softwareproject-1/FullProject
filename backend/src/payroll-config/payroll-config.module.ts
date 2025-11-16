import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  PayrollPolicy,
  PayrollPolicySchema,
} from './schemas/payroll-policy.schema';
import {
  PayGradeRule,
  PayGradeRuleSchema,
} from './schemas/paygrade-rule.schema';
import {
  AllowanceRule,
  AllowanceRuleSchema,
} from './schemas/allowance-rule.schema';
import { TaxBracket, TaxBracketSchema } from './schemas/tax-bracket.schema';
import {
  InsuranceRule,
  InsuranceRuleSchema,
} from './schemas/insurance-rule.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PayrollPolicy.name, schema: PayrollPolicySchema },
      { name: PayGradeRule.name, schema: PayGradeRuleSchema },
      { name: AllowanceRule.name, schema: AllowanceRuleSchema },
      { name: TaxBracket.name, schema: TaxBracketSchema },
      { name: InsuranceRule.name, schema: InsuranceRuleSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class PayrollConfigModule {}
