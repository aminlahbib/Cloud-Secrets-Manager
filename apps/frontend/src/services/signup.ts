import api from './api';
import { firebaseAuthService } from './firebase-auth';

export interface EmailCheckRequest {
  email: string;
}

export interface EmailCheckResponse {
  exists: boolean;
  hasPendingInvitations: boolean;
  invitations: InvitationResponse[];
}

export interface InvitationResponse {
  id: string;
  projectId: string;
  project?: {
    id: string;
    name: string;
  };
  email: string;
  role?: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  inviter?: {
    id: string;
    email: string;
    displayName?: string;
  };
}

export interface InvitationTokenResponse {
  email: string;
  projectName: string;
  projectId: string;
  inviterName: string;
  inviterEmail: string;
  role: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface SignupResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  pendingInvitations: InvitationResponse[];
  userId: string;
}

export const signupService = {
  /**
   * Check if email exists and get pending invitations
   */
  async checkEmail(email: string): Promise<EmailCheckResponse> {
    try {
      const { data } = await api.post<EmailCheckResponse>('/api/auth/check-email', { email });
      return data;
    } catch (error: any) {
      // Handle network errors gracefully
      if (!error?.response && error?.message) {
        throw new Error('Unable to verify email. Please check your connection and try again.');
      }
      // Re-throw other errors as-is
      throw error;
    }
  },

  /**
   * Sign up with email and password
   */
  async signupWithEmail(request: SignupRequest): Promise<SignupResponse> {
    try {
      const { data } = await api.post<SignupResponse>('/api/auth/signup', request);
      return data;
    } catch (error: any) {
      // Parse and enhance error messages
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to sign up';
      
      // Check for network errors
      if (!error?.response && error?.message) {
        throw new Error('Unable to verify email. Please check your connection and try again.');
      }
      
      // Re-throw with enhanced message (backend already provides user-friendly messages)
      throw new Error(errorMessage);
    }
  },

  /**
   * Sign up with Google OAuth
   * Returns the Firebase ID token which should be used to login
   */
  async signupWithGoogle(persistent: boolean = false): Promise<string> {
    // Use Firebase auth service to get ID token
    return await firebaseAuthService.signInWithGoogle(persistent);
  },

  /**
   * Get invitation details by token (public endpoint)
   */
  async getInvitationByToken(token: string): Promise<InvitationTokenResponse> {
    const { data } = await api.get<InvitationTokenResponse>(`/api/invitations/token/${token}`);
    return data;
  },
};

