import React, { useState, useEffect } from 'react';
import { Users, CheckCircle2 } from 'lucide-react';
import { MultiStepSlider, type Step } from '../ui/MultiStepSlider';
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
  const [currentStep, setCurrentStep] = useState(0);
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
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [team, isOpen]);

  const handleComplete = async () => {
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
      setCurrentStep(0);
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
      setCurrentStep(0);
      onClose();
    }
  };

  const steps: Step[] = [
    {
      id: 'basic-info',
      title: isEditMode ? 'Edit Team Details' : 'Team Details',
      subtitle: isEditMode ? 'Update your team information' : 'Tell us about your team',
      isValid: !!name.trim(),
      content: (
        <div className="space-y-6">
          <div>
            <Input
              label="Team Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Engineering Team"
              required
              disabled={isCreating}
              autoFocus
              icon={<Users className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />}
            />
            <p className="mt-2 text-sm text-theme-secondary">
              Choose a clear and descriptive name for your team.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-theme-primary">
              Description <span className="font-normal text-theme-tertiary">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the team's purpose and responsibilities..."
              rows={4}
              className="input-theme w-full px-3 py-3 rounded-lg resize-none"
              disabled={isCreating}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'review',
      title: isEditMode ? 'Review Changes' : 'Review & Create',
      subtitle: isEditMode ? 'Review your changes before updating' : 'Review your team details before creating',
      isValid: true,
      content: (
        <div className="space-y-6">
          <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--elevation-2)' }}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-primary-glow)' }}>
                <Users className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-theme-primary mb-1">{name || 'Untitled Team'}</h4>
                {description && (
                  <p className="text-sm text-theme-secondary">{description}</p>
                )}
                {!description && (
                  <p className="text-sm text-theme-tertiary italic">No description provided</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-4 rounded-lg" style={{ backgroundColor: 'var(--status-success-bg)' }}>
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--status-success)' }} />
            <p className="text-sm" style={{ color: 'var(--status-success)' }}>
              {isEditMode 
                ? 'Ready to update your team. Click "Complete" to finish.'
                : 'Ready to create your team. Click "Complete" to finish.'}
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <MultiStepSlider
      isOpen={isOpen}
      onClose={handleClose}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onComplete={handleComplete}
      title={isEditMode ? 'Edit Team' : 'Create Team'}
      width="w-[500px]"
    />
  );
};
