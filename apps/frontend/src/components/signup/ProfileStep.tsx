import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ProfileStepProps {
  email: string;
  initialDisplayName?: string;
  initialAvatarUrl?: string;
  authMethod: 'email' | 'google' | null;
  onSubmit: (profile: { displayName: string; avatarUrl?: string }) => void;
  onBack: () => void;
  isLoading?: boolean;
  error?: string | null;
}

interface ProfileForm {
  displayName: string;
}

export const ProfileStep: React.FC<ProfileStepProps> = ({
  email,
  initialDisplayName = '',
  initialAvatarUrl = '',
  onSubmit,
  onBack,
  isLoading = false,
  error = null,
}) => {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ProfileForm>();

  useEffect(() => {
    if (initialDisplayName) {
      setValue('displayName', initialDisplayName);
    } else if (email) {
      // Pre-fill with email username
      const username = email.split('@')[0];
      setValue('displayName', username);
    }
  }, [initialDisplayName, email, setValue]);

  const onFormSubmit = (data: ProfileForm) => {
    onSubmit({
      displayName: data.displayName,
      avatarUrl: avatarUrl || undefined,
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, just store the file name or URL
      // In production, you'd upload to a storage service
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-center" style={{ color: 'var(--text-primary)' }}>
        Complete your profile
      </h2>
      <p className="text-center mb-8" style={{ color: 'var(--text-secondary)' }}>
        Add a few details to personalize your account
      </p>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover"
                style={{ border: '3px solid var(--border-subtle)' }}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--elevation-2)',
                  border: '3px solid var(--border-subtle)',
                }}
              >
                <User className="h-12 w-12" style={{ color: 'var(--text-tertiary)' }} />
              </div>
            )}
            <label
              htmlFor="avatar"
              className="absolute bottom-0 right-0 p-2 rounded-full cursor-pointer transition-all"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--text-inverse)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Upload className="h-4 w-4" />
              <input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Upload a profile picture (optional)
          </p>
        </div>

        {/* Display Name */}
        <div>
          <label 
            htmlFor="displayName" 
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Display Name
          </label>
          <Input
            id="displayName"
            type="text"
            placeholder="Your name"
            {...register('displayName', {
              required: 'Display name is required',
              minLength: {
                value: 2,
                message: 'Display name must be at least 2 characters',
              },
            })}
            className="w-full"
          />
          {errors.displayName && (
            <p className="mt-1 text-sm" style={{ color: 'var(--status-danger)' }}>
              {errors.displayName.message}
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
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
            className="flex-1"
            disabled={isLoading}
          >
            Back
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
};

