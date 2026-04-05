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

export const firebaseAuthService = {
  async initPersistence(persistent: boolean = false): Promise<void> {
    if (!auth) return;
    try {
      const persistence = persistent ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
    } catch (error) {
      console.error('Failed to set auth persistence:', error);
    }
  },

  async signInWithGoogle(persistent: boolean = false): Promise<string> {
    if (!auth || !googleProvider) throw new Error('Firebase is not configured');
    try {
      await this.initPersistence(persistent);
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      return idToken;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by your browser. Please allow popups for this site and try again.');
      }
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      }
      if (error.code && error.code.startsWith('auth/')) {
        throw new Error(error.message || 'Authentication failed. Please try again.');
      }
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  },

  async signInWithEmail(email: string, password: string, persistent: boolean = false): Promise<string> {
    if (!auth) throw new Error('Firebase is not configured');
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

  async createUser(email: string, password: string): Promise<string> {
    if (!auth) throw new Error('Firebase is not configured');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      return idToken;
    } catch (error: any) {
      console.error('User creation error:', error);
      throw new Error(error.message || 'Failed to create user');
    }
  },

  async signOut(): Promise<void> {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error('Sign-out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  },

  async getIdToken(forceRefresh: boolean = false): Promise<string | null> {
    if (!auth) return null;
    const user = auth.currentUser;
    if (!user) return null;
    try {
      return await user.getIdToken(forceRefresh);
    } catch (error: any) {
      console.error('Failed to get ID token:', error);
      return null;
    }
  },

  getCurrentUser(): FirebaseUser | null {
    return auth?.currentUser ?? null;
  },

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
    if (!auth) {
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  },

  async updateUserProfile(updates: { displayName?: string; photoURL?: string }): Promise<void> {
    if (!auth) throw new Error('Firebase is not configured');
    const user = auth.currentUser;
    if (!user) throw new Error('No user is currently signed in');
    try {
      await updateProfile(user, updates);
      await user.getIdToken(true);
    } catch (error: any) {
      console.error('Failed to update user profile:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  },

  isFirebaseEnabled(): boolean {
    return !!(
      import.meta.env.VITE_FIREBASE_API_KEY &&
      import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
      import.meta.env.VITE_FIREBASE_PROJECT_ID
    );
  }
};

