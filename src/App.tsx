import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { AcceptInvitePage } from '@/pages/AcceptInvitePage';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { InvestorsPage } from '@/pages/InvestorsPage';
import { PartnersPage } from '@/pages/PartnersPage';
import { MaterialsPage } from '@/pages/MaterialsPage';
import { EmailsPage } from '@/pages/EmailsPage';
import { SequencesPage } from '@/pages/SequencesPage';
import { SequenceDetailPage } from '@/pages/SequenceDetailPage';
import { UsersPage } from '@/pages/UsersPage';
import { useAuthStore } from '@/store/auth.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user || user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />} />
      <Route path="/reset-password" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />} />
      <Route path="/accept-invite" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AcceptInvitePage />} />
      <Route path="/change-password" element={isAuthenticated ? <ChangePasswordPage /> : <Navigate to="/login" replace />} />

      <Route
        path="/*"
        element={
          <RequireAuth>
            <AppLayout>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/investors" element={<InvestorsPage />} />
                <Route path="/partners" element={<PartnersPage />} />
                <Route path="/materials" element={<MaterialsPage />} />
                <Route path="/emails" element={<EmailsPage />} />
                <Route path="/sequences" element={<SequencesPage />} />
                <Route path="/sequences/:id" element={<SequenceDetailPage />} />
                <Route path="/users" element={<RequireAdmin><UsersPage /></RequireAdmin>} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AppLayout>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
