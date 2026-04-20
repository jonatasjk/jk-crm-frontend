import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, Handshake, FileText, Mail, LogOut, BarChart3, Menu, X, Zap, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/utils';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/api/auth.api';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

const NAV_ITEMS = [
  { to: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { to: '/investors', icon: Users, label: 'Investors' },
  { to: '/partners', icon: Handshake, label: 'Partners' },
  { to: '/materials', icon: FileText, label: 'Materials' },
  { to: '/emails', icon: Mail, label: 'Emails' },
  { to: '/sequences', icon: Zap, label: 'Sequences' },
];

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string().min(8, 'At least 8 characters'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');

  const {
    register: registerField,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordForm>({ resolver: zodResolver(changePasswordSchema) });

  const handleChangePassword = async (data: ChangePasswordForm) => {
    setChangePasswordError('');
    setChangePasswordSuccess('');
    try {
      await authApi.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      setChangePasswordSuccess('Password changed successfully.');
      reset();
    } catch {
      setChangePasswordError('Current password is incorrect.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={cn(
        'flex flex-col bg-gray-900 text-white',
        mobile
          ? 'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200'
          : 'w-64 hidden md:flex',
        mobile && sidebarOpen ? 'translate-x-0' : mobile ? '-translate-x-full' : '',
      )}
    >
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center text-sm font-bold">N</div>
        <span className="font-semibold text-lg">JK CRM</span>
        {mobile && (
          <button
            className="ml-auto text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800',
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold uppercase">
            {user?.name?.[0] ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
        <button
          onClick={() => { setChangePasswordError(''); setChangePasswordSuccess(''); reset(); setChangePasswordOpen(true); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <KeyRound size={18} />
          Change password
        </button>
      </div>
    </aside>
  );

  return (
    <>
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <Sidebar mobile />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Menu size={22} />
          </button>
          <span className="font-semibold text-gray-900">JK CRM</span>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>

    <Modal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} title="Change Password" size="sm">
      <form onSubmit={handleSubmit(handleChangePassword)} className="space-y-4">
        {changePasswordError && <Alert variant="error">{changePasswordError}</Alert>}
        {changePasswordSuccess && <Alert variant="success">{changePasswordSuccess}</Alert>}

        <Input
          label="Current Password"
          type="password"
          placeholder="••••••••"
          error={errors.currentPassword?.message}
          {...registerField('currentPassword')}
        />
        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          error={errors.newPassword?.message}
          {...registerField('newPassword')}
        />
        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...registerField('confirmPassword')}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => setChangePasswordOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Update password
          </Button>
        </div>
      </form>
    </Modal>
    </>
  );
}
