/**
 * TokenStorage Utility
 * 
 * Handles secure storage of authentication tokens.
 * - Access Token: Stored in memory (variable) for maximum security against XSS.
 * - Refresh Token: Stored in sessionStorage with basic obfuscation to persist sessions.
 */

const STORAGE_KEY_PREFIX = 'csm_auth_';
const REFRESH_TOKEN_KEY = `${STORAGE_KEY_PREFIX}rt`;

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

    // Access Token Management (In-Memory)
    setAccessToken(token: string) {
        this.accessToken = token;
    }

    getAccessToken(): string | null {
        return this.accessToken;
    }

    clearAccessToken() {
        this.accessToken = null;
    }

    // Refresh Token Management (Session Storage + Obfuscation)
    setRefreshToken(token: string) {
        const obfuscated = obfuscate(token);
        sessionStorage.setItem(REFRESH_TOKEN_KEY, obfuscated);
    }

    getRefreshToken(): string | null {
        const stored = sessionStorage.getItem(REFRESH_TOKEN_KEY);
        if (!stored) return null;
        return deobfuscate(stored);
    }

    clearRefreshToken() {
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    }

    // Clear all tokens
    clearAll() {
        this.clearAccessToken();
        this.clearRefreshToken();
        // Also clear legacy plain text tokens if they exist
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
    }
}

export const tokenStorage = new TokenStorage();
