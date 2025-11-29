import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, LayoutGrid, FileText } from 'lucide-react';
import { useCreateProject } from '../../hooks/useProjects';
import { useWorkflows } from '../../hooks/useWorkflows';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        createMutation.mutate(
            {
                name,
                description: description || undefined,
                workflowId: workflowId, // Always send workflowId (will default to default workflow on backend if not provided, but we always have one selected)
            },
            {
                onSuccess: (project) => {
                    onClose();
                    navigate(`/projects/${project.id}`);
                },
            }
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Project"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    {/* Project Name */}
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
                        <p className="mt-1 text-xs transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
                            Choose a unique and descriptive name for your project.
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>
                            Description <span className="font-normal transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>(optional)</span>
                        </label>
                        <div className="relative">
                            <div className="absolute top-3 left-3 pointer-events-none">
                                <FileText className="h-4 w-4 transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }} />
                            </div>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Briefly describe the purpose of this project..."
                                rows={3}
                                className="input-theme w-full pl-10 pr-4 py-2 rounded-lg resize-none"
                            />
                        </div>
                    </div>

                    {/* Workflow Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2 transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>
                            Workflow
                        </label>
                        <div className="relative">
                            <div className="absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none">
                                <LayoutGrid className="h-4 w-4 transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }} />
                            </div>
                            <select
                                value={workflowId}
                                onChange={(e) => setWorkflowId(e.target.value)}
                                className="input-theme w-full pl-10 pr-4 py-2 rounded-lg appearance-none"
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
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                <svg className="w-4 h-4 transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                        <p className="mt-1 text-xs transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
                            Projects are automatically assigned to a workflow. Select which workflow to use.
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t transition-colors duration-300" style={{ borderColor: 'var(--tab-border)' }}>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        isLoading={createMutation.isPending}
                        disabled={!name.trim()}
                    >
                        Create Project
                    </Button>
                </div>

                {createMutation.isError && (
                    <div 
                        className="p-3 border rounded-lg transition-colors duration-300"
                        style={{
                            backgroundColor: 'var(--status-danger-bg)',
                            borderColor: 'var(--status-danger)',
                        }}
                    >
                        <p className="text-body-sm" style={{ color: 'var(--status-danger)' }}>
                            Failed to create project. Please try again.
                        </p>
                    </div>
                )}
            </form>
        </Modal>
    );
};
