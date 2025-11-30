import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  IsDateString,
  IsUrl,
} from 'class-validator';
import { ClaimType } from '../schemas/expense-claim.schema';

export class CreateExpenseClaimDto {
  @IsString()
  @IsNotEmpty()
  employee: string;

  @IsEnum(ClaimType)
  @IsNotEmpty()
  claimType: ClaimType;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsDateString()
  @IsNotEmpty()
  claimDate: Date;

  @IsUrl()
  @IsNotEmpty()
  receiptUrl: string;
}
