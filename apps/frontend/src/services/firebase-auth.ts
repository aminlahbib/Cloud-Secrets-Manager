import { 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebase';

export const firebaseAuthService = {
  /**
   * Sign in with Google OAuth popup
   * Returns the Firebase ID token which can be sent to the backend
   */
  async signInWithGoogle(): Promise<string> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      return idToken;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  },

  /**
   * Sign in with email and password
   * Returns the Firebase ID token which can be sent to the backend
   */
  async signInWithEmail(email: string, password: string): Promise<string> {
    try {
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

