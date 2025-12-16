import { IsMongoId, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApprovalStatus } from '../enums/approval-status.enum';

export class ApproveOfferDto {
  @IsMongoId()
  employeeId: string;

  @IsEnum(ApprovalStatus)
  status: ApprovalStatus;

  @IsOptional()
  @IsString()
  comment?: string;
}
