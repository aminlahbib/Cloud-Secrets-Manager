import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Spinner } from './components/ui/Spinner';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./pages/Login').then(m => ({ default: m.LoginPage })));
const HomePage = lazy(() => import('./pages/Home').then(m => ({ default: m.HomePage })));
const ProjectsPage = lazy(() => import('./pages/Projects').then(m => ({ default: m.ProjectsPage })));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetail').then(m => ({ default: m.ProjectDetailPage })));
const ActivityPage = lazy(() => import('./pages/Activity').then(m => ({ default: m.ActivityPage })));
const TeamsPage = lazy(() => import('./pages/Teams').then(m => ({ default: m.TeamsPage })));
const TeamDetailPage = lazy(() => import('./pages/TeamDetail').then(m => ({ default: m.TeamDetailPage })));
const SettingsPage = lazy(() => import('./pages/Settings').then(m => ({ default: m.SettingsPage })));
const NotificationsPage = lazy(() => import('./pages/Notifications').then(m => ({ default: m.NotificationsPage })));
const AdminPage = lazy(() => import('./pages/Admin').then(m => ({ default: m.AdminPage })));
const InvitationAcceptPage = lazy(() => import('./pages/InvitationAccept').then(m => ({ default: m.InvitationAcceptPage })));
const WorkflowFormPage = lazy(() => import('./pages/WorkflowForm').then(m => ({ default: m.WorkflowFormPage })));
const WorkflowDetailPage = lazy(() => import('./pages/WorkflowDetail').then(m => ({ default: m.WorkflowDetailPage })));
const SecretFormPage = lazy(() => import('./pages/SecretForm').then(m => ({ default: m.SecretFormPage })));
const SecretDetailPage = lazy(() => import('./pages/SecretDetail').then(m => ({ default: m.SecretDetailPage })));
const AuditLogsPage = lazy(() => import('./pages/AuditLogs').then(m => ({ default: m.AuditLogsPage })));

// Loading fallback component
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--page-bg)' }}>
    <div className="flex flex-col items-center space-y-4">
      <Spinner size="lg" />
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading...</p>
    </div>
  </div>
);

// Protected Layout Wrapper
const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--page-bg)' }}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: 'var(--accent-primary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

// Platform Admin Route Wrapper
// Note: This nests inside ProtectedLayout, so we only check admin role here
const AdminRoute: React.FC = () => {
  const { isPlatformAdmin, isLoading } = useAuth();

  if (isLoading) return null; // Handled by parent

  if (!isPlatformAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};

const App: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/invitations/:token" element={<InvitationAcceptPage />} />

        {/* Protected Routes (Wrapped in Layout) */}
        <Route element={<ProtectedLayout />}>
          <Route path="/home" element={<HomePage />} />

          {/* Projects */}
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/projects/:projectId/secrets/new" element={<SecretFormPage />} />
          <Route path="/projects/:projectId/secrets/:key" element={<SecretDetailPage />} />
          <Route path="/projects/:projectId/secrets/:key/edit" element={<SecretFormPage />} />

          {/* Activity */}
          <Route path="/activity" element={<ActivityPage />} />

          {/* Teams */}
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/teams/:teamId" element={<TeamDetailPage />} />

          {/* Settings */}
          <Route path="/settings" element={<SettingsPage />} />

          {/* Notifications */}
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Workflows */}
          <Route path="/workflows/new" element={<WorkflowFormPage />} />
          <Route path="/workflows/:workflowId" element={<WorkflowDetailPage />} />

          {/* Legacy Routes */}
          <Route path="/audit" element={<AuditLogsPage />} />

          {/* Platform Admin */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route index element={<AdminPage />} />
          </Route>
        </Route>

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
