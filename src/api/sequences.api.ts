import { api } from './client';
import type { Sequence, Enrollment, SequenceStep } from '@/types/models';
import type { EntityType } from '@/types/enums';

export interface CreateSequencePayload {
  name: string;
  description?: string;
  entityType: EntityType;
}

export interface UpdateSequencePayload {
  name?: string;
  description?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'PAUSED';
  scheduledStartAt?: string;
  steps?: SequenceStep[];
}

export const sequencesApi = {
  list: () => api.get<Sequence[]>('/sequences'),

  get: (id: string) => api.get<Sequence>(`/sequences/${id}`),

  create: (payload: CreateSequencePayload) =>
    api.post<Sequence>('/sequences', payload),

  update: (id: string, payload: UpdateSequencePayload) =>
    api.put<Sequence>(`/sequences/${id}`, payload),

  delete: (id: string) => api.delete(`/sequences/${id}`),

  getEnrollments: (id: string) =>
    api.get<Enrollment[]>(`/sequences/${id}/enrollments`),

  enroll: (sequenceId: string, entityId: string) =>
    api.post<Enrollment>(`/sequences/${sequenceId}/enroll`, { entityId }),

  enrollAll: (sequenceId: string, options?: { notEnrolledInAnySequence?: boolean }) =>
    api.post<{ enrolled: number; skipped: number }>(`/sequences/${sequenceId}/enroll-all`, options ?? {}),

  unenroll: (enrollmentId: string) =>
    api.post<Enrollment>(`/enrollments/${enrollmentId}/unenroll`),

  markReplied: (enrollmentId: string) =>
    api.post<Enrollment>(`/enrollments/${enrollmentId}/replied`),
};
