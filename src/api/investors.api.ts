import { api } from './client';
import type { Investor, PaginatedResponse, ImportResult } from '@/types/models';
import type { InvestorStage } from '@/types/enums';

export interface InvestorFilters {
  stage?: InvestorStage;
  search?: string;
  page?: number;
  limit?: number;
}

export const investorsApi = {
  list: (params: InvestorFilters = {}) =>
    api.get<PaginatedResponse<Investor>>('/investors', { params }),

  get: (id: string) =>
    api.get<Investor & { emailLogs: unknown[]; activities: unknown[] }>(`/investors/${id}`),

  create: (data: Partial<Investor>) => api.post<Investor>('/investors', data),

  update: (id: string, data: Partial<Investor>) => api.put<Investor>(`/investors/${id}`, data),

  delete: (id: string) => api.delete(`/investors/${id}`),

  importCsv: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<ImportResult>('/investors/import', form);
  },
};
