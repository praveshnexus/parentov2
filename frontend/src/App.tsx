import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/auth/ProtectedRoute';
import { Layout, AuthLayout } from '@/components/layout';
import { Spinner } from '@/components/ui';
import { authApi } from '@/api/services';
import { ForgotPasswordPage, ResetPasswordPage } from '@/pages/auth/PasswordPages';

const HomePage             = lazy(() => import('@/pages/HomePage'));
const LoginPage            = lazy(() => import('@/pages/auth/LoginPage'));
const SignupPage            = lazy(() => import('@/pages/auth/SignupPage'));
const DashboardPage        = lazy(() => import('@/pages/dashboard/DashboardPage'));
const CommunityPage        = lazy(() => import('@/pages/community/CommunityPage'));
const TrackPage            = lazy(() => import('@/pages/track/TrackPage'));
const ConsultPage          = lazy(() => import('@/pages/consult/ConsultPage'));
const ProfilePage          = lazy(() => import('@/pages/profile/ProfilePage'));
const NotificationsPage    = lazy(() => import('@/pages/notifications/NotificationsPage'));
const AdminPage            = lazy(() => import('@/pages/admin/AdminPage'));
const AiChatPage           = lazy(() => import('@/pages/ai/AiChatPage'));
const DoctorDashboardPage  = lazy(() => import('@/pages/doctor/DoctorDashboardPage'));
const SearchPage           = lazy(() => import('@/pages/search/SearchPage'));
const LearnPage = lazy(() => import('@/pages/learn/LearnPage'));
const MessagesPage = lazy(() => import('@/pages/messages/MessagesPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401) return false;
        return failureCount < 2;
      },
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={32} />
        <p className="text-sm text-ink-muted">Loading...</p>
      </div>
    </div>
  );
}

function VerifyEmailPage() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const token = sp.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <AuthLayout>
      <div className="text-center py-8">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3">
            <Spinner size={32} />
            <p className="text-sm text-ink-muted">Verifying your email...</p>
          </div>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-xl font-bold text-ink-primary mb-2">Email verified!</h2>
            <p className="text-sm text-ink-muted mb-6">Your account is active. You can now sign in.</p>
            <button onClick={() => navigate('/login')} className="btn-primary">
              Go to sign in
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-xl font-bold text-ink-primary mb-2">Verification failed</h2>
            <p className="text-sm text-ink-muted mb-4">The link may be expired or invalid.</p>
            <button onClick={() => navigate('/login')} className="btn-primary">
              Back to sign in
            </button>
          </>
        )}
      </div>
    </AuthLayout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <Toaster
              position="top-right"
              gutter={8}
              toastOptions={{
                className: '!rounded-2xl !shadow-card !text-sm !font-medium',
                duration: 3500,
                success: {
                  iconTheme: { primary: '#29B6F6', secondary: '#fff' },
                  style: { background: '#fff', color: '#1A2340' },
                },
                error: {
                  style: { background: '#fff', color: '#ef4444' },
                },
              }}
            />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public */}
                <Route path="/"              element={<HomePage />} />
                <Route path="/verify-email"  element={<VerifyEmailPage />} />

                {/* Auth (public only) */}
                <Route path="/login"           element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
                <Route path="/signup"          element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
                <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
                <Route path="/reset-password" element={<ResetPasswordPage />}/>

                {/* Protected — all roles */}
                <Route path="/dashboard"     element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
                <Route path="/community"     element={<ProtectedRoute><Layout><CommunityPage /></Layout></ProtectedRoute>} />
                <Route path="/consult"       element={<ProtectedRoute><Layout><ConsultPage /></Layout></ProtectedRoute>} />
                <Route path="/profile"       element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Layout><NotificationsPage /></Layout></ProtectedRoute>} />
                <Route path="/search"        element={<ProtectedRoute><Layout><SearchPage /></Layout></ProtectedRoute>} />
                <Route path="/learn" element={<ProtectedRoute><Layout><LearnPage /></Layout></ProtectedRoute>} />
                <Route path="/messages"      element={<ProtectedRoute><Layout><MessagesPage /></Layout></ProtectedRoute>} />

                {/* Protected — PARENT only */}
                <Route path="/track" element={<ProtectedRoute roles={['PARENT']}><Layout><TrackPage /></Layout></ProtectedRoute>} />
                <Route path="/ai"    element={<ProtectedRoute roles={['PARENT']}><Layout><AiChatPage /></Layout></ProtectedRoute>} />

                {/* Protected — DOCTOR only */}
                <Route path="/doctor" element={<ProtectedRoute roles={['DOCTOR']}><Layout><DoctorDashboardPage /></Layout></ProtectedRoute>} />

                {/* Protected — ADMIN only */}
                <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><Layout><AdminPage /></Layout></ProtectedRoute>} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
