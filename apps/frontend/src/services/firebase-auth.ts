import { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebase';

// Suppress COOP warnings globally (harmless browser security warnings from Firebase)
const suppressCOOPWarnings = () => {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    // Suppress COOP-related warnings from Firebase/Google OAuth
    if (message.includes('Cross-Origin-Opener-Policy') || 
        message.includes('window.closed') || 
        message.includes('window.close')) {
      return; // Suppress these warnings
    }
    originalWarn.apply(console, args);
  };
  return () => { console.warn = originalWarn; };
};

export const firebaseAuthService = {
  /**
   * Initialize auth persistence
   * @param persistent - If true, use localStorage persistence (survives browser restarts)
   *                     If false, use sessionStorage persistence (cleared when browser closes)
   */
  async initPersistence(persistent: boolean = false): Promise<void> {
    try {
      const persistence = persistent ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      console.log('Firebase persistence set to:', persistent ? 'localStorage (persistent)' : 'sessionStorage (session)');
    } catch (error) {
      console.error('Failed to set auth persistence:', error);
    }
  },

  /**
   * Sign in with Google OAuth popup
   * Returns the Firebase ID token which can be sent to the backend
   * @param persistent - If true, persist auth across browser restarts
   */
  async signInWithGoogle(persistent: boolean = false): Promise<string> {
    try {
      await this.initPersistence(persistent);
      
      // Suppress COOP warnings during sign-in
      const restoreWarn = suppressCOOPWarnings();
      
      try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
        restoreWarn();
      return idToken;
      } catch (popupError) {
        restoreWarn();
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
   * @param persistent - If true, persist auth across browser restarts
   */
  async signInWithEmail(email: string, password: string, persistent: boolean = false): Promise<string> {
    try {
      await this.initPersistence(persistent);
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
   * Update the current user's profile (display name, photo URL)
   */
  async updateUserProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    try {
      await updateProfile(user, updates);
      // Force token refresh to get updated claims
      await user.getIdToken(true);
    } catch (error: any) {
      console.error('Failed to update user profile:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
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

