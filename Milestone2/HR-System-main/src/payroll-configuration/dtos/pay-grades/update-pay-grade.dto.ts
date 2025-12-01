import { PartialType } from '@nestjs/mapped-types';
import { CreatePayGradeDto } from './create-pay-grade.dto';

export class UpdatePayGradeDto extends PartialType(CreatePayGradeDto) {}
