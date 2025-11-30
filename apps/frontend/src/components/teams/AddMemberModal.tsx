import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useNotifications } from '../../contexts/NotificationContext';
import { teamsService } from '../../services/teams';
import type { TeamMemberRequest, TeamRole } from '../../types';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  onSuccess: () => void;
  canAssignOwner?: boolean;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  teamId,
  onSuccess,
  canAssignOwner = false,
}) => {
  const { showNotification } = useNotifications();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('TEAM_MEMBER');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Email is required',
      });
      return;
    }

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
      setEmail('');
      setRole('TEAM_MEMBER');
      onSuccess();
      onClose();
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
    if (!isAdding) {
      setEmail('');
      setRole('TEAM_MEMBER');
      onClose();
    }
  };

  const roleOptions: { value: TeamRole; label: string }[] = [
    { value: 'TEAM_MEMBER', label: 'Member' },
    { value: 'TEAM_ADMIN', label: 'Admin' },
    ...(canAssignOwner ? [{ value: 'TEAM_OWNER', label: 'Owner' }] : []),
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Team Member" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          required
          disabled={isAdding}
          autoFocus
        />

        <div>
          <label className="block text-body-sm font-medium mb-1 text-theme-primary">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as TeamRole)}
            className="input-theme w-full px-3 py-2 rounded-lg"
            disabled={isAdding}
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

        <div className="flex justify-end gap-3 pt-4 border-t border-theme-subtle">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isAdding}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isAdding}>
            Add Member
          </Button>
        </div>
      </form>
    </Modal>
  );
};

