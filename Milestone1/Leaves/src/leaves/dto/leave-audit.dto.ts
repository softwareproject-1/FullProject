import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum AuditTargetType {
  BALANCE = 'balance',
  REQUEST = 'request',
  TRANSACTION = 'transaction',
  SETTLEMENT = 'settlement',
}

export class CreateLeaveAuditDto {
  @IsString()
  @IsNotEmpty()
  auditId: string;

  @IsString()
  @IsNotEmpty()
  targetId: string;

  @IsNotEmpty()
  @IsString()
  targetType: AuditTargetType | string;

  @IsOptional()
  @IsString()
  changedBy?: string;

  @IsOptional()
  before?: any;

  @IsOptional()
  after?: any;

  @IsOptional()
  @IsString()
  reason?: string;
}

export default CreateLeaveAuditDto;
