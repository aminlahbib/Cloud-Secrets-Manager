import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useNotification } from '../../contexts/NotificationContext';
import { teamsService } from '../../services/teams';
import type { CreateTeamRequest } from '../../types';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showNotification } = useNotification();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Team name is required',
      });
      return;
    }

    setIsCreating(true);
    try {
      const request: CreateTeamRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
      };
      await teamsService.createTeam(request);
      showNotification({
        type: 'success',
        title: 'Team created',
        message: `Team "${name}" has been created successfully`,
      });
      setName('');
      setDescription('');
      onSuccess();
      onClose();
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Failed to create team',
        message: error?.response?.data?.message || error?.message || 'An error occurred',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setName('');
      setDescription('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Team" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Team Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Engineering Team"
          required
          disabled={isCreating}
          autoFocus
        />

        <div>
          <label className="block text-body-sm font-medium mb-1 text-theme-primary">
            Description
            <span className="font-normal ml-1 text-theme-tertiary">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the team's purpose..."
            rows={3}
            className="input-theme w-full px-3 py-2 rounded-lg resize-none"
            disabled={isCreating}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-theme-subtle">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isCreating}>
            Create Team
          </Button>
        </div>
      </form>
    </Modal>
  );
};

