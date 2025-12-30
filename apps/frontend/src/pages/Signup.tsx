import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { Logo } from '@/components/ui/Logo';
import { signupService, type InvitationTokenResponse } from '@/services/signup';
import { invitationsService } from '@/services/invitations';
import { useQueryClient } from '@tanstack/react-query';
import { EmailStep } from '@/components/signup/EmailStep';
import { AuthMethodStep } from '@/components/signup/AuthMethodStep';
import { PasswordStep } from '@/components/signup/PasswordStep';
import { ProfileStep } from '@/components/signup/ProfileStep';
import { OnboardingStep } from '@/components/signup/OnboardingStep';

type SignupStep = 'email' | 'auth-method' | 'password' | 'profile' | 'onboarding';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useI18n();
  const { isAuthenticated, signup, signupWithGoogle } = useAuth();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState<SignupStep>('email');
  const [email, setEmail] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<InvitationTokenResponse | null>(null);
  const [authMethod, setAuthMethod] = useState<'email' | 'google' | null>(null);
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for invitation token in URL
  useEffect(() => {
    const inviteToken = searchParams.get('invite');
    if (inviteToken) {
      setInvitationToken(inviteToken);
      // Fetch invitation details
      signupService.getInvitationByToken(inviteToken)
        .then(data => {
          setInvitationData(data);
          setEmail(data.email.toLowerCase());
        })
        .catch(err => {
          console.error('Failed to load invitation:', err);
          setError('Invalid or expired invitation link');
        });
    }
  }, [searchParams]);

  // Redirect if already authenticated and onboarding completed
  useEffect(() => {
    if (isAuthenticated && user?.onboardingCompleted) {
      navigate('/home');
    }
  }, [isAuthenticated, user, navigate]);

  // Update display name and avatar from user when authenticated (for Google signup)
  useEffect(() => {
    if (isAuthenticated && user && authMethod === 'google' && currentStep === 'profile') {
      if (user.displayName && !displayName) setDisplayName(user.displayName);
      if (user.avatarUrl && !avatarUrl) setAvatarUrl(user.avatarUrl);
    }
  }, [isAuthenticated, user, authMethod, currentStep, displayName, avatarUrl]);

  const handleEmailSubmit = async (submittedEmail: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await signupService.checkEmail(submittedEmail);
      setEmail(submittedEmail);
      setEmailExists(response.exists);
      setPendingInvitations(response.invitations || []);
      
      if (response.exists) {
        // User exists - redirect to login
        navigate(`/login?email=${encodeURIComponent(submittedEmail)}`);
      } else {
        // New user - proceed to auth method selection
        setCurrentStep('auth-method');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to check email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthMethodSelect = async (method: 'email' | 'google') => {
    setAuthMethod(method);
    if (method === 'google') {
      setIsLoading(true);
      setError(null);
      try {
        // Sign up with Google - this will authenticate the user
        await signupWithGoogle(false);
        // After Google signup, user is authenticated
        // Wait a bit for user state to update, then fetch profile info
        setTimeout(() => {
          // User state will be updated by AuthContext
          // Proceed to profile step (user can update if needed)
          setCurrentStep('profile');
        }, 500);
      } catch (err: any) {
        setError(err?.message || 'Failed to sign up with Google');
      } finally {
        setIsLoading(false);
      }
    } else {
      setCurrentStep('password');
    }
  };

  const handlePasswordSubmit = (pwd: string) => {
    setPassword(pwd);
    setCurrentStep('profile');
  };

  const handleProfileSubmit = async (profile: { displayName: string; avatarUrl?: string }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (authMethod === 'email') {
        // Sign up with email/password
        const signupResponse = await signup({
          email,
          password,
          displayName: profile.displayName,
        }, false);
        
        setPendingInvitations(signupResponse.pendingInvitations || []);
        
        // Accept any pending invitations (they will be accepted during onboarding)
        // Store them for the onboarding step
        if (signupResponse.pendingInvitations && signupResponse.pendingInvitations.length > 0) {
          setPendingInvitations(signupResponse.pendingInvitations);
        }
      } else {
        // For Google signup, profile is already set, just update if needed
        // The user is already authenticated at this point
        setDisplayName(profile.displayName);
        if (profile.avatarUrl) {
          setAvatarUrl(profile.avatarUrl);
        }
        
        // Get pending invitations (they will be accepted during onboarding)
        try {
          const emailCheck = await signupService.checkEmail(email);
          setPendingInvitations(emailCheck.invitations || []);
        } catch (err) {
          console.error('Failed to check invitations:', err);
        }
      }
      
      setDisplayName(profile.displayName);
      if (profile.avatarUrl) {
        setAvatarUrl(profile.avatarUrl);
      }
      setCurrentStep('onboarding');
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to complete signup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    navigate('/home');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'email':
        return (
          <EmailStep
            initialEmail={email}
            invitationData={invitationData}
            onSubmit={handleEmailSubmit}
            isLoading={isLoading}
            error={error}
          />
        );
      case 'auth-method':
        return (
          <AuthMethodStep
            email={email}
            onSelect={handleAuthMethodSelect}
            onBack={() => setCurrentStep('email')}
          />
        );
      case 'password':
        return (
          <PasswordStep
            email={email}
            onSubmit={handlePasswordSubmit}
            onBack={() => setCurrentStep('auth-method')}
          />
        );
      case 'profile':
        return (
          <ProfileStep
            email={email}
            initialDisplayName={displayName}
            initialAvatarUrl={avatarUrl}
            authMethod={authMethod}
            onSubmit={handleProfileSubmit}
            onBack={() => setCurrentStep(authMethod === 'google' ? 'auth-method' : 'password')}
            isLoading={isLoading}
            error={error}
          />
      case 'onboarding':
        return (
          <OnboardingStep
            email={email}
            pendingInvitations={pendingInvitations}
            onComplete={handleOnboardingComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ backgroundColor: 'var(--page-bg)' }}
    >
      <div className="w-full max-w-md">
        {/* Back Button */}
        {currentStep !== 'email' && (
          <button
            onClick={() => {
              if (currentStep === 'auth-method') setCurrentStep('email');
              else if (currentStep === 'password') setCurrentStep('auth-method');
              else if (currentStep === 'profile') setCurrentStep(authMethod === 'google' ? 'auth-method' : 'password');
              else if (currentStep === 'onboarding') setCurrentStep('profile');
            }}
            className="mb-4 flex items-center gap-2 text-sm transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        <div 
          className="rounded-2xl shadow-2xl p-8"
          style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          {/* Logo */}
          <div className="mb-8 text-center">
            <Logo size="lg" />
          </div>

          {/* Step Indicator */}
          <div className="mb-8 flex items-center justify-center gap-2">
            {['email', 'auth-method', 'password', 'profile', 'onboarding'].map((step, index) => {
              const stepIndex = ['email', 'auth-method', 'password', 'profile', 'onboarding'].indexOf(currentStep);
              const isActive = index === stepIndex;
              const isCompleted = index < stepIndex;
              
              return (
                <div
                  key={step}
                  className={`h-2 rounded-full transition-all ${
                    isActive ? 'w-8' : 'w-2'
                  }`}
                  style={{
                    backgroundColor: isActive || isCompleted 
                      ? 'var(--accent-primary)' 
                      : 'var(--border-subtle)',
                  }}
                />
              );
            })}
          </div>

          {/* Step Content */}
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

