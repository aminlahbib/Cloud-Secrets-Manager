import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth';
import { firebaseAuthService } from '@/services/firebase-auth';
import type { User, PlatformRole, LoginRequest } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirebaseEnabled: boolean;
  isPlatformAdmin: boolean;
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
  const queryClient = useQueryClient();

  // Track previous user ID to detect user changes
  const [previousUserId, setPreviousUserId] = useState<string | null>(null);

  // Clear query cache when user changes (logout or different user login)
  useEffect(() => {
    const currentUserId = user?.id || null;

    // Only clear cache when user actually changes (not during initial loading)
    if (previousUserId !== null && currentUserId !== previousUserId) {
      console.log('User changed from', previousUserId, 'to', currentUserId, '- clearing query cache');
      queryClient.clear();
    }

    setPreviousUserId(currentUserId);
  }, [user?.id, queryClient]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      // If Firebase is enabled, listen to Firebase auth state
      if (isFirebaseEnabled) {
        const unsubscribe = firebaseAuthService.onAuthStateChanged(async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const idTokenResult = await firebaseUser.getIdTokenResult();
              
              // Extract platform role from claims (v3 architecture)
              const platformRole = (idTokenResult.claims.platformRole as PlatformRole) || 'USER';
              
              sessionStorage.setItem('accessToken', idTokenResult.token);
              
              // Construct user object from Firebase user and claims
              setUser({
                id: firebaseUser.uid,
                firebaseUid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || undefined,
                avatarUrl: firebaseUser.photoURL || undefined,
                platformRole,
                createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
                lastLoginAt: firebaseUser.metadata.lastSignInTime || undefined,
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

    void initAuth();
    // No cleanup needed since Firebase handles unsubscribe internally
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
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }
      try {
        const idToken = await firebaseAuthService.signInWithEmail(
          credentials.email,
          credentials.password
        );
        if (idToken) {
          sessionStorage.setItem('accessToken', idToken);
        }
        // User state will be set by onAuthStateChanged listener
        navigate('/home');
      } catch (error) {
        throw error;
      }
    } else {
      // Local authentication
      const response = await authService.login(credentials);
      sessionStorage.setItem('accessToken', response.accessToken);
      if (response.refreshToken) {
        sessionStorage.setItem('refreshToken', response.refreshToken);
      }
      setUser(response.user);
      navigate('/home');
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
      navigate('/home');
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
    // Clear query cache on logout
    queryClient.clear();
    navigate('/login');
  };

  const isPlatformAdmin = user?.platformRole === 'PLATFORM_ADMIN';

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading, 
        isFirebaseEnabled,
        isPlatformAdmin,
        login, 
        loginWithGoogle,
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
