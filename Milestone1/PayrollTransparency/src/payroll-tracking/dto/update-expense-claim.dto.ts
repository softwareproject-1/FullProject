import {
  IsString,
  IsEnum,
  IsNumber,
  Min,
  IsDateString,
  IsUrl,
  IsOptional,
} from 'class-validator';
import { ClaimType, ClaimStatus } from '../schemas/expense-claim.schema';

export class UpdateExpenseClaimDto {
  @IsString()
  @IsOptional()
  employee?: string;

  @IsString()
  @IsOptional()
  refund?: string;

  @IsString()
  @IsOptional()
  reviewedBySpecialist?: string;

  @IsEnum(ClaimType)
  @IsOptional()
  claimType?: ClaimType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsDateString()
  @IsOptional()
  claimDate?: Date;

  @IsUrl()
  @IsOptional()
  receiptUrl?: string;

  @IsEnum(ClaimStatus)
  @IsOptional()
  status?: ClaimStatus;
}
