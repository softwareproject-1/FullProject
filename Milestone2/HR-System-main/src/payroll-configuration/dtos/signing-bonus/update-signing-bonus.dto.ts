import { PartialType } from '@nestjs/mapped-types';
import { CreateSigningBonusDto } from './create-signing-bonus.dto';

export class UpdateSigningBonusDto extends PartialType(CreateSigningBonusDto) {}

