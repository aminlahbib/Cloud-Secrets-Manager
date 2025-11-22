import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth';
import type { User, LoginRequest } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Failed to get current user:', error);
          sessionStorage.clear();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!user) return;

    const token = sessionStorage.getItem('accessToken');
    if (!token) return;

    // Parse JWT to get expiration
    const parseJWT = (token: string) => {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        return JSON.parse(jsonPayload);
      } catch {
        return null;
      }
    };

    const payload = parseJWT(token);
    if (!payload || !payload.exp) return;

    const expiresIn = payload.exp * 1000 - Date.now();
    const refreshTime = expiresIn - 60000; // 1 minute before expiry

    if (refreshTime <= 0) return;

    const timer = setTimeout(async () => {
      try {
        const refreshToken = sessionStorage.getItem('refreshToken');
        if (!refreshToken) return;

        const { accessToken } = await authService.refreshToken(refreshToken);
        sessionStorage.setItem('accessToken', accessToken);
      } catch (error) {
        console.error('Token refresh failed:', error);
        logout();
      }
    }, refreshTime);

    return () => clearTimeout(timer);
  }, [user]);

  const login = async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    sessionStorage.setItem('accessToken', response.accessToken);
    sessionStorage.setItem('refreshToken', response.refreshToken);
    setUser(response.user);
    navigate('/secrets');
  };

  const logout = () => {
    authService.logout().catch(console.error);
    setUser(null);
    sessionStorage.clear();
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

