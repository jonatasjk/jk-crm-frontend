import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Partner } from '@/types/models';
import { PARTNER_STAGES, PARTNER_STAGE_LABELS } from '@/types/enums';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  company: z.string().optional(),
  website: z.string().optional(),
  linkedinUrl: z.string().optional(),
  stage: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface PartnerFormProps {
  initial?: Partial<Partner>;
  onSubmit: (data: Partial<Partner>) => Promise<void>;
  onCancel: () => void;
}

export function PartnerForm({ initial, onSubmit, onCancel }: PartnerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: initial?.firstName ?? '',
      lastName: initial?.lastName ?? '',
      email: initial?.email ?? '',
      phone: initial?.phone ?? '',
      company: initial?.company ?? '',
      website: initial?.website ?? '',
      linkedinUrl: initial?.linkedinUrl ?? '',
      stage: initial?.stage ?? 'LEAD',
      notes: initial?.notes ?? '',
      tags: initial?.tags?.join(', ') ?? '',
    },
  });

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit({
      ...data,
      stage: data.stage as Partner['stage'],
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    });
  };

  const stageOptions = PARTNER_STAGES.map((s) => ({ value: s, label: PARTNER_STAGE_LABELS[s] }));

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name *" placeholder="John" error={errors.firstName?.message} {...register('firstName')} />
        <Input label="Last Name *" placeholder="Doe" error={errors.lastName?.message} {...register('lastName')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Email *" type="email" placeholder="john@partner.com" error={errors.email?.message} {...register('email')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Phone" placeholder="+1 555 0000" {...register('phone')} />
        <Input label="Company" placeholder="Acme Corp" {...register('company')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Website" placeholder="https://..." {...register('website')} />
        <Input label="LinkedIn URL" placeholder="https://linkedin.com/in/..." {...register('linkedinUrl')} />
      </div>
      <Select label="Pipeline Stage" options={stageOptions} {...register('stage')} />
      <Input label="Tags (comma-separated)" placeholder="technology, saas, cloud" {...register('tags')} />
      <Textarea label="Notes" placeholder="Internal notes..." rows={3} {...register('notes')} />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={isSubmitting}>
          {initial ? 'Save changes' : 'Create partner'}
        </Button>
      </div>
    </form>
  );
}
