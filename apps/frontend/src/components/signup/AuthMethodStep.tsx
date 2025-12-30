import React from 'react';
import { Mail, Chrome } from 'lucide-react';

interface AuthMethodStepProps {
  email: string;
  onSelect: (method: 'email' | 'google') => void;
  onBack: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const AuthMethodStep: React.FC<AuthMethodStepProps> = ({
  email,
  onSelect,
  isLoading = false,
  error = null,
}) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: 'var(--text-primary)' }}>
        Choose sign up method
      </h2>
      <p className="text-center mb-8" style={{ color: 'var(--text-secondary)' }}>
        How would you like to sign up?
      </p>

      <div className="space-y-4">
        <button
          onClick={() => onSelect('email')}
          className="w-full p-4 rounded-lg border-2 transition-all text-left"
          style={{
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--elevation-1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.backgroundColor = 'var(--elevation-2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.backgroundColor = 'var(--elevation-1)';
          }}
        >
          <div className="flex items-center gap-4">
            <div 
              className="p-3 rounded-lg"
              style={{ backgroundColor: 'var(--elevation-2)' }}
            >
              <Mail className="h-6 w-6" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Sign up with Email
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Create an account with {email}
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onSelect('google')}
          className="w-full p-4 rounded-lg border-2 transition-all text-left"
          style={{
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--elevation-1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.backgroundColor = 'var(--elevation-2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.backgroundColor = 'var(--elevation-1)';
          }}
        >
          <div className="flex items-center gap-4">
            <div 
              className="p-3 rounded-lg"
              style={{ backgroundColor: 'var(--elevation-2)' }}
            >
              <Chrome className="h-6 w-6" style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Sign up with Google
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Quick sign up with your Google account
              </p>
            </div>
          </div>
        </button>
      </div>

      {error && (
        <div 
          className="mt-4 p-3 rounded-lg flex items-center gap-2"
          style={{
            backgroundColor: 'var(--status-danger-bg)',
            color: 'var(--status-danger)',
          }}
        >
          <span className="text-sm">{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="mt-4 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Processing...
        </div>
      )}
    </div>
  );
};

