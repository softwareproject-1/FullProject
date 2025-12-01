import { PartialType } from '@nestjs/mapped-types';
import { CreatePayTypeDto } from './create-pay-type.dto';

export class UpdatePayTypeDto extends PartialType(CreatePayTypeDto) {}
