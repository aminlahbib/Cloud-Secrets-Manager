import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth';
import { firebaseAuthService } from '@/services/firebase-auth';
import type { User, LoginRequest } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirebaseEnabled: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
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
  const [isFirebaseEnabled] = useState(firebaseAuthService.isFirebaseEnabled());
  const navigate = useNavigate();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      // If Firebase is enabled, listen to Firebase auth state
      if (isFirebaseEnabled) {
        const unsubscribe = firebaseAuthService.onAuthStateChanged(async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const idToken = await firebaseUser.getIdToken();
              sessionStorage.setItem('accessToken', idToken);
              // In Firebase mode, we construct a minimal user object from the Firebase user
              setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                roles: [], // Roles will be in the token claims
                permissions: [], // Permissions will be in the token claims
              });
            } catch (error) {
              console.error('Failed to get Firebase ID token:', error);
              sessionStorage.clear();
              setUser(null);
            }
          } else {
            sessionStorage.clear();
            setUser(null);
          }
          setIsLoading(false);
        });

        return unsubscribe;
      } else {
        // Local authentication mode
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
      }
    };

    const unsubscribe = initAuth();
    
    // Cleanup function
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [isFirebaseEnabled]);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!user) return;

    // Firebase tokens auto-refresh, so we only need this for local auth
    if (isFirebaseEnabled) return;

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
  }, [user, isFirebaseEnabled]);

  const login = async (credentials: LoginRequest) => {
    if (isFirebaseEnabled) {
      // Firebase email/password login
      try {
        const idToken = await firebaseAuthService.signInWithEmail(
          credentials.email,
          credentials.password
        );
        sessionStorage.setItem('accessToken', idToken);
        // User state will be set by onAuthStateChanged listener
        navigate('/secrets');
      } catch (error) {
        throw error;
      }
    } else {
      // Local authentication
      const response = await authService.login(credentials);
      sessionStorage.setItem('accessToken', response.accessToken);
      sessionStorage.setItem('refreshToken', response.refreshToken);
      setUser(response.user);
      navigate('/secrets');
    }
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseEnabled) {
      throw new Error('Firebase is not enabled');
    }

    try {
      const idToken = await firebaseAuthService.signInWithGoogle();
      sessionStorage.setItem('accessToken', idToken);
      // User state will be set by onAuthStateChanged listener
      navigate('/secrets');
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    if (isFirebaseEnabled) {
      try {
        await firebaseAuthService.signOut();
      } catch (error) {
        console.error('Firebase sign out error:', error);
      }
    } else {
      authService.logout().catch(console.error);
    }
    
    setUser(null);
    sessionStorage.clear();
    navigate('/login');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading, 
        isFirebaseEnabled,
        login, 
        loginWithGoogle,
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

