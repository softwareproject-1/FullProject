import { IsIn, IsMongoId } from 'class-validator';

export class SignOfferDto {
  @IsMongoId()
  signerId: string;

  @IsIn(['candidate', 'hr', 'manager'])
  role: 'candidate' | 'hr' | 'manager';
}
