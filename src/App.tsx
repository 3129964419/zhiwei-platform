import { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { useUIStore } from '@/store/uiStore';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { PageSkeleton } from '@/components/Skeleton';
import ToastContainer from '@/components/ToastContainer';
import LegalModal from '@/components/LegalModal';
import CookieConsent from '@/components/CookieConsent';
import OnboardingGuide from '@/components/OnboardingGuide';
import { adminAuthService } from '@/services/adminAuth';

const Home = lazy(() => import('@/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const Legal = lazy(() => import('@/pages/Legal'));
const Help = lazy(() => import('@/pages/Help'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const CreateAgent = lazy(() => import('@/pages/CreateAgent'));
const CloneAgent = lazy(() => import('@/pages/CloneAgent'));
const EditAgent = lazy(() => import('@/pages/EditAgent'));
const AgentChat = lazy(() => import('@/pages/AgentChat'));
const Pricing = lazy(() => import('@/pages/Pricing'));
const WechatBind = lazy(() => import('@/pages/WechatBind'));
const Settings = lazy(() => import('@/pages/Settings'));
const Community = lazy(() => import('@/pages/Community'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const AdminLogin = lazy(() => import('@/pages/admin/Login'));
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('@/pages/admin/Users'));
const AdminAdmins = lazy(() => import('@/pages/admin/Admins'));
const AdminLogs = lazy(() => import('@/pages/admin/Logs'));
const AdminStats = lazy(() => import('@/pages/admin/Stats'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useUserStore((s) => s.user);
  const loading = useUserStore((s) => s.loading);
  if (loading) return <PageSkeleton />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<any>(undefined);

  useEffect(() => {
    const current = adminAuthService.getCurrentAdmin();
    setAdmin(current);
  }, []);
  
  if (admin === undefined) {
    return <div className="flex items-center justify-center h-screen bg-gray-50"><div className="w-8 h-8 border-4 border-iris-500 border-t-transparent rounded-full animate-spin" /></div>;
  }
  
  if (admin === null) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
}

function RouteWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);
  return <>{children}</>;
}

function App() {
  const init = useUserStore((s) => s.init);
  const loading = useUserStore((s) => s.loading);
  const legalAccepted = useUIStore((s) => s.legalAccepted);
  const showLegalModal = useUIStore((s) => s.showLegalModal);
  const showOnboarding = useUIStore((s) => s.showOnboarding);
  const completeOnboarding = useUIStore((s) => s.completeOnboarding);
  const user = useUserStore((s) => s.user);

  useEffect(() => {
    init();
  }, [init]);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <LoadingOverlay isLoading={loading} />
        <RouteWrapper>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/help" element={<Help />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create"
                element={
                  <ProtectedRoute>
                    <CreateAgent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clone"
                element={
                  <ProtectedRoute>
                    <CloneAgent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit/:id"
                element={
                  <ProtectedRoute>
                    <EditAgent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agent/:id"
                element={
                  <ProtectedRoute>
                    <AgentChat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pricing"
                element={
                  <ProtectedRoute>
                    <Pricing />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/wechat-bind"
                element={
                  <ProtectedRoute>
                    <WechatBind />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community"
                element={
                  <ProtectedRoute>
                    <Community />
                  </ProtectedRoute>
                }
              />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/dashboard"
                element={
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminProtectedRoute>
                    <AdminUsers />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/admins"
                element={
                  <AdminProtectedRoute>
                    <AdminAdmins />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/logs"
                element={
                  <AdminProtectedRoute>
                    <AdminLogs />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/stats"
                element={
                  <AdminProtectedRoute>
                    <AdminStats />
                  </AdminProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </RouteWrapper>
        <ToastContainer />
        {(!legalAccepted || showLegalModal) && <LegalModal />}
        <CookieConsent />
        {showOnboarding && user && (
          <OnboardingGuide onComplete={completeOnboarding} />
        )}
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
