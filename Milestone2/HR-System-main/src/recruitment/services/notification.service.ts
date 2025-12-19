/**
 * NotificationService (MongoDB-Persisted Implementation)
 * 
 * ONB-005: As a New Hire, I want to receive reminders and notifications,
 *          so that I don't miss important onboarding tasks.
 * 
 * BR 12: The system must support sending reminders and task assignments
 *        to responsible parties, and track delivery and status accordingly.
 * 
 * This service persists notifications to MongoDB using the NotificationLog schema
 * from time-management module.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationLog, NotificationLogDocument } from '../../time-management/models/notification-log.schema';

/**
 * Notification types supported by the system
 */
export type NotificationType =
  | 'TASK_REMINDER'
  | 'TASK_ASSIGNED'
  | 'TASK_OVERDUE'
  | 'DOCUMENT_REQUIRED'
  | 'ONBOARDING_STARTED'
  | 'ONBOARDING_COMPLETED'
  | 'OFFER_SENT'
  | 'OFFER_SIGNED'
  | 'CONTRACT_READY'
  // ONB-009: IT Provisioning notifications
  | 'IT_PROVISIONING_REQUESTED'
  | 'IT_PROVISIONING_COMPLETED'
  | 'SYSTEM_ACCESS_GRANTED'
  // ONB-012: Resource reservation notifications (to Facilities/Admin)
  | 'EQUIPMENT_RESERVED'
  | 'DESK_RESERVED'
  | 'ACCESS_CARD_RESERVED'
  | 'RESOURCE_READY'
  // Offboarding notification types
  | 'TERMINATION_INITIATED'
  | 'RESIGNATION_SUBMITTED'
  | 'RESIGNATION_STATUS_CHANGED'
  | 'CLEARANCE_COMPLETE'
  | 'FINAL_SETTLEMENT_STARTED'
  | 'ACCESS_REVOKED';

/**
 * Notification channel types
 */
export type NotificationChannel = 'EMAIL' | 'SMS' | 'IN_APP' | 'CONSOLE';

/**
 * Interface for notification payload
 */
export interface NotificationPayload {
  recipientId: string;
  recipientEmail?: string;
  type: NotificationType;
  subject: string;
  message: string;
  channel?: NotificationChannel;
  metadata?: Record<string, any>;
}

/**
 * Interface for notification record
 */
export interface NotificationRecord {
  notificationId: string;
  recipientId: string;
  type: NotificationType;
  subject: string;
  message: string;
  channel: NotificationChannel;
  sentAt: Date;
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING';
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(NotificationLog.name)
    private readonly notificationLogModel: Model<NotificationLogDocument>,
  ) { }

  /**
   * Send a notification (persists to MongoDB)
   * 
   * @param payload - The notification payload
   * @returns NotificationRecord - The sent notification record
   */
  async sendNotification(payload: NotificationPayload): Promise<NotificationRecord> {
    // Persist to MongoDB
    const savedLog = await this.notificationLogModel.create({
      to: new Types.ObjectId(payload.recipientId),
      type: payload.type,
      message: `${payload.subject}: ${payload.message}`,
    });

    const record: NotificationRecord = {
      notificationId: savedLog._id.toString(),
      recipientId: payload.recipientId,
      type: payload.type,
      subject: payload.subject,
      message: payload.message,
      channel: payload.channel || 'IN_APP',
      sentAt: new Date(), // Using current time since timestamps are auto-managed
      status: 'SENT',
      metadata: payload.metadata,
    };

    // Log to console for debugging
    console.log('========================================');
    console.log('📧 NOTIFICATION SENT');
    console.log('========================================');
    console.log(`ID: ${record.notificationId}`);
    console.log(`To: ${payload.recipientId}${payload.recipientEmail ? ` (${payload.recipientEmail})` : ''}`);
    console.log(`Type: ${payload.type}`);
    console.log(`Subject: ${payload.subject}`);
    console.log(`Message: ${payload.message}`);
    console.log(`Channel: ${record.channel}`);
    console.log(`Time: ${record.sentAt.toISOString()}`);
    if (payload.metadata) {
      console.log(`Metadata: ${JSON.stringify(payload.metadata)}`);
    }
    console.log('========================================');

    return record;
  }

  /**
   * Send a task reminder notification
   */
  async sendTaskReminder(
    recipientId: string,
    taskName: string,
    deadline: Date,
    isOverdue: boolean,
    recipientEmail?: string,
  ): Promise<NotificationRecord> {
    const daysUntil = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return this.sendNotification({
      recipientId,
      recipientEmail,
      type: isOverdue ? 'TASK_OVERDUE' : 'TASK_REMINDER',
      subject: isOverdue
        ? `⚠️ Overdue Task: ${taskName}`
        : `📋 Task Reminder: ${taskName}`,
      message: isOverdue
        ? `Your task "${taskName}" is overdue by ${Math.abs(daysUntil)} days. Please complete it as soon as possible.`
        : `Your task "${taskName}" is due in ${daysUntil} days (${deadline.toDateString()}). Please ensure it's completed on time.`,
      metadata: { taskName, deadline: deadline.toISOString(), daysUntil, isOverdue },
    });
  }

  /**
   * Send onboarding started notification
   */
  async sendOnboardingStartedNotification(
    recipientId: string,
    employeeName: string,
    startDate: Date,
    recipientEmail?: string,
  ): Promise<NotificationRecord> {
    return this.sendNotification({
      recipientId,
      recipientEmail,
      type: 'ONBOARDING_STARTED',
      subject: `🎉 Welcome! Your Onboarding Has Begun`,
      message: `Welcome ${employeeName}! Your onboarding process has started. Your start date is ${startDate.toDateString()}. Please check your onboarding tracker for tasks to complete.`,
      metadata: { employeeName, startDate: startDate.toISOString() },
    });
  }

  /**
   * Send offer letter notification
   */
  async sendOfferLetterNotification(
    recipientId: string,
    candidateName: string,
    position: string,
    recipientEmail?: string,
    personalMessage?: string,
  ): Promise<NotificationRecord> {
    return this.sendNotification({
      recipientId,
      recipientEmail,
      type: 'OFFER_SENT',
      subject: `📄 Job Offer: ${position}`,
      message: `Dear ${candidateName}, we are pleased to extend you an offer for the position of ${position}. ${personalMessage || 'Please review and sign the attached offer letter.'}`,
      metadata: { candidateName, position },
    });
  }

  /**
   * Send document required notification
   */
  async sendDocumentRequiredNotification(
    recipientId: string,
    documentType: string,
    deadline: Date,
    recipientEmail?: string,
  ): Promise<NotificationRecord> {
    return this.sendNotification({
      recipientId,
      recipientEmail,
      type: 'DOCUMENT_REQUIRED',
      subject: `📎 Document Required: ${documentType}`,
      message: `Please upload your ${documentType} by ${deadline.toDateString()}. This document is required to complete your onboarding process.`,
      metadata: { documentType, deadline: deadline.toISOString() },
    });
  }

  /**
   * Send onboarding completion notification
   */
  async sendOnboardingComplete(
    recipientId: string,
    message: string,
    recipientEmail?: string,
  ): Promise<NotificationRecord> {
    return this.sendNotification({
      recipientId,
      recipientEmail,
      type: 'ONBOARDING_COMPLETED',
      subject: `🎉 Onboarding Complete!`,
      message,
      metadata: { completedAt: new Date().toISOString() },
    });
  }

  /**
   * ONB-009: Send IT provisioning notification
   * Notifies IT/System Admin about provisioning requests
   */
  async sendProvisioningNotification(
    recipientId: string,
    employeeName: string,
    systems: string[],
    notificationType: 'IT_PROVISIONING_REQUESTED' | 'IT_PROVISIONING_COMPLETED' | 'SYSTEM_ACCESS_GRANTED',
    recipientEmail?: string,
  ): Promise<NotificationRecord> {
    const subjects = {
      'IT_PROVISIONING_REQUESTED': `💻 IT Provisioning Request: ${employeeName}`,
      'IT_PROVISIONING_COMPLETED': `✅ IT Provisioning Complete: ${employeeName}`,
      'SYSTEM_ACCESS_GRANTED': `🔑 System Access Granted: ${employeeName}`,
    };
    const messages = {
      'IT_PROVISIONING_REQUESTED': `System access provisioning requested for ${employeeName}. Systems: ${systems.join(', ')}. Please set up access before their start date.`,
      'IT_PROVISIONING_COMPLETED': `System access provisioning completed for ${employeeName}. Systems: ${systems.join(', ')}.`,
      'SYSTEM_ACCESS_GRANTED': `${employeeName} has been granted access to: ${systems.join(', ')}.`,
    };

    return this.sendNotification({
      recipientId,
      recipientEmail,
      type: notificationType,
      subject: subjects[notificationType],
      message: messages[notificationType],
      metadata: { employeeName, systems, requestedAt: new Date().toISOString() },
    });
  }

  /**
   * ONB-012: Send resource reservation notification
   * Notifies Facilities/Admin about equipment, desk, or access card reservations
   */
  async sendResourceReservationNotification(
    recipientId: string,
    employeeName: string,
    resourceType: 'equipment' | 'desk' | 'access_card',
    resourceDetails: string,
    neededByDate: string,
    recipientEmail?: string,
  ): Promise<NotificationRecord> {
    const typeMap = {
      'equipment': 'EQUIPMENT_RESERVED' as NotificationType,
      'desk': 'DESK_RESERVED' as NotificationType,
      'access_card': 'ACCESS_CARD_RESERVED' as NotificationType,
    };
    const subjectMap = {
      'equipment': `🖥️ Equipment Reserved: ${employeeName}`,
      'desk': `🪑 Desk Reserved: ${employeeName}`,
      'access_card': `🔏 Access Card Reserved: ${employeeName}`,
    };
    const messageMap = {
      'equipment': `Equipment reservation for ${employeeName}: ${resourceDetails}. Please prepare by ${neededByDate}.`,
      'desk': `Desk/workspace reservation for ${employeeName}: ${resourceDetails}. Please prepare by ${neededByDate}.`,
      'access_card': `Access card reservation for ${employeeName}: ${resourceDetails}. Please prepare by ${neededByDate}.`,
    };

    return this.sendNotification({
      recipientId,
      recipientEmail,
      type: typeMap[resourceType],
      subject: subjectMap[resourceType],
      message: messageMap[resourceType],
      metadata: {
        employeeName,
        resourceType,
        resourceDetails,
        neededByDate,
        reservedAt: new Date().toISOString()
      },
    });
  }

  /**
   * Get all notifications for a recipient
   */
  async getNotificationsForRecipient(recipientId: string): Promise<NotificationRecord[]> {
    const logs = await this.notificationLogModel.find({
      to: new Types.ObjectId(recipientId),
    }).exec();

    return logs.map((log) => ({
      notificationId: log._id.toString(),
      recipientId: log.to.toString(),
      type: log.type as NotificationType,
      subject: log.type,
      message: log.message || '',
      channel: 'IN_APP' as NotificationChannel,
      sentAt: new Date(), // Using current time as fallback
      status: 'SENT' as const,
    }));
  }

  /**
   * Get all notification logs (for admin/debugging)
   */
  async getAllNotifications(): Promise<NotificationRecord[]> {
    const logs = await this.notificationLogModel.find().exec();

    return logs.map((log) => ({
      notificationId: log._id.toString(),
      recipientId: log.to.toString(),
      type: log.type as NotificationType,
      subject: log.type,
      message: log.message || '',
      channel: 'IN_APP' as NotificationChannel,
      sentAt: new Date(), // Using current time as fallback
      status: 'SENT' as const,
    }));
  }

  /**
   * Clear notification log (for testing only)
   */
  async clearLog(): Promise<void> {
    await this.notificationLogModel.deleteMany({}).exec();
  }
}
