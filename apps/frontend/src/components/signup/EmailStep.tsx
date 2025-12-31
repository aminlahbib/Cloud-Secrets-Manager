import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { InvitationTokenResponse } from '@/services/signup';

interface EmailStepProps {
  initialEmail?: string;
  invitationData?: InvitationTokenResponse | null;
  onSubmit: (email: string) => void;
  isLoading: boolean;
  error: string | null;
}

export const EmailStep: React.FC<EmailStepProps> = ({
  initialEmail = '',
  invitationData,
  onSubmit,
  isLoading,
  error,
}) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<{ email: string }>();

  useEffect(() => {
    if (initialEmail) {
      setValue('email', initialEmail);
    }
  }, [initialEmail, setValue]);

  const onFormSubmit = (data: { email: string }) => {
    onSubmit(data.email.toLowerCase().trim());
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: 'var(--text-primary)' }}>
        {invitationData ? 'Welcome!' : 'Create your account'}
      </h2>
      <p className="text-center mb-8" style={{ color: 'var(--text-secondary)' }}>
        {invitationData 
          ? `${invitationData.inviterName} invited you to join ${invitationData.projectName}`
          : 'Enter your email to get started'
        }
      </p>

      {invitationData && (
        <div 
          className="mb-6 p-4 rounded-lg"
          style={{
            backgroundColor: 'var(--elevation-1)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 mt-0.5" style={{ color: 'var(--accent-primary)' }} />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Project Invitation
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                You'll be added as a <strong>{invitationData.role}</strong> to <strong>{invitationData.projectName}</strong> after signing up.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Email address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            disabled={isLoading || !!invitationData}
            className="w-full"
          />
          {errors.email && (
            <p className="mt-1 text-sm flex items-center gap-1" style={{ color: 'var(--status-danger)' }}>
              <AlertCircle className="h-4 w-4" />
              {errors.email.message}
            </p>
          )}
        </div>

        {error && (
          <div 
            className="p-3 rounded-lg flex items-center gap-2"
            style={{
              backgroundColor: 'var(--status-danger-bg)',
              color: 'var(--status-danger)',
            }}
          >
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Checking...' : 'Continue'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
        Already have an account?{' '}
        <a
          href="/login"
          className="font-medium transition-colors"
          style={{ color: 'var(--accent-primary)' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          Sign in
        </a>
      </p>
    </div>
  );
};

