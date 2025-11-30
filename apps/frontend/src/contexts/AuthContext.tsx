import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth';
import { firebaseAuthService } from '@/services/firebase-auth';
import { tokenStorage } from '@/utils/tokenStorage';
import type { User, PlatformRole, LoginRequest } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirebaseEnabled: boolean;
  isPlatformAdmin: boolean;
  login: (credentials: LoginRequest, keepSignedIn?: boolean) => Promise<void>;
  loginWithGoogle: (keepSignedIn?: boolean) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
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
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      // If Firebase is enabled, listen to Firebase auth state
      if (isFirebaseEnabled) {
        unsubscribe = firebaseAuthService.onAuthStateChanged(async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const idTokenResult = await firebaseUser.getIdTokenResult();

              // Extract platform role from claims (v3 architecture)
              const platformRole = (idTokenResult.claims.platformRole as PlatformRole) || 'USER';

              // Store access token in memory
              tokenStorage.setAccessToken(idTokenResult.token);

              // Construct user object from Firebase user and claims
              // Firebase profile is the source of truth when Firebase is enabled
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
              tokenStorage.clearAll();
              setUser(null);
            }
          } else {
            tokenStorage.clearAll();
            setUser(null);
          }
          setIsLoading(false);
        });
      } else {
        // Local authentication mode
        // 1. Check if we have an access token in memory (unlikely on refresh)
        let token = tokenStorage.getAccessToken();

        // 2. If no access token, try to restore session using refresh token (Silent Refresh)
        if (!token) {
          const refreshToken = tokenStorage.getRefreshToken();
          if (refreshToken) {
            try {
              const response = await authService.refreshToken(refreshToken);
              tokenStorage.setAccessToken(response.accessToken);
              token = response.accessToken;
              // Update refresh token if a new one was returned
              if (response.refreshToken) {
                tokenStorage.setRefreshToken(response.refreshToken);
              }
            } catch (error) {
              console.error('Silent refresh failed:', error);
              tokenStorage.clearAll();
            }
          }
        }

        // 3. If we have a valid token (either from memory or fresh refresh), fetch user
        if (token) {
          try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
          } catch (error) {
            console.error('Failed to get current user:', error);
            tokenStorage.clearAll();
            setUser(null);
          }
        } else {
          // No token available
          setUser(null);
        }
        setIsLoading(false);
      }
    };

    void initAuth();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isFirebaseEnabled]);

  // Listen for storage mode changes and storage events (cross-tab synchronization)
  useEffect(() => {
    const unsubscribe = tokenStorage.onStorageModeChange((mode) => {
      // When storage mode changes in another tab, check if we need to re-authenticate
      if (mode === 'persistent' && !user) {
        // Try to restore session if we're in persistent mode
        const refreshToken = tokenStorage.getRefreshToken();
        if (refreshToken) {
          // Re-initialize auth by checking for tokens
          const accessToken = tokenStorage.getAccessToken();
          if (accessToken) {
            // We have tokens, try to fetch user
            authService.getCurrentUser()
              .then(currentUser => {
                setUser(currentUser);
              })
              .catch(() => {
                // Token might be invalid, try refresh
                authService.refreshToken(refreshToken)
                  .then(response => {
                    tokenStorage.setAccessToken(response.accessToken);
                    if (response.refreshToken) {
                      tokenStorage.setRefreshToken(response.refreshToken);
                    }
                    return authService.getCurrentUser();
                  })
                  .then(currentUser => {
                    setUser(currentUser);
                  })
                  .catch(() => {
                    tokenStorage.clearAll();
                    setUser(null);
                  });
              });
          }
        }
      }
    });

    // Listen for storage events (cross-tab token updates)
    const handleStorageEvent = (e: StorageEvent) => {
      // If refresh token was updated in another tab, try to restore session
      if (e.key && e.key.includes('csm_auth_') && e.newValue && !user) {
        const refreshToken = tokenStorage.getRefreshToken();
        if (refreshToken) {
          authService.refreshToken(refreshToken)
            .then(response => {
              tokenStorage.setAccessToken(response.accessToken);
              if (response.refreshToken) {
                tokenStorage.setRefreshToken(response.refreshToken);
              }
              return authService.getCurrentUser();
            })
            .then(currentUser => {
              setUser(currentUser);
            })
            .catch(() => {
              // Ignore errors, user will need to log in
            });
        }
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [user]);

  // Auto-refresh token before expiration (Local Auth Only)
  useEffect(() => {
    if (!user) return;
    if (isFirebaseEnabled) return;

    const token = tokenStorage.getAccessToken();
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
        const refreshToken = tokenStorage.getRefreshToken();
        if (!refreshToken) return;

        const { accessToken, refreshToken: newRefreshToken } = await authService.refreshToken(refreshToken);
        tokenStorage.setAccessToken(accessToken);
        if (newRefreshToken) {
          tokenStorage.setRefreshToken(newRefreshToken);
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        logout();
      }
    }, refreshTime);

    return () => clearTimeout(timer);
  }, [user, isFirebaseEnabled]);

  const login = async (credentials: LoginRequest, keepSignedIn: boolean = false) => {
    // Set storage mode based on user preference BEFORE login
    // This ensures tokens are stored in the correct location
    tokenStorage.setStorageMode(keepSignedIn ? 'persistent' : 'session', keepSignedIn);
    console.log('Storage mode set to:', keepSignedIn ? 'persistent' : 'session');

    if (isFirebaseEnabled) {
      // Firebase email/password login
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }
      try {
        const idToken = await firebaseAuthService.signInWithEmail(
          credentials.email,
          credentials.password,
          keepSignedIn
        );
        if (idToken) {
          tokenStorage.setAccessToken(idToken);
        }
        // User state will be set by onAuthStateChanged listener
        navigate('/home');
      } catch (error) {
        throw error;
      }
    } else {
      // Local authentication
      const response = await authService.login(credentials);
      tokenStorage.setAccessToken(response.accessToken);
      if (response.refreshToken) {
        tokenStorage.setRefreshToken(response.refreshToken);
      }
      setUser(response.user);
      navigate('/home');
    }
  };

  const loginWithGoogle = async (keepSignedIn: boolean = false) => {
    if (!isFirebaseEnabled) {
      throw new Error('Firebase is not enabled');
    }

    // Set storage mode based on user preference BEFORE login
    tokenStorage.setStorageMode(keepSignedIn ? 'persistent' : 'session', keepSignedIn);
    console.log('Storage mode set to:', keepSignedIn ? 'persistent' : 'session');

    try {
      const idToken = await firebaseAuthService.signInWithGoogle(keepSignedIn);
      tokenStorage.setAccessToken(idToken);
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
    tokenStorage.clearAll();
    // Clear query cache on logout
    queryClient.clear();
    navigate('/login');
  };

  const refreshUser = async () => {
    if (isFirebaseEnabled) {
      const firebaseUser = firebaseAuthService.getCurrentUser();
      if (firebaseUser) {
        try {
          // Force refresh the ID token to get latest claims
          const idTokenResult = await firebaseUser.getIdTokenResult(true);
          const platformRole = (idTokenResult.claims.platformRole as PlatformRole) || 'USER';
          
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
          console.error('Failed to refresh user:', error);
        }
      }
    }
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
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
