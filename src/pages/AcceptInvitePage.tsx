import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

const schema = z.object({
  name: z.string().min(2, 'At least 2 characters'),
  password: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string().min(8, 'At least 8 characters'),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export function AcceptInvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [inviteEmail, setInviteEmail] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifying, setVerifying] = useState(true);
  const [submitError, setSubmitError] = useState('');

  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!token) {
      setVerifyError('No invitation token found. Please use the link from your invitation email.');
      setVerifying(false);
      return;
    }
    authApi.verifyInvite(token)
      .then(({ data }) => setInviteEmail(data.email))
      .catch(() => setVerifyError('This invitation link is invalid or has expired.'))
      .finally(() => setVerifying(false));
  }, [token]);

  const onSubmit = async (data: FormData) => {
    setSubmitError('');
    try {
      await authApi.acceptInvite({ token, name: data.name, password: data.password });
      // Log the user in automatically
      await login(inviteEmail, data.password);
      navigate('/dashboard');
    } catch {
      setSubmitError('Failed to create account. The invitation may have already been used.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/chief-delivery-officer.png" alt="JK CRM mascot" className="h-16 w-16 object-contain mb-4 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">Accept invitation</h1>
          <p className="text-gray-500 mt-1">Set up your JK CRM account</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-4">
          {verifying && <p className="text-center text-gray-500">Validating invitation...</p>}

          {verifyError && <Alert variant="error">{verifyError}</Alert>}

          {!verifying && !verifyError && (
            <>
              <p className="text-sm text-gray-600">
                You've been invited as <span className="font-medium text-gray-900">{inviteEmail}</span>. Choose a name and password to get started.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {submitError && <Alert variant="error">{submitError}</Alert>}

                <Input
                  label="Full Name"
                  placeholder="Jane Smith"
                  error={errors.name?.message}
                  {...register('name')}
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />

                <Button type="submit" className="w-full" loading={isSubmitting}>
                  Create account
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
