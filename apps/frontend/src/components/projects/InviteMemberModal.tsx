import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useNotifications } from '../../contexts/NotificationContext';
import { membersService } from '../../services/members';
import { signupService, type EmailCheckResponse } from '../../services/signup';
import { CheckCircle, Mail, User, AlertCircle } from 'lucide-react';
import type { ProjectRole } from '../../types';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  currentUserRole: ProjectRole;
  onSuccess: () => void;
}

type Step = 'check' | 'confirm';

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  currentUserRole,
  onSuccess,
}) => {
  const { showNotification } = useNotifications();
  const [step, setStep] = useState<Step>('check');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ProjectRole>('MEMBER');
  const [isChecking, setIsChecking] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [emailCheckResult, setEmailCheckResult] = useState<EmailCheckResponse | null>(null);

  const availableRoles: ProjectRole[] =
    currentUserRole === 'OWNER' ? ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] : ['ADMIN', 'MEMBER', 'VIEWER'];

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
      setStep('confirm');
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

  const handleSendInvitation = async () => {
    setIsInviting(true);
    try {
      await membersService.inviteMember(projectId, { email: email.trim(), role });
      showNotification({
        type: 'success',
        title: 'Invitation sent',
        message: emailCheckResult?.exists
          ? `${email} will receive both an in-app notification and an email invitation`
          : `${email} will receive an email invitation`,
      });
      handleClose();
      onSuccess();
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Failed to send invitation',
        message: error?.response?.data?.message || error?.message || 'An error occurred',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleClose = () => {
    if (!isChecking && !isInviting) {
      setStep('check');
      setEmail('');
      setRole('MEMBER');
      setEmailCheckResult(null);
      onClose();
    }
  };

  const handleBack = () => {
    setStep('check');
    setEmailCheckResult(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Member" size="md">
      {step === 'check' ? (
        <div className="space-y-4">
          <p className="text-body-sm text-theme-secondary">
            Enter the email address to check if the user is registered.
          </p>

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@example.com"
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
                : 'bg-status-info-bg border-status-info'
            }`}
          >
            <div className="flex items-start gap-3">
              {emailCheckResult?.exists ? (
                <CheckCircle className="h-5 w-5 text-status-success flex-shrink-0 mt-0.5" />
              ) : (
                <User className="h-5 w-5 text-status-info flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-theme-primary">
                  {emailCheckResult?.exists ? 'Registered User' : 'New User'}
                </p>
                <p className="text-xs text-theme-secondary mt-1">
                  {emailCheckResult?.exists
                    ? 'This user will receive both an in-app notification and an email invitation.'
                    : 'This user will receive an email invitation to join the project.'}
                </p>
                {emailCheckResult?.hasPendingInvitations && (
                  <div className="mt-2 p-2 bg-elevation-1 rounded text-xs text-theme-secondary">
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    This user has {emailCheckResult.invitations.length} pending invitation
                    {emailCheckResult.invitations.length > 1 ? 's' : ''} from other projects.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-body-sm font-medium mb-2 text-theme-primary">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ProjectRole)}
              className="input-theme w-full px-4 py-2 rounded-lg focus:ring-2"
              disabled={isInviting}
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {r === 'VIEWER' && 'Viewer - Read-only access'}
                  {r === 'MEMBER' && 'Member - Can create and update secrets'}
                  {r === 'ADMIN' && 'Admin - Can manage secrets and members'}
                  {r === 'OWNER' && 'Owner - Full control'}
                </option>
              ))}
            </select>
          </div>

          {/* Confirmation Message */}
          <div className="p-3 bg-elevation-1 rounded-lg">
            <p className="text-xs text-theme-secondary">
              You are about to invite <strong className="text-theme-primary">{email}</strong> to{' '}
              <strong className="text-theme-primary">{projectName}</strong> as a <strong className="text-theme-primary">{role}</strong>.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-theme-subtle">
            <Button variant="secondary" onClick={handleBack} disabled={isInviting}>
              Back
            </Button>
            <Button onClick={handleSendInvitation} isLoading={isInviting} disabled={!email.trim()}>
              Send Invitation
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

