import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useNotifications } from '../../contexts/NotificationContext';
import { teamsService } from '../../services/teams';
import { signupService, type EmailCheckResponse } from '../../services/signup';
import { CheckCircle, AlertCircle } from 'lucide-react';
import type { TeamMemberRequest, TeamRole } from '../../types';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  onSuccess: () => void;
  canAssignOwner?: boolean;
}

type Step = 'check' | 'confirm';

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  teamId,
  onSuccess,
  canAssignOwner = false,
}) => {
  const { showNotification } = useNotifications();
  const [step, setStep] = useState<Step>('check');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('TEAM_MEMBER');
  const [isChecking, setIsChecking] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [emailCheckResult, setEmailCheckResult] = useState<EmailCheckResponse | null>(null);

  const handleCheckEmail = async () => {
    if (!email.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter an email address',
      });
      return;
    }

    setIsChecking(true);
    try {
      const result = await signupService.checkEmail(email.trim());
      setEmailCheckResult(result);
      
      // If user doesn't exist, show helpful message
      if (!result.exists) {
        showNotification({
          type: 'warning',
          title: 'User not registered',
          message: 'This email is not registered. The user must sign up first before they can be added to the team.',
        });
        // Still allow them to proceed to confirmation step to see the message
        setStep('confirm');
      } else {
        // User exists, proceed to confirmation
        setStep('confirm');
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Failed to check email',
        message: error?.response?.data?.message || error?.message || 'An error occurred',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleAddMember = async () => {
    setIsAdding(true);
    try {
      const request: TeamMemberRequest = {
        email: email.trim(),
        role,
      };
      await teamsService.addTeamMember(teamId, request);
      showNotification({
        type: 'success',
        title: 'Member added',
        message: `${email} has been added to the team`,
      });
      handleClose();
      onSuccess();
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Failed to add member',
        message: error?.response?.data?.message || error?.message || 'An error occurred',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    if (!isChecking && !isAdding) {
      setStep('check');
      setEmail('');
      setRole('TEAM_MEMBER');
      setEmailCheckResult(null);
      onClose();
    }
  };

  const handleBack = () => {
    setStep('check');
    setEmailCheckResult(null);
  };

  const roleOptions: { value: TeamRole; label: string }[] = [
    { value: 'TEAM_MEMBER', label: 'Member' },
    { value: 'TEAM_ADMIN', label: 'Admin' },
    ...(canAssignOwner ? [{ value: 'TEAM_OWNER' as TeamRole, label: 'Owner' }] : []),
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Team Member" size="md">
      {step === 'check' ? (
        <div className="space-y-4">
          <p className="text-body-sm text-theme-secondary">
            Enter the email address of the user you want to add to the team. We'll check if they're registered in the system.
          </p>

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            disabled={isChecking}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isChecking) {
                handleCheckEmail();
              }
            }}
          />

          <div className="flex justify-end space-x-3 pt-4 border-t border-theme-subtle">
            <Button variant="secondary" onClick={handleClose} disabled={isChecking}>
              Cancel
            </Button>
            <Button onClick={handleCheckEmail} isLoading={isChecking} disabled={!email.trim()}>
              Check Email
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Email Check Result */}
          <div
            className={`p-4 rounded-lg border ${
              emailCheckResult?.exists
                ? 'bg-status-success-bg border-status-success'
                : 'bg-status-warning-bg border-status-warning'
            }`}
          >
            <div className="flex items-start gap-3">
              {emailCheckResult?.exists ? (
                <CheckCircle className="h-5 w-5 text-status-success flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-status-warning flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-theme-primary">
                  {emailCheckResult?.exists ? 'Registered User' : 'User Not Registered'}
                </p>
                <p className="text-xs text-theme-secondary mt-1">
                  {emailCheckResult?.exists
                    ? 'This user is registered and can be added to the team immediately.'
                    : 'This email is not registered. The user must sign up first before they can be added to the team. Please ask them to create an account, then try again.'}
                </p>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-body-sm font-medium mb-2 text-theme-primary">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as TeamRole)}
              className="input-theme w-full px-4 py-2 rounded-lg focus:ring-2"
              disabled={isAdding || !emailCheckResult?.exists}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-caption text-theme-tertiary">
              {role === 'TEAM_OWNER' && 'Full control over the team'}
              {role === 'TEAM_ADMIN' && 'Can manage members and projects'}
              {role === 'TEAM_MEMBER' && 'Can view and work on team projects'}
            </p>
          </div>

          {/* Confirmation Message */}
          {emailCheckResult?.exists && (
            <div className="p-3 bg-elevation-1 rounded-lg">
              <p className="text-xs text-theme-secondary">
                You are about to add <strong className="text-theme-primary">{email}</strong> to the team as a{' '}
                <strong className="text-theme-primary">{roleOptions.find(r => r.value === role)?.label}</strong>.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-theme-subtle">
            <Button variant="secondary" onClick={handleBack} disabled={isAdding}>
              Back
            </Button>
            <Button 
              onClick={handleAddMember} 
              isLoading={isAdding} 
              disabled={!email.trim() || !emailCheckResult?.exists}
            >
              Add Member
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

