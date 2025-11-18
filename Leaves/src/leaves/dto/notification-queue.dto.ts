import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum NotificationType {
  APPROVAL_REMINDER = 'approval_reminder',
  ESCALATION = 'escalation',
  INFO = 'info',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

export class CreateNotificationQueueDto {
  @IsString()
  @IsNotEmpty()
  queueId: string;

  @IsString()
  @IsNotEmpty()
  requestId: string;

  @IsString()
  @IsNotEmpty()
  targetUserId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsDateString()
  sentAt?: string;

  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;

  @IsOptional()
  @IsString()
  lastError?: string;
}

export default CreateNotificationQueueDto;
