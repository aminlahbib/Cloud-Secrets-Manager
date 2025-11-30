import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, CheckCircle2 } from 'lucide-react';
import { useCreateWorkflow } from '../../hooks/useWorkflows';
import { MultiStepSlider, type Step } from '../ui/MultiStepSlider';
import { Input } from '../ui/Input';

interface CreateWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateWorkflowModal: React.FC<CreateWorkflowModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const createMutation = useCreateWorkflow();

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setName('');
      setDescription('');
    }
  }, [isOpen]);

  const handleComplete = () => {
    if (!name.trim()) return;

    createMutation.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
      },
      {
        onSuccess: (workflow) => {
          onClose();
          onSuccess?.();
          navigate(`/workflows/${workflow.id}`);
        },
      }
    );
  };

  const handleClose = () => {
    setCurrentStep(0);
    setName('');
    setDescription('');
    onClose();
  };

  const steps: Step[] = [
    {
      id: 'basic-info',
      title: 'Workflow Details',
      subtitle: 'Tell us about your workflow',
      isValid: !!name.trim(),
      content: (
        <div className="space-y-6">
          <div>
            <Input
              label="Workflow Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Personal, Work, Side Projects"
              required
              autoFocus
              icon={<LayoutGrid className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />}
            />
            <p className="mt-2 text-sm text-theme-secondary">
              Choose a name that helps you organize your projects.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-theme-primary">
              Description <span className="font-normal text-theme-tertiary">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this workflow is for..."
              rows={4}
              className="input-theme w-full px-3 py-3 rounded-lg resize-none"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'review',
      title: 'Review & Create',
      subtitle: 'Review your workflow details before creating',
      isValid: true,
      content: (
        <div className="space-y-6">
          <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--elevation-2)' }}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-primary-glow)' }}>
                <LayoutGrid className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-theme-primary mb-1">{name || 'Untitled Workflow'}</h4>
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
              Ready to create your workflow. Click "Complete" to finish.
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
      title="Create Workflow"
      width="w-[500px]"
    />
  );
};

