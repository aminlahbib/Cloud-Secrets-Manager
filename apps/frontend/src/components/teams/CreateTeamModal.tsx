import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useNotifications } from '../../contexts/NotificationContext';
import { teamsService } from '../../services/teams';
import type { CreateTeamRequest, Team } from '../../types';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  team?: Team; // If provided, modal is in edit mode
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  team,
}) => {
  const { showNotification } = useNotifications();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const isEditMode = !!team;

  // Initialize form with team data when editing
  useEffect(() => {
    if (team) {
      setName(team.name);
      setDescription(team.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [team, isOpen]);

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
      
      if (isEditMode && team) {
        await teamsService.updateTeam(team.id, request);
        showNotification({
          type: 'success',
          title: 'Team updated',
          message: `Team "${name}" has been updated successfully`,
        });
      } else {
        await teamsService.createTeam(request);
        showNotification({
          type: 'success',
          title: 'Team created',
          message: `Team "${name}" has been created successfully`,
        });
      }
      
      setName('');
      setDescription('');
      onSuccess();
      onClose();
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: isEditMode ? 'Failed to update team' : 'Failed to create team',
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
    <Modal isOpen={isOpen} onClose={handleClose} title={isEditMode ? "Edit Team" : "Create Team"} size="md">
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
            {isEditMode ? 'Update Team' : 'Create Team'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

