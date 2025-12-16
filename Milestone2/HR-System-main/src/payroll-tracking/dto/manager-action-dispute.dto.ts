import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ManagerAction {
  CONFIRM = 'confirm',
  REJECT = 'reject'
}

export class ManagerActionDisputeDto {
  @IsEnum(ManagerAction)
  @IsNotEmpty()
  action: ManagerAction;

  @IsString()
  @IsOptional()
  rejectionReason?: string; // Required if action is REJECT
}
