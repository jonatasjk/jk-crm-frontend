import { api } from './client';
import type { EmailLog, EmailStats } from '@/types/models';
import type { EntityType } from '@/types/enums';

export interface SendEmailPayload {
  entityId: string;
  entityType: EntityType;
  subject: string;
  body: string;
  materialIds: string[];
}

export interface EmailLogEntry extends EmailLog {
  entityType: 'INVESTOR' | 'PARTNER';
  entityId: string;
  recipientName: string;
  recipientEmail: string;
}

export const emailApi = {
  send: (payload: SendEmailPayload) =>
    api.post<{ success: boolean; messageId: string; emailLogId: string }>('/email/send', payload),

  getLogs: (entityType: EntityType, entityId: string) =>
    api.get<EmailLog[]>(`/email/logs/${entityType.toLowerCase()}/${entityId}`),

  listAll: () =>
    api.get<EmailLogEntry[]>('/email/logs'),

  getStats: () =>
    api.get<EmailStats>('/email/stats'),
};
