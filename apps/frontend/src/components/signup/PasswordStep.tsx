import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface PasswordStepProps {
  email?: string;
  onSubmit: (password: string) => void;
  onBack: () => void;
}

interface PasswordForm {
  password: string;
  confirmPassword: string;
}

export const PasswordStep: React.FC<PasswordStepProps> = ({
  onSubmit,
  onBack,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<PasswordForm>();
  
  const password = watch('password', '');
  
  const getPasswordStrength = (pwd: string): { strength: 'weak' | 'medium' | 'strong'; score: number } => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    
    if (score <= 2) return { strength: 'weak', score };
    if (score <= 4) return { strength: 'medium', score };
    return { strength: 'strong', score };
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

  const onFormSubmit = (data: PasswordForm) => {
    onSubmit(data.password);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: 'var(--text-primary)' }}>
        Create a password
      </h2>
      <p className="text-center mb-8" style={{ color: 'var(--text-secondary)' }}>
        Choose a strong password to secure your account
      </p>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div>
          <label 
            htmlFor="password" 
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
              })}
              className="w-full pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm" style={{ color: 'var(--status-danger)' }}>
              {errors.password.message}
            </p>
          )}
          
          {password && passwordStrength && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--elevation-2)' }}>
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${(passwordStrength.score / 6) * 100}%`,
                      backgroundColor: passwordStrength.strength === 'weak' 
                        ? 'var(--status-danger)' 
                        : passwordStrength.strength === 'medium'
                        ? 'var(--status-warning)'
                        : 'var(--status-success)',
                    }}
                  />
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  {passwordStrength.strength}
                </span>
              </div>
              <div className="text-xs space-y-1" style={{ color: 'var(--text-tertiary)' }}>
                <div className="flex items-center gap-1">
                  {password.length >= 8 ? (
                    <CheckCircle className="h-3 w-3" style={{ color: 'var(--status-success)' }} />
                  ) : (
                    <XCircle className="h-3 w-3" style={{ color: 'var(--text-tertiary)' }} />
                  )}
                  <span>At least 8 characters</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <label 
            htmlFor="confirmPassword" 
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Confirm Password
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match',
              })}
              className="w-full pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm" style={{ color: 'var(--status-danger)' }}>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
          >
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
};

