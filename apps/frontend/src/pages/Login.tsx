import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { TwoFactorVerification } from '@/components/twofactor/TwoFactorVerification';
import { handleApiError } from '@/services/api';
import type { LoginRequest } from '@/types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, isFirebaseEnabled, user } = useAuth();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [intermediateToken, setIntermediateToken] = useState<string | null>(null);
  const [loginCredentials, setLoginCredentials] = useState<LoginRequest | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Navigation guard: redirect if already authenticated
  useEffect(() => {
    if (user && !requires2FA) {
      navigate('/home', { replace: true });
    }
  }, [user, navigate, requires2FA]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);

    console.log('Login submitted with keepSignedIn:', keepSignedIn);

    try {
      const result = await login(data, keepSignedIn);
      if (result && 'requiresTwoFactor' in result && result.requiresTwoFactor) {
        // 2FA required - show verification step
        setRequires2FA(true);
        setIntermediateToken(result.intermediateToken || null);
        setLoginCredentials(data);
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerify = async (code: string) => {
    if (!intermediateToken) {
      setError('Session expired. Please try logging in again.');
      setRequires2FA(false);
      setIntermediateToken(null);
      setLoginCredentials(null);
      return;
    }

    setIsLoading(true);
    setIsVerifying(true);
    setError(null);

    try {
      if (loginCredentials) {
        // Email/password login
        await login(loginCredentials, keepSignedIn, intermediateToken, code);
        // Login successful - clear 2FA state and navigation handled by AuthContext
        // Small delay to show success feedback before redirect
        await new Promise(resolve => setTimeout(resolve, 300));
        setRequires2FA(false);
        setIntermediateToken(null);
        setLoginCredentials(null);
      } else {
        // Google login
        await loginWithGoogle(keepSignedIn, intermediateToken, code);
        // Login successful - clear 2FA state and navigation handled by AuthContext
        // Small delay to show success feedback before redirect
        await new Promise(resolve => setTimeout(resolve, 300));
        setRequires2FA(false);
        setIntermediateToken(null);
        setLoginCredentials(null);
      }
    } catch (err: any) {
      // Extract error message and code from API response
      const errorData = err?.response?.data || {};
      const errorCode = errorData.errorCode;
      const errorMessage = errorData.message || 
                          errorData.error || 
                          err?.message || 
                          'Invalid verification code. Please try again.';
      
      // Handle specific error codes
      if (errorCode === 'EXPIRED_TOKEN') {
        setError(errorMessage);
        setIntermediateToken(null);
        setRequires2FA(false);
        setLoginCredentials(null);
      } else if (errorCode === 'INVALID_CODE' || errorCode === 'RATE_LIMIT_EXCEEDED') {
        // Keep user on 2FA screen with error message
        setError(errorMessage);
        // Don't reset requires2FA - let user try again
      } else if (errorCode === 'USER_NOT_FOUND' || errorCode === '2FA_NOT_ENABLED') {
        // These are more serious errors - reset 2FA state
        setError(errorMessage);
        setRequires2FA(false);
        setIntermediateToken(null);
        setLoginCredentials(null);
      } else {
        // Check if it's a 2FA-specific error by message content (fallback for old API responses)
        const is2FAError = errorMessage.toLowerCase().includes('invalid') ||
                          errorMessage.toLowerCase().includes('code') ||
                          errorMessage.toLowerCase().includes('expired') ||
                          errorMessage.toLowerCase().includes('verification') ||
                          errorMessage.toLowerCase().includes('token');
        
        if (is2FAError) {
          // Keep user on 2FA screen with error message
          setError(errorMessage);
          // But clear intermediate token if it's expired
          if (errorMessage.toLowerCase().includes('expired') || 
              (errorMessage.toLowerCase().includes('invalid') && errorMessage.toLowerCase().includes('token'))) {
            setIntermediateToken(null);
            setRequires2FA(false);
          }
        } else {
          // For other errors (network, server, etc.), show error but keep on 2FA screen
          setError(errorMessage || 'Verification failed. Please try again.');
        }
      }
    } finally {
      setIsLoading(false);
      setIsVerifying(false);
    }
  };

  const handle2FACancel = () => {
    setRequires2FA(false);
    setIntermediateToken(null);
    setLoginCredentials(null);
    setError(null);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);

    console.log('Google login submitted with keepSignedIn:', keepSignedIn);

    try {
      const result = await loginWithGoogle(keepSignedIn);

      // If backend indicates 2FA is required, show verification step
      if (result && 'requiresTwoFactor' in result && result.requiresTwoFactor) {
        setRequires2FA(true);
        setIntermediateToken(result.intermediateToken || null);
        // For Google login, we don't need stored credentials
        setLoginCredentials(null);
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-8 relative"
      style={{ backgroundColor: 'var(--page-bg)' }}
    >
      <div className="absolute top-4 right-4">
        <LanguageSelector iconOnly={true} />
      </div>
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-4 flex items-center gap-2 text-sm transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.backToHome')}
        </button>

        <div 
          className="rounded-2xl shadow-2xl p-8"
          style={{
            backgroundColor: 'var(--card-bg)',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="xl" showText={false} clickable={false} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('login.title')}</h1>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>{t('login.subtitle')}</p>
          </div>

          {/* Error Alert (only for primary login / non-2FA errors) */}
          {error && !requires2FA && (
            <div 
              className="mb-4 p-3 border rounded-lg"
              style={{
                backgroundColor: 'var(--status-danger-bg)',
                borderColor: 'var(--status-danger)',
              }}
            >
              <p className="text-body-sm" style={{ color: 'var(--status-danger)' }}>{error}</p>
            </div>
          )}

          {/* 2FA Verification Step */}
          {requires2FA && intermediateToken ? (
            <TwoFactorVerification
              onVerify={handle2FAVerify}
              onCancel={handle2FACancel}
              isLoading={isLoading || isVerifying}
              error={error}
              onErrorClear={() => setError(null)}
            />
          ) : (
            <>
              {/* Login Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label={t('login.email')}
              type="email"
              placeholder={t('login.emailPlaceholder')}
              {...register('email', {
                required: t('login.emailRequired'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('login.emailInvalid'),
                },
              })}
              error={errors.email?.message}
            />

            <Input
              label={t('login.password')}
              type="password"
              placeholder={t('login.passwordPlaceholder')}
              {...register('password', {
                required: t('login.passwordRequired'),
                minLength: {
                  value: 8,
                  message: t('login.passwordMinLength'),
                },
              })}
              error={errors.password?.message}
            />

            <div className="flex items-center">
              <input
                id="keep-signed-in"
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="h-4 w-4 rounded input-theme"
                style={{ borderColor: 'var(--border-default)' }}
              />
              <label htmlFor="keep-signed-in" className="ml-2 block text-body-sm" style={{ color: 'var(--text-primary)' }}>
                {t('login.keepSignedIn')}
              </label>
            </div>
            <p className="text-caption -mt-2 mb-2" style={{ color: 'var(--text-secondary)' }}>
              {keepSignedIn 
                ? t('login.keepSignedInDescription')
                : t('login.keepSignedInDescriptionSession')}
            </p>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              {t('login.signIn')}
            </Button>
          </form>

          {/* Google OAuth */}
          {isFirebaseEnabled && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderTopColor: 'var(--border-default)' }} />
                </div>
                <div className="relative flex justify-center text-body-sm">
                  <span 
                    className="px-2"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {t('login.orContinueWith')}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                className="w-full mt-4"
                onClick={handleGoogleSignIn}
                isLoading={isGoogleLoading}
                disabled={isGoogleLoading || isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {isGoogleLoading ? t('login.signingIn') : t('login.signInWithGoogle')}
              </Button>
            </div>
          )}
            </>
          )}

          {/* Footer */}
          {!requires2FA && (
            <p className="mt-6 text-center text-body-sm" style={{ color: 'var(--text-secondary)' }}>
              {t('login.noAccount')}{' '}
              <button
                onClick={() => navigate('/signup')}
                className="font-medium transition-colors hover:opacity-80"
                style={{ color: 'var(--accent-primary)' }}
              >
                {t('login.signUp')}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

