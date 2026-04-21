import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Trash2 } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';

const inviteSchema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['ADMIN', 'MEMBER']),
});
type InviteForm = z.infer<typeof inviteSchema>;

export function UsersPage() {
  const qc = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => authApi.listUsers().then((r) => r.data.users),
  });

  const { mutate: deleteUserMutation, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => authApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setDeleteTarget(null);
      setDeleteError('');
    },
    onError: () => {
      setDeleteError('Failed to delete user. Please try again.');
    },
  });

  const { mutateAsync: sendInvite, isPending } = useMutation({
    mutationFn: (payload: InviteForm) => authApi.invite(payload),
    onSuccess: (_, vars) => {
      setInviteSuccess(`Invitation sent to ${vars.email}`);
      qc.invalidateQueries({ queryKey: ['users'] });
      setTimeout(() => {
        setInviteOpen(false);
        setInviteSuccess('');
      }, 2000);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteForm>({ resolver: zodResolver(inviteSchema), defaultValues: { role: 'MEMBER' } });

  const onInvite = async (data: InviteForm) => {
    setInviteError('');
    try {
      await sendInvite(data);
      reset();
    } catch {
      setInviteError('Failed to send invitation. Please try again.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 mt-1">Manage team members and invitations</p>
        </div>
        <Button onClick={() => { reset(); setInviteSuccess(''); setInviteError(''); setInviteOpen(true); }}>
          <UserPlus className="w-4 h-4" />
          Invite user
        </Button>
      </div>

      {error && <Alert variant="error">Failed to load users.</Alert>}

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={user.role === 'ADMIN' ? 'purple' : 'default'}>{user.role}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.mustChangePassword ? (
                      <Badge variant="warning">Pending password change</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => { setDeleteError(''); setDeleteTarget({ id: user.id, name: user.name }); }}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete user" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <span className="font-medium text-gray-900">{deleteTarget?.name}</span>? This action cannot be undone.
          </p>
          {deleteError && <Alert variant="error">{deleteError}</Alert>}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              className="flex-1"
              loading={isDeleting}
              onClick={() => deleteTarget && deleteUserMutation(deleteTarget.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite a team member" size="sm">
        {inviteSuccess ? (
          <Alert variant="success">{inviteSuccess}</Alert>
        ) : (
          <form onSubmit={handleSubmit(onInvite)} className="space-y-4">
            {inviteError && <Alert variant="error">{inviteError}</Alert>}
            <Input
              label="Email address"
              type="email"
              placeholder="colleague@company.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                {...register('role')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" loading={isPending}>
                Send invitation
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
