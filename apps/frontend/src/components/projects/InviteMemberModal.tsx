import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useNotifications } from '../../contexts/NotificationContext';
import { useI18n } from '../../contexts/I18nContext';
import { membersService } from '../../services/members';
import { signupService, type EmailCheckResponse } from '../../services/signup';
import { CheckCircle, User, AlertCircle } from 'lucide-react';
import type { ProjectRole, ProjectInvitation } from '../../types';

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
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('check');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ProjectRole>('MEMBER');
  const [isChecking, setIsChecking] = useState(false);
  const [emailCheckResult, setEmailCheckResult] = useState<EmailCheckResponse | null>(null);
  
  const inviteMutation = useMutation({
    mutationFn: () => membersService.inviteMember(projectId, { email: email.trim(), role }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['project-invitations', projectId] });
      const previous = queryClient.getQueryData(['project-invitations', projectId]);
      
      // Optimistically add invitation
      const optimisticInvitation: ProjectInvitation = {
        id: `temp-${Date.now()}`,
        projectId,
        email: email.trim(),
        role,
        invitedBy: '', // Will be replaced by server response
        token: '', // Will be replaced by server response
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };
      
      queryClient.setQueryData(['project-invitations', projectId], (old: any) => {
        if (!old) return [optimisticInvitation];
        return Array.isArray(old) 
          ? [...old, optimisticInvitation]
          : { ...old, content: [...(old.content || []), optimisticInvitation] };
      });
      
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['project-invitations', projectId], context.previous);
      }
    },
    onSuccess: (data) => {
      // Update with server response
      queryClient.setQueryData(['project-invitations', projectId], (old: any) => {
        if (!old) return Array.isArray(old) ? [data] : { content: [data] };
        return Array.isArray(old)
          ? old.map(inv => inv.id?.toString().startsWith('temp-') ? data : inv)
          : { ...old, content: old.content?.map((inv: any) => inv.id?.toString().startsWith('temp-') ? data : inv) || [data] };
      });
      
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['project-invitations', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
    },
  });

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
    inviteMutation.mutate(undefined, {
      onSuccess: () => {
        showNotification({
          type: 'success',
          title: 'Invitation sent',
          message: emailCheckResult?.exists
            ? `${email} will receive both an in-app notification and an email invitation`
            : `${email} will receive an email invitation`,
        });
        handleClose();
        onSuccess();
      },
      onError: (error: any) => {
        showNotification({
          type: 'error',
          title: 'Failed to send invitation',
          message: error?.response?.data?.message || error?.message || 'An error occurred',
        });
      },
    });
  };

  const handleClose = () => {
    if (!isChecking && !inviteMutation.isPending) {
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
    <Modal isOpen={isOpen} onClose={handleClose} title={t('inviteMember.title')} size="md">
      {step === 'check' ? (
        <div className="space-y-4">
          <p className="text-body-sm text-theme-secondary">
            {t('inviteMember.checkEmailDescription')}
          </p>

          <Input
            label={t('inviteMember.emailAddress')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('inviteMember.emailPlaceholder')}
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
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCheckEmail} isLoading={isChecking} disabled={!email.trim()}>
              {t('inviteMember.checkEmail')}
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
                  {emailCheckResult?.exists ? t('inviteMember.registeredUser') : t('inviteMember.newUser')}
                </p>
                <p className="text-xs text-theme-secondary mt-1">
                  {emailCheckResult?.exists
                    ? t('inviteMember.registeredUserDescription')
                    : t('inviteMember.newUserDescription')}
                </p>
                {emailCheckResult?.hasPendingInvitations && (
                  <div className="mt-2 p-2 bg-elevation-1 rounded text-xs text-theme-secondary">
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    {t('inviteMember.pendingInvitations', { 
                      count: emailCheckResult.invitations.length, 
                      plural: emailCheckResult.invitations.length > 1 ? 's' : '' 
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-body-sm font-medium mb-2 text-theme-primary">{t('inviteMember.selectRole')}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ProjectRole)}
              className="input-theme w-full px-4 py-2 rounded-lg focus:ring-2"
              disabled={inviteMutation.isPending}
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {r === 'VIEWER' && t('roles.roleDescription.viewer')}
                  {r === 'MEMBER' && t('roles.roleDescription.member')}
                  {r === 'ADMIN' && t('roles.roleDescription.admin')}
                  {r === 'OWNER' && t('roles.roleDescription.owner')}
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
            <Button variant="secondary" onClick={handleBack} disabled={inviteMutation.isPending}>
              {t('common.back')}
            </Button>
            <Button onClick={handleSendInvitation} isLoading={inviteMutation.isPending} disabled={!email.trim()}>
              {t('inviteMember.sendInvitation')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

