import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum EntityType {
  LEAVE_REQUEST = 'leaveRequest',
  LEAVE_BALANCE = 'leaveBalance',
  LEAVE_TRANSACTION = 'leaveTransaction',
  OFFBOARDING = 'offboarding',
}

export enum ExternalSystem {
  PAYROLL = 'PAYROLL',
  TIME_MANAGEMENT = 'TIME_MANAGEMENT',
  OTHER = 'OTHER',
}

export enum IntegrationAction {
  BLOCK_ATTENDANCE = 'block_attendance',
  UNBLOCK_ATTENDANCE = 'unblock_attendance',
  ENCASHMENT = 'encashment',
  UPDATE_BALANCE = 'update_balance',
  GENERIC = 'generic',
}

export class CreateIntegrationLogDto {
  @IsString()
  @IsNotEmpty()
  logId: string;

  @IsEnum(EntityType)
  @IsNotEmpty()
  entityType: EntityType; // What is being synced (REQ-029/030)

  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsEnum(ExternalSystem)
  externalSystem: ExternalSystem;

  @IsEnum(IntegrationAction)
  @IsNotEmpty()
  action: IntegrationAction; // Explicit operation name

  @IsOptional()
  @IsString()
  payloadSummary?: string;
}

export default CreateIntegrationLogDto;
