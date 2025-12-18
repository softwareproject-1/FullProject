import { PartialType } from '@nestjs/mapped-types';
import { CreateTerminationBenefitsDto } from './create-termination-benefits.dto';

export class UpdateTerminationBenefitsDto extends PartialType(
  CreateTerminationBenefitsDto,
) {}