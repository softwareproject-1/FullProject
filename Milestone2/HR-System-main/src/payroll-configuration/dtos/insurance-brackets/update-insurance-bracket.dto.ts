import { PartialType } from '@nestjs/mapped-types';
import { CreateInsuranceBracketDto } from './create-insurance-bracket.dto';

export class UpdateInsuranceBracketDto extends PartialType(
  CreateInsuranceBracketDto,
) {}
