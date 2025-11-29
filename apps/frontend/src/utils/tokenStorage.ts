/**
 * TokenStorage Utility
 * 
 * Handles secure storage of authentication tokens with configurable persistence.
 * - Access Token: Can be stored in memory (default) or sessionStorage (for cross-tab support)
 * - Refresh Token: Stored in sessionStorage (session-only) or localStorage (persistent)
 * 
 * Storage Strategy:
 * - Session-only (default): Access token in memory, refresh token in sessionStorage
 * - Persistent (keep me signed in): Access token in sessionStorage, refresh token in localStorage
 */

const STORAGE_KEY_PREFIX = 'csm_auth_';
const REFRESH_TOKEN_KEY = `${STORAGE_KEY_PREFIX}rt`;
const ACCESS_TOKEN_KEY = `${STORAGE_KEY_PREFIX}at`;
const STORAGE_MODE_KEY = `${STORAGE_KEY_PREFIX}mode`;

export type StorageMode = 'session' | 'persistent';

// Simple obfuscation to prevent casual inspection
// Note: This is NOT strong encryption. Real security comes from HttpOnly cookies.
const obfuscate = (str: string): string => {
    try {
        return btoa(str.split('').reverse().join(''));
    } catch (e) {
        console.error('Failed to obfuscate token', e);
        return '';
    }
};

const deobfuscate = (str: string): string => {
    try {
        return atob(str).split('').reverse().join('');
    } catch (e) {
        console.error('Failed to deobfuscate token', e);
        return '';
    }
};

class TokenStorage {
    private accessToken: string | null = null;
    private storageMode: StorageMode = 'session';
    private listeners: Set<(mode: StorageMode) => void> = new Set();

    constructor() {
        // Load storage mode preference (check localStorage first for persistent mode, then sessionStorage)
        try {
            let savedMode: StorageMode | null = null;
            // Check localStorage first (for persistent mode preference)
            savedMode = localStorage.getItem(STORAGE_MODE_KEY) as StorageMode;
            // If not found or invalid, check sessionStorage
            if (!savedMode || (savedMode !== 'session' && savedMode !== 'persistent')) {
                savedMode = sessionStorage.getItem(STORAGE_MODE_KEY) as StorageMode;
            }
            if (savedMode === 'session' || savedMode === 'persistent') {
                this.storageMode = savedMode;
                console.log('Loaded storage mode:', savedMode, savedMode === 'persistent' ? '(from localStorage)' : '(from sessionStorage)');
            } else {
                console.log('No saved storage mode found, defaulting to session');
            }
        } catch (e) {
            console.error('Failed to load storage mode', e);
        }

        // Listen for storage changes (cross-tab synchronization)
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', this.handleStorageChange.bind(this));
        }
    }

    private handleStorageChange(e: StorageEvent) {
        // Handle refresh token changes from other tabs
        if (e.key === REFRESH_TOKEN_KEY && e.newValue) {
            // Another tab updated the refresh token, we should re-authenticate
            // This will be handled by AuthContext checking for tokens on storage events
        }

        // Handle storage mode changes (from localStorage or sessionStorage)
        if (e.key === STORAGE_MODE_KEY && e.newValue) {
            const newMode = e.newValue as StorageMode;
            if ((newMode === 'session' || newMode === 'persistent') && newMode !== this.storageMode) {
                const oldMode = this.storageMode;
                this.storageMode = newMode;
                // Migrate tokens when mode changes from another tab
                this.migrateTokens(oldMode, newMode);
                this.notifyListeners(newMode);
            }
        }
    }

    private notifyListeners(mode: StorageMode) {
        this.listeners.forEach(listener => listener(mode));
    }

    onStorageModeChange(listener: (mode: StorageMode) => void) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    setStorageMode(mode: StorageMode, persist: boolean = false) {
        const oldMode = this.storageMode;
        this.storageMode = mode;
        
        try {
            if (persist) {
                // Store preference in localStorage so it persists across sessions
                localStorage.setItem(STORAGE_MODE_KEY, mode);
                // Also store in sessionStorage for current session
                sessionStorage.setItem(STORAGE_MODE_KEY, mode);
                console.log('Storage mode set to PERSISTENT (stored in localStorage and sessionStorage)');
            } else {
                // Store in sessionStorage for current session only
                sessionStorage.setItem(STORAGE_MODE_KEY, mode);
                // Remove from localStorage if it was there
                localStorage.removeItem(STORAGE_MODE_KEY);
                console.log('Storage mode set to SESSION (stored in sessionStorage only)');
            }
            
            // Migrate existing tokens to the correct storage location
            if (oldMode !== mode) {
                console.log(`Migrating tokens from ${oldMode} to ${mode}`);
                this.migrateTokens(oldMode, mode);
            }
            
            this.notifyListeners(mode);
        } catch (e) {
            console.error('Failed to save storage mode', e);
        }
    }

    private migrateTokens(oldMode: StorageMode, newMode: StorageMode) {
        try {
            // Get current refresh token from old location
            let refreshToken: string | null = null;
            if (oldMode === 'persistent') {
                const stored = localStorage.getItem(REFRESH_TOKEN_KEY);
                if (stored) {
                    refreshToken = deobfuscate(stored);
                }
            } else {
                const stored = sessionStorage.getItem(REFRESH_TOKEN_KEY);
                if (stored) {
                    refreshToken = deobfuscate(stored);
                }
            }

            // Move refresh token to new location
            if (refreshToken) {
                if (newMode === 'persistent') {
                    // Move to localStorage
                    const obfuscated = obfuscate(refreshToken);
                    localStorage.setItem(REFRESH_TOKEN_KEY, obfuscated);
                    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
                } else {
                    // Move to sessionStorage
                    const obfuscated = obfuscate(refreshToken);
                    sessionStorage.setItem(REFRESH_TOKEN_KEY, obfuscated);
                    localStorage.removeItem(REFRESH_TOKEN_KEY);
                }
            }

            // Access token handling - if switching to persistent, store in sessionStorage
            if (newMode === 'persistent' && this.accessToken) {
                const obfuscated = obfuscate(this.accessToken);
                sessionStorage.setItem(ACCESS_TOKEN_KEY, obfuscated);
            } else if (newMode === 'session' && this.accessToken) {
                // In session mode, we keep it in memory but also store in sessionStorage for cross-tab
                const obfuscated = obfuscate(this.accessToken);
                sessionStorage.setItem(ACCESS_TOKEN_KEY, obfuscated);
            }
        } catch (e) {
            console.error('Failed to migrate tokens', e);
        }
    }

    getStorageMode(): StorageMode {
        return this.storageMode;
    }

    // Access Token Management
    setAccessToken(token: string) {
        this.accessToken = token;
        
        // Always store in sessionStorage for cross-tab access (works in both modes)
        // In session mode, it's cleared when browser closes
        // In persistent mode, it persists across refreshes
        try {
            const obfuscated = obfuscate(token);
            sessionStorage.setItem(ACCESS_TOKEN_KEY, obfuscated);
        } catch (e) {
            console.error('Failed to store access token in sessionStorage', e);
        }
    }

    getAccessToken(): string | null {
        // First check memory
        if (this.accessToken) {
            return this.accessToken;
        }

        // Try to restore from sessionStorage (works in both modes for cross-tab support)
        try {
            const stored = sessionStorage.getItem(ACCESS_TOKEN_KEY);
            if (stored) {
                const token = deobfuscate(stored);
                this.accessToken = token; // Cache in memory
                return token;
            }
        } catch (e) {
            console.error('Failed to retrieve access token from sessionStorage', e);
        }

        return null;
    }

    clearAccessToken() {
        this.accessToken = null;
        try {
            sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        } catch (e) {
            console.error('Failed to clear access token from sessionStorage', e);
        }
    }

    // Refresh Token Management
    setRefreshToken(token: string) {
        const obfuscated = obfuscate(token);
        try {
            if (this.storageMode === 'persistent') {
                // Store in localStorage for persistence across browser sessions
                localStorage.setItem(REFRESH_TOKEN_KEY, obfuscated);
                // Remove from sessionStorage if it exists there
                sessionStorage.removeItem(REFRESH_TOKEN_KEY);
                console.log('Refresh token stored in localStorage (persistent mode)');
            } else {
                // Store in sessionStorage (session-only, cleared when browser closes)
                sessionStorage.setItem(REFRESH_TOKEN_KEY, obfuscated);
                // Remove from localStorage if it exists there
                localStorage.removeItem(REFRESH_TOKEN_KEY);
                console.log('Refresh token stored in sessionStorage (session mode)');
            }
        } catch (e) {
            console.error('Failed to store refresh token', e);
        }
    }

    getRefreshToken(): string | null {
        try {
            let stored: string | null = null;
            
            if (this.storageMode === 'persistent') {
                stored = localStorage.getItem(REFRESH_TOKEN_KEY);
                console.log('Getting refresh token from localStorage (persistent mode)');
            } else {
                stored = sessionStorage.getItem(REFRESH_TOKEN_KEY);
                console.log('Getting refresh token from sessionStorage (session mode)');
            }

            if (!stored) {
                console.log('No refresh token found in', this.storageMode === 'persistent' ? 'localStorage' : 'sessionStorage');
                return null;
            }
            return deobfuscate(stored);
        } catch (e) {
            console.error('Failed to retrieve refresh token', e);
            return null;
        }
    }

    clearRefreshToken() {
        try {
            sessionStorage.removeItem(REFRESH_TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
        } catch (e) {
            console.error('Failed to clear refresh token', e);
        }
    }

    // Clear all tokens
    clearAll() {
        this.clearAccessToken();
        this.clearRefreshToken();
        // Also clear legacy plain text tokens if they exist
        try {
            sessionStorage.removeItem('accessToken');
            sessionStorage.removeItem('refreshToken');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        } catch (e) {
            console.error('Failed to clear legacy tokens', e);
        }
    }
}

export const tokenStorage = new TokenStorage();
