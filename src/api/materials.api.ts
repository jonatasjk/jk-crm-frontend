import { api } from './client';
import type { Material } from '@/types/models';
import type { EntityType } from '@/types/enums';

export const materialsApi = {
  list: (entityType?: EntityType) =>
    api.get<Material[]>('/materials', { params: entityType ? { entityType } : {} }),

  upload: (file: File, entityType: EntityType, description?: string) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<Material>('/materials/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { entityType, ...(description ? { description } : {}) },
    });
  },

  getDownloadUrl: (id: string) =>
    api.get<Blob>(`/materials/${id}/download`, { responseType: 'blob' }),

  delete: (id: string) => api.delete(`/materials/${id}`),
};
