import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';

// Pages
import { LoginPage } from './pages/Login';
import { HomePage } from './pages/Home';
import { ProjectsPage } from './pages/Projects';
import { ProjectDetailPage } from './pages/ProjectDetail';
import { ActivityPage } from './pages/Activity';
import { TeamsPage } from './pages/Teams';
import { SettingsPage } from './pages/Settings';
import { AdminPage } from './pages/Admin';
import { InvitationAcceptPage } from './pages/InvitationAccept';
import { WorkflowFormPage } from './pages/WorkflowForm';
import { WorkflowDetailPage } from './pages/WorkflowDetail';
import { SecretFormPage } from './pages/SecretForm';
import { SecretDetailPage } from './pages/SecretDetail';

// Legacy pages (for backwards compatibility during migration)
import { AuditLogsPage } from './pages/AuditLogs';

// Protected Layout Wrapper
const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900" />
          <p className="text-neutral-500 text-sm">Loading...</p>
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

        {/* Teams (Future) */}
        <Route path="/teams" element={<TeamsPage />} />

        {/* Settings */}
        <Route path="/settings" element={<SettingsPage />} />

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
  );
};

export default App;
