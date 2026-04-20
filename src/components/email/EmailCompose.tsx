import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Paperclip, X, Send } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { materialsApi } from '@/api/materials.api';
import { emailApi } from '@/api/email.api';
import type { EntityType } from '@/types/enums';
import type { Material } from '@/types/models';
import { mimeTypeIcon, formatBytes } from '@/utils';

const schema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
});

type FormData = z.infer<typeof schema>;

interface EmailComposeProps {
  entityId: string;
  entityType: EntityType;
  recipientName: string;
  recipientEmail: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EmailCompose({
  entityId,
  entityType,
  recipientName,
  recipientEmail,
  onSuccess,
  onCancel,
}: EmailComposeProps) {
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>([]);
  const [showMaterials, setShowMaterials] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data: materials } = useQuery({
    queryKey: ['materials', entityType],
    queryFn: () => materialsApi.list(entityType).then((r) => r.data),
  });

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: emailApi.send,
    onSuccess: () => {
      setSuccess(true);
      setTimeout(onSuccess, 1500);
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const toggleMaterial = (m: Material) => {
    setSelectedMaterials((prev) =>
      prev.find((x) => x.id === m.id) ? prev.filter((x) => x.id !== m.id) : [...prev, m],
    );
  };

  const onSubmit = async (data: FormData) => {
    await mutateAsync({
      entityId,
      entityType,
      subject: data.subject,
      body: data.body,
      materialIds: selectedMaterials.map((m) => m.id),
    });
  };

  if (success) {
    return <Alert variant="success" title="Email sent!">Your email has been sent successfully.</Alert>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="bg-indigo-50 rounded-lg px-4 py-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {recipientName[0]?.toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{recipientName}</p>
          <p className="text-xs text-gray-500">{recipientEmail}</p>
        </div>
      </div>

      {isError && (
        <Alert variant="error">
          {(error as Error)?.message ?? 'Failed to send email'}
        </Alert>
      )}

      <Input label="Subject" placeholder="Re: Investment opportunity..." error={errors.subject?.message} {...register('subject')} />
      <Controller
        name="body"
        control={control}
        render={({ field }) => (
          <RichTextEditor
            label="Body"
            tags={['{{first_name}}', '{{last_name}}', '{{name}}']}
            value={field.value ?? ''}
            onChange={field.onChange}
            error={errors.body?.message}
          />
        )}
      />

      {/* Attachments section */}
      {selectedMaterials.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Attachments ({selectedMaterials.length})</p>
          <div className="flex flex-wrap gap-2">
            {selectedMaterials.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2 py-1 text-xs"
              >
                <span>{mimeTypeIcon(m.mimeType)}</span>
                <span className="max-w-[120px] truncate">{m.name}</span>
                <button
                  type="button"
                  onClick={() => toggleMaterial(m)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showMaterials && (
        <div className="border border-gray-200 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
          <p className="text-sm font-medium text-gray-700 mb-2">Available materials</p>
          {materials && materials.length > 0 ? (
            materials.map((m) => {
              const selected = !!selectedMaterials.find((x) => x.id === m.id);
              return (
                <label
                  key={m.id}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleMaterial(m)}
                    className="rounded"
                  />
                  <span className="text-base">{mimeTypeIcon(m.mimeType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                    <p className="text-xs text-gray-400">{formatBytes(m.sizeBytes)}</p>
                  </div>
                </label>
              );
            })
          ) : (
            <p className="text-sm text-gray-400 text-center py-3">No materials uploaded yet</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowMaterials((p) => !p)}
          className="gap-1.5"
        >
          <Paperclip size={14} />
          {showMaterials ? 'Hide materials' : 'Attach materials'}
        </Button>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" loading={isPending} className="gap-2">
            <Send size={14} />
            Send email
          </Button>
        </div>
      </div>
    </form>
  );
}
