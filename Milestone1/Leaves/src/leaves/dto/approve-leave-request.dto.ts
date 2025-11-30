import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ApprovalAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  DELEGATE = 'delegate',
  OVERRIDE = 'override',
}

export class ApproveLeaveRequestDto {
  @IsEnum(ApprovalAction)
  action: ApprovalAction;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  delegateToUserId?: string;
}

export default ApproveLeaveRequestDto;
