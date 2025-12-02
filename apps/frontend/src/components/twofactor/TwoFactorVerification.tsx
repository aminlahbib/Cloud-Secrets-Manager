import React, { useState } from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface TwoFactorVerificationProps {
  onVerify: (code: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
  onErrorClear?: () => void;
}

export const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({
  onVerify,
  onCancel,
  isLoading = false,
  error,
  onErrorClear,
}) => {
  const [code, setCode] = useState('');
  const [isRecoveryCode, setIsRecoveryCode] = useState(false);

  // Clear code when error appears (so user can easily retry)
  React.useEffect(() => {
    if (error && code) {
      setCode('');
    }
  }, [error, code]);

  const handleCodeChange = (value: string) => {
    // Clear error when user starts typing
    if (error && onErrorClear) {
      onErrorClear();
    }
    // Auto-detect if it's a recovery code format (XXXX-XXXX)
    const upperValue = value.toUpperCase();
    setCode(upperValue);
    setIsRecoveryCode(
      !!(upperValue.includes('-') || upperValue.match(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      return;
    }
    // Clear any previous errors when submitting new code
    try {
      await onVerify(code);
    } catch (err) {
      // Error is handled by parent component (LoginPage)
      // Just prevent form submission from propagating
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: 'var(--accent-primary-bg)' }}
        >
          <Shield className="h-8 w-8" style={{ color: 'var(--accent-primary)' }} />
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Two-Factor Authentication
        </h2>
        <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      {error && (
        <div 
          className="p-3 border rounded-lg flex items-start gap-2"
          style={{
            backgroundColor: 'var(--status-danger-bg)',
            borderColor: 'var(--status-danger)',
          }}
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--status-danger)' }} />
          <p className="text-body-sm" style={{ color: 'var(--status-danger)' }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-body-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            {isRecoveryCode ? 'Recovery Code' : 'Verification Code'}
          </label>
          <Input
            type="text"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            placeholder={isRecoveryCode ? "XXXX-XXXX" : "000000"}
            className={`text-center text-2xl tracking-widest font-mono ${isRecoveryCode ? 'uppercase' : ''}`}
            maxLength={isRecoveryCode ? 9 : 6}
            autoFocus
            autoComplete="one-time-code"
          />
          <p className="text-caption mt-2" style={{ color: 'var(--text-tertiary)' }}>
            {isRecoveryCode 
              ? 'Enter a recovery code if you lost access to your authenticator app'
              : 'Enter the 6-digit code from your authenticator app'}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={!code.trim()}
            className="flex-1"
          >
            Verify
          </Button>
        </div>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setIsRecoveryCode(!isRecoveryCode)}
          className="text-body-sm underline"
          style={{ color: 'var(--accent-primary)' }}
        >
          {isRecoveryCode ? 'Use authenticator code instead' : 'Use recovery code instead'}
        </button>
      </div>
    </div>
  );
};

