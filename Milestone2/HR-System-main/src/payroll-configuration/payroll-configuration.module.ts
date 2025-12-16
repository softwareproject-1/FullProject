// import { Module } from '@nestjs/common';
// import { PayrollConfigurationController } from './payroll-configuration.controller';
// import { PayrollConfigurationService } from './payroll-configuration.service';
// import { CompanyWideSettings, CompanyWideSettingsSchema } from './models/CompanyWideSettings.schema';
// import { MongooseModule } from '@nestjs/mongoose';
// import { allowance, allowanceSchema } from './models/allowance.schema';
// import { insuranceBrackets, insuranceBracketsSchema } from './models/insuranceBrackets.schema';
// import { payrollPolicies, payrollPoliciesSchema } from './models/payrollPolicies.schema';
// import { payType, payTypeSchema } from './models/payType.schema';
// import { signingBonus, signingBonusSchema } from './models/signingBonus.schema';
// import { taxRules, taxRulesSchema } from './models/taxRules.schema';
// import { terminationAndResignationBenefits, terminationAndResignationBenefitsSchema } from './models/terminationAndResignationBenefits';
// import { payGrade } from './models/payGrades.schema';

// @Module({
//   imports: [
//     MongooseModule.forFeature([
//       { name: allowance.name, schema: allowanceSchema },
//       { name: signingBonus.name, schema: signingBonusSchema },
//       { name: taxRules.name, schema: taxRulesSchema },
//       { name: insuranceBrackets.name, schema: insuranceBracketsSchema },
//       { name: payType.name, schema: payTypeSchema },
//       { name: payrollPolicies.name, schema: payrollPoliciesSchema },
//       { name: terminationAndResignationBenefits.name, schema: terminationAndResignationBenefitsSchema },
//       { name: CompanyWideSettings.name, schema: CompanyWideSettingsSchema },
//       { name: payGrade.name, schema: payTypeSchema }
//     ]),
//   ],
//   controllers: [PayrollConfigurationController],
//   providers: [PayrollConfigurationService],
//   exports:[PayrollConfigurationService]
// })
// export class PayrollConfigurationModule { }
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Controllers
import { CompanySettingsController } from './controllers/company-settings.controller';
import { PayGradesController } from './controllers/pay-grades.controller';
import { PayTypeController } from './controllers/pay-type.controller';
import { AllowanceController } from './controllers/allowance.controller';
import { SigningBonusController } from './controllers/signing-bonus.controller';
import { TerminationAndResignationBenefitsController } from './controllers/termination-and-resignation-benefits.controller';
import { TaxRulesController } from './controllers/tax-rules.controller';
import { InsuranceBracketsController } from './controllers/insurance-brackets.controller';
import { PayrollPoliciesController } from './controllers/payroll-policies.controller';
import { BackupController } from './controllers/backup.controller';
// Services
import { CompanySettingsService } from './services/company-settings.service';
import { PayGradesService } from './services/pay-grades.service';
import { PayTypeService } from './services/pay-type.service';
import { AllowanceService } from './services/allowance.service';
import { SigningBonusService } from './services/signing-bonus.service';
import { TerminationAndResignationBenefitsService } from './services/termination-and-resignation-benefits.service';
import { TaxRulesService } from './services/tax-rules.service';
import { InsuranceBracketsService } from './services/insurance-brackets.service';
import { PayrollPoliciesService } from './services/payroll-policies.service';
import { BackupService } from './services/backup.service';
// Schemas
import {
  CompanyWideSettings,
  CompanyWideSettingsSchema,
} from './models/CompanyWideSettings.schema';
import { allowance, allowanceSchema } from './models/allowance.schema';
import {
  insuranceBrackets,
  insuranceBracketsSchema,
} from './models/insuranceBrackets.schema';
import {
  payrollPolicies,
  payrollPoliciesSchema,
} from './models/payrollPolicies.schema';
import { payType, payTypeSchema } from './models/payType.schema';
import { signingBonus, signingBonusSchema } from './models/signingBonus.schema';
import { taxRules, taxRulesSchema } from './models/taxRules.schema';
import {
  terminationAndResignationBenefits,
  terminationAndResignationBenefitsSchema,
} from './models/terminationAndResignationBenefits';
import { payGrade, payGradeSchema } from './models/payGrades.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: allowance.name, schema: allowanceSchema },
      { name: signingBonus.name, schema: signingBonusSchema },
      { name: taxRules.name, schema: taxRulesSchema },
      { name: insuranceBrackets.name, schema: insuranceBracketsSchema },
      { name: payType.name, schema: payTypeSchema },
      { name: payrollPolicies.name, schema: payrollPoliciesSchema },
      {
        name: terminationAndResignationBenefits.name,
        schema: terminationAndResignationBenefitsSchema,
      },
      { name: CompanyWideSettings.name, schema: CompanyWideSettingsSchema },
      { name: payGrade.name, schema: payGradeSchema },
    ]),
  ],
  controllers: [
    CompanySettingsController,
    PayGradesController,
    PayTypeController,
    AllowanceController,
    SigningBonusController,
    TerminationAndResignationBenefitsController,
    TaxRulesController,
    InsuranceBracketsController,
    PayrollPoliciesController,
    BackupController,
  ],
  providers: [
    CompanySettingsService,
    PayGradesService,
    PayTypeService,
    AllowanceService,
    SigningBonusService,
    TerminationAndResignationBenefitsService,
    TaxRulesService,
    InsuranceBracketsService,
    PayrollPoliciesService,
    BackupService,
  ],
  exports: [
    CompanySettingsService,
    PayGradesService,
    PayTypeService,
    AllowanceService,
    SigningBonusService,
    TerminationAndResignationBenefitsService,
    TaxRulesService,
    InsuranceBracketsService,
    PayrollPoliciesService,
    BackupService,
  ],
})
export class PayrollConfigurationModule {}
