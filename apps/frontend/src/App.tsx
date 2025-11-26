import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/Login';
import { SecretsListPage } from './pages/SecretsList';
import { SecretDetailPage } from './pages/SecretDetail';
import { SecretFormPage } from './pages/SecretForm';
import { AuditLogsPage } from './pages/AuditLogs';
import { AdminPage } from './pages/Admin';
import { HomePage } from './pages/Home';
import { ProjectsPage } from './pages/Projects';
import { TeamsPage } from './pages/Teams';
import { SettingsPage } from './pages/Settings';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Main Dashboard Routes */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teams"
        element={
          <ProtectedRoute>
            <TeamsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Existing Secrets Routes (now accessible via Projects) */}
      <Route
        path="/secrets"
        element={
          <ProtectedRoute>
            <SecretsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/secrets/new"
        element={
          <ProtectedRoute>
            <SecretFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/secrets/:key"
        element={
          <ProtectedRoute>
            <SecretDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/secrets/:key/edit"
        element={
          <ProtectedRoute>
            <SecretFormPage />
          </ProtectedRoute>
        }
      />
      
      {/* Activity/Audit Route */}
      <Route
        path="/audit"
        element={
          <ProtectedRoute>
            <AuditLogsPage />
          </ProtectedRoute>
        }
      />
      
      {/* Admin Route */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      
      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default App;
