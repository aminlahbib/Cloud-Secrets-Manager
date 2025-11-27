import { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebase';

export const firebaseAuthService = {
  /**
   * Initialize auth persistence
   */
  async initPersistence(): Promise<void> {
    try {
      await setPersistence(auth, browserSessionPersistence);
    } catch (error) {
      console.error('Failed to set auth persistence:', error);
    }
  },

  /**
   * Sign in with Google OAuth popup
   * Returns the Firebase ID token which can be sent to the backend
   */
  async signInWithGoogle(): Promise<string> {
    try {
      await this.initPersistence();
      
      // Suppress COOP warnings from Firebase (harmless browser security warnings)
      const originalWarn = console.warn;
      const suppressedWarnings: string[] = [];
      console.warn = (...args: any[]) => {
        const message = args.join(' ');
        // Suppress COOP-related warnings from Firebase/Google OAuth
        if (message.includes('Cross-Origin-Opener-Policy') || 
            message.includes('window.closed') || 
            message.includes('window.close')) {
          suppressedWarnings.push(message);
          return; // Suppress these warnings
        }
        originalWarn.apply(console, args);
      };
      
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const idToken = await result.user.getIdToken();
        // Restore console.warn
        console.warn = originalWarn;
        return idToken;
      } catch (popupError) {
        // Restore console.warn before handling error
        console.warn = originalWarn;
        throw popupError;
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      // Handle popup-blocked error specifically
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by your browser. Please allow popups for this site and try again.');
      }
      
      // Handle popup-closed-by-user error
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      }
      
      // Handle other Firebase auth errors
      if (error.code && error.code.startsWith('auth/')) {
        throw new Error(error.message || 'Authentication failed. Please try again.');
      }
      
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  },

  /**
   * Sign in with email and password
   * Returns the Firebase ID token which can be sent to the backend
   */
  async signInWithEmail(email: string, password: string): Promise<string> {
    try {
      await this.initPersistence();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      return idToken;
    } catch (error: any) {
      console.error('Email sign-in error:', error);
      throw new Error(error.message || 'Failed to sign in with email');
    }
  },

  /**
   * Create a new user with email and password
   * Returns the Firebase ID token which can be sent to the backend
   */
  async createUser(email: string, password: string): Promise<string> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      return idToken;
    } catch (error: any) {
      console.error('User creation error:', error);
      throw new Error(error.message || 'Failed to create user');
    }
  },

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error('Sign-out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  },

  /**
   * Get the current Firebase ID token
   * This token should be sent to the backend with each authenticated request
   */
  async getIdToken(forceRefresh: boolean = false): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }

    try {
      return await user.getIdToken(forceRefresh);
    } catch (error: any) {
      console.error('Failed to get ID token:', error);
      return null;
    }
  },

  /**
   * Get the current Firebase user
   */
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },

  /**
   * Subscribe to auth state changes
   * Returns an unsubscribe function
   */
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Check if Firebase is enabled (all config vars are set)
   */
  isFirebaseEnabled(): boolean {
    return !!(
      import.meta.env.VITE_FIREBASE_API_KEY &&
      import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
      import.meta.env.VITE_FIREBASE_PROJECT_ID
    );
  }
};

