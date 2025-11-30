import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, LayoutGrid, FileText, CheckCircle2 } from 'lucide-react';
import { useCreateProject } from '../../hooks/useProjects';
import { useWorkflows } from '../../hooks/useWorkflows';
import { useAuth } from '../../contexts/AuthContext';
import { MultiStepSlider, type Step } from '../ui/MultiStepSlider';
import { Input } from '../ui/Input';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialWorkflowId?: string;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
    isOpen,
    onClose,
    initialWorkflowId,
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [currentStep, setCurrentStep] = useState(0);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [workflowId, setWorkflowId] = useState<string>('');

    // Fetch workflows for the dropdown
    const { data: workflows } = useWorkflows(user?.id);

    // Create project mutation
    const createMutation = useCreateProject();

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
            setName('');
            setDescription('');
            // Default to initialWorkflowId if provided, otherwise default to default workflow
            if (initialWorkflowId) {
                setWorkflowId(initialWorkflowId);
            } else if (workflows && workflows.length > 0) {
                const defaultWorkflow = workflows.find(w => w.isDefault) || workflows[0];
                setWorkflowId(defaultWorkflow.id);
            } else {
                setWorkflowId('');
            }
        }
    }, [isOpen, initialWorkflowId, workflows]);

    const handleComplete = () => {
        if (!name.trim()) return;

        createMutation.mutate(
            {
                name,
                description: description || undefined,
                workflowId: workflowId,
            },
            {
                onSuccess: (project) => {
                    onClose();
                    navigate(`/projects/${project.id}`);
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
            title: 'Project Details',
            subtitle: 'Tell us about your project',
            isValid: !!name.trim(),
            content: (
                <div className="space-y-6">
                    <div>
                        <Input
                            label="Project Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Backend Services"
                            required
                            autoFocus
                            icon={<Folder className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />}
                        />
                        <p className="mt-2 text-sm text-theme-secondary">
                            Choose a unique and descriptive name for your project.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-theme-primary">
                            Description <span className="font-normal text-theme-tertiary">(optional)</span>
                        </label>
                        <div className="relative">
                            <div className="absolute top-3 left-3 pointer-events-none">
                                <FileText className="h-4 w-4 text-theme-tertiary" />
                            </div>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Briefly describe the purpose of this project..."
                                rows={4}
                                className="input-theme w-full pl-10 pr-4 py-3 rounded-lg resize-none"
                            />
                        </div>
                    </div>
                </div>
            ),
        },
        {
            id: 'workflow',
            title: 'Select Workflow',
            subtitle: 'Choose which workflow to assign this project to',
            isValid: !!workflowId,
            content: (
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-theme-primary">
                            Workflow
                        </label>
                        <div className="relative">
                            <div className="absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none">
                                <LayoutGrid className="h-4 w-4 text-theme-tertiary" />
                            </div>
                            <select
                                value={workflowId}
                                onChange={(e) => setWorkflowId(e.target.value)}
                                className="input-theme w-full pl-10 pr-4 py-3 rounded-lg appearance-none"
                                required
                                disabled={!workflows || workflows.length === 0}
                            >
                                {!workflows || workflows.length === 0 ? (
                                    <option value="">Loading workflows...</option>
                                ) : (
                                    workflows.map((w) => (
                                        <option key={w.id} value={w.id}>
                                            {w.name} {w.isDefault && '(Default)'}
                                        </option>
                                    ))
                                )}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                                <svg className="w-4 h-4 text-theme-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                        <p className="mt-2 text-sm text-theme-secondary">
                            Projects are automatically assigned to a workflow. Select which workflow to use.
                        </p>
                    </div>

                    {workflows && workflows.length > 0 && (
                        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--elevation-2)' }}>
                            <h4 className="text-sm font-medium text-theme-primary mb-2">Selected Workflow</h4>
                            <p className="text-sm text-theme-secondary">
                                {workflows.find(w => w.id === workflowId)?.name || 'None selected'}
                            </p>
                        </div>
                    )}
                </div>
            ),
        },
        {
            id: 'review',
            title: 'Review & Create',
            subtitle: 'Review your project details before creating',
            isValid: true,
            content: (
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--elevation-2)' }}>
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-primary-glow)' }}>
                                    <Folder className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-theme-primary mb-1">{name || 'Untitled Project'}</h4>
                                    {description && (
                                        <p className="text-sm text-theme-secondary">{description}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--elevation-2)' }}>
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--accent-primary-glow)' }}>
                                    <LayoutGrid className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-medium text-theme-primary mb-1">Workflow</h4>
                                    <p className="text-sm text-theme-secondary">
                                        {workflows?.find(w => w.id === workflowId)?.name || 'None selected'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-4 rounded-lg" style={{ backgroundColor: 'var(--status-success-bg)' }}>
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--status-success)' }} />
                        <p className="text-sm" style={{ color: 'var(--status-success)' }}>
                            Ready to create your project. Click "Complete" to finish.
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
            title="Create Project"
            width="w-[500px]"
        />
    );
};
