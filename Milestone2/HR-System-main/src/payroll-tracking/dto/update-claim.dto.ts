import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ClaimStatus } from '../enums/payroll-tracking-enum';

export class UpdateClaimDto {
  @IsEnum(ClaimStatus)
  @IsNotEmpty()
  status: ClaimStatus;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
