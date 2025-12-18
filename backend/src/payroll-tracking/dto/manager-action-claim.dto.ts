import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ManagerAction {
  CONFIRM = 'confirm',
  REJECT = 'reject'
}

export class ManagerActionClaimDto {
  @IsEnum(ManagerAction)
  @IsNotEmpty()
  action: ManagerAction;

  @IsString()
  @IsOptional()
  rejectionReason?: string; // Required if action is REJECT
}
