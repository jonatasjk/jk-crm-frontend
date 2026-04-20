import type { InvestorStage, PartnerStage, EntityType, EmailStatus } from './enums';

export interface Investor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  linkedinUrl?: string;
  stage: InvestorStage;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  _count?: { emailLogs: number; activities: number };
}

export interface Partner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  linkedinUrl?: string;
  stage: PartnerStage;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  _count?: { emailLogs: number; activities: number };
}

export interface Material {
  id: string;
  name: string;
  description?: string;
  fileKey: string;
  mimeType: string;
  sizeBytes: number;
  entityType: EntityType;
  createdAt: string;
  updatedAt: string;
}

export interface EmailStats {
  sentToday: number;
}

export interface EmailLog {
  id: string;
  subject: string;
  body: string;
  status: EmailStatus;
  sesMessageId?: string;
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
  attachments: Array<{ id: string; material: Pick<Material, 'id' | 'name' | 'mimeType'> }>;
}

export interface Activity {
  id: string;
  type: string;
  detail: string;
  createdAt: string;
}

export interface SequenceStep {
  order: number;
  subject: string;
  bodyHtml: string;
  delayDays: number;
  materialId?: string;
}

export interface Sequence {
  id: string;
  name: string;
  description?: string;
  entityType: EntityType;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED';
  scheduledStartAt?: string;
  steps: SequenceStep[];
  enrollments?: { total: number; active: number };
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  sequenceId: string;
  entityId: string;
  entityType: EntityType;
  status: 'ACTIVE' | 'COMPLETED' | 'REPLIED' | 'UNSUBSCRIBED';
  currentStepIndex: number;
  nextSendAt: string;
  enrolledAt: string;
  completedAt?: string;
  entityName: string;
  entityEmail: string;
  totalSteps: number;
  stepsLog: Array<{ stepIndex: number; sentAt: string; emailLogId: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ImportResult {
  created: number;
  updated: number;
  errors: Array<{ row: number; error: string }>;
  parseErrors: Array<{ row: number; error: string }>;
  total: number;
}
