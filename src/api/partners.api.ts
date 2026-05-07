import { api } from './client';
import type { Partner, PaginatedResponse, ImportResult } from '@/types/models';
import type { PartnerStage } from '@/types/enums';

export interface PartnerFilters {
  stage?: PartnerStage;
  search?: string;
  page?: number;
  limit?: number;
  notEnrolledInAnySequence?: boolean;
}

export const partnersApi = {
  list: (params: PartnerFilters = {}) =>
    api.get<PaginatedResponse<Partner>>('/partners', { params }),

  get: (id: string) =>
    api.get<Partner & { emailLogs: unknown[]; activities: unknown[] }>(`/partners/${id}`),

  create: (data: Partial<Partner>) => api.post<Partner>('/partners', data),

  update: (id: string, data: Partial<Partner>) => api.put<Partner>(`/partners/${id}`, data),

  delete: (id: string) => api.delete(`/partners/${id}`),

  importCsv: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<ImportResult>('/partners/import', form);
  },
};
