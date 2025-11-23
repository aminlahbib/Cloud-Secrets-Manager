import React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/Login';
import { SecretsListPage } from './pages/SecretsList';
import { SecretDetailPage } from './pages/SecretDetail';
import { SecretFormPage } from './pages/SecretForm';
import { AuditLogsPage } from './pages/AuditLogs';
import { AdminPage } from './pages/Admin';
import { Key, FileText, Users } from 'lucide-react';

// Layout component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Secrets', href: '/secrets', icon: Key },
    { name: 'Audit Logs', href: '/audit', icon: FileText },
    { name: 'Admin', href: '/admin', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/secrets" className="flex items-center space-x-2">
                <span className="text-2xl">🔐</span>
                <h1 className="text-xl font-bold text-gray-900">Cloud Secrets Manager</h1>
              </Link>
              
              {/* Navigation */}
              <nav className="hidden md:flex space-x-4">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`
                        flex items-center px-3 py-2 text-sm font-medium rounded-md
                        ${isActive 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user?.email}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
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
        path="/secrets/:id"
        element={
          <ProtectedRoute>
            <SecretDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/secrets/:id/edit"
        element={
          <ProtectedRoute>
            <SecretFormPage />
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

