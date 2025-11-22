import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/Login';

// Placeholder pages
const SecretsPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Secrets Management</h1>
    <p className="text-gray-600">Secret management features coming soon...</p>
  </div>
);

const AuditLogsPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Audit Logs</h1>
    <p className="text-gray-600">Audit log viewer coming soon...</p>
  </div>
);

const AdminPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
    <p className="text-gray-600">Admin features coming soon...</p>
  </div>
);

// Layout component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🔐</span>
              <h1 className="text-xl font-bold text-gray-900">Cloud Secrets Manager</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user?.email}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
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
      <Route
        path="/secrets"
        element={
          <ProtectedRoute>
            <SecretsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit"
        element={
          <ProtectedRoute>
            <AuditLogsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/secrets" replace />} />
    </Routes>
  );
};

export default App;

