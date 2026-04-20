import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, Download, Trash2 } from 'lucide-react';
import { materialsApi } from '@/api/materials.api';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import type { EntityType } from '@/types/enums';
import { mimeTypeIcon, formatBytes, formatDate } from '@/utils';

const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
];

interface MaterialsManagerProps {
  entityType?: EntityType;
}

export function MaterialsManager({ entityType }: MaterialsManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState('');
  const queryClient = useQueryClient();

  const { data: materials, isLoading } = useQuery({
    queryKey: ['materials', entityType],
    queryFn: () => materialsApi.list(entityType).then((r) => r.data),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, et }: { file: File; et: EntityType }) =>
      materialsApi.upload(file, et),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      setUploadError('');
    },
    onError: (err: Error) => setUploadError(err.message ?? 'Upload failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => materialsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials'] }),
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_MIMES.includes(file.type)) {
      setUploadError('File type not supported. Allowed: PDF, Excel, PowerPoint, Word, images.');
      return;
    }
    const et: EntityType = entityType ?? 'INVESTOR';
    uploadMutation.mutate({ file, et });
    // reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleDownload = async (id: string, name: string) => {
    const { data } = await materialsApi.getDownloadUrl(id);
    const url = window.URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Materials{entityType ? ` — ${entityType === 'INVESTOR' ? 'Investor' : 'Partner'}` : ''}
        </h3>
        <div>
          <input ref={inputRef} type="file" className="hidden" accept={ALLOWED_MIMES.join(',')} onChange={handleFile} />
          <Button size="sm" onClick={() => inputRef.current?.click()} loading={uploadMutation.isPending} className="gap-1.5">
            <Upload size={14} />
            Upload
          </Button>
        </div>
      </div>

      {uploadError && (
        <Alert variant="error" onDismiss={() => setUploadError('')}>{uploadError}</Alert>
      )}

      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}

      {materials && materials.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <Upload size={32} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No materials yet. Upload PDF, Excel, or PowerPoint files.</p>
        </div>
      )}

      <div className="space-y-2">
        {materials?.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <span className="text-xl flex-shrink-0">{mimeTypeIcon(m.mimeType)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
              <p className="text-xs text-gray-400">
                {formatBytes(m.sizeBytes)} · {formatDate(m.createdAt)}
              </p>
            </div>
            <Badge variant={m.entityType === 'INVESTOR' ? 'info' : 'purple'}>
              {m.entityType === 'INVESTOR' ? 'Investor' : 'Partner'}
            </Badge>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(m.id, m.name)}
                title="Download"
              >
                <Download size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm(`Delete "${m.name}"?`)) deleteMutation.mutate(m.id);
                }}
                className="text-red-400 hover:text-red-600 hover:bg-red-50"
                title="Delete"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
