import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Platform Admin Route
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, isPlatformAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isPlatformAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/invitations/:token" element={<InvitationAcceptPage />} />
      
      {/* Main Dashboard Routes */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      
      {/* Projects */}
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId"
        element={
          <ProtectedRoute>
            <ProjectDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/secrets/new"
        element={
          <ProtectedRoute>
            <SecretFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/secrets/:key"
        element={
          <ProtectedRoute>
            <SecretDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/secrets/:key/edit"
        element={
          <ProtectedRoute>
            <SecretFormPage />
          </ProtectedRoute>
        }
      />
      
      {/* Activity */}
      <Route
        path="/activity"
        element={
          <ProtectedRoute>
            <ActivityPage />
          </ProtectedRoute>
        }
      />
      
      {/* Teams (Future) */}
      <Route
        path="/teams"
        element={
          <ProtectedRoute>
            <TeamsPage />
          </ProtectedRoute>
        }
      />
      
      {/* Settings */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      
      {/* Workflows */}
      <Route
        path="/workflows/new"
        element={
          <ProtectedRoute>
            <WorkflowFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workflows/:workflowId"
        element={
          <ProtectedRoute>
            <WorkflowDetailPage />
          </ProtectedRoute>
        }
      />
      
      {/* Platform Admin */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />

      {/* ================================================================
          Legacy Routes (for backwards compatibility)
          These will be deprecated once v3 migration is complete
          ================================================================ */}
      <Route
        path="/audit"
        element={
          <ProtectedRoute>
            <AuditLogsPage />
          </ProtectedRoute>
        }
      />
      
      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      
      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default App;
