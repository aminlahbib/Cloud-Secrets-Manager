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
            setWorkflowId(initialWorkflowId || '');
        }
    }, [isOpen, initialWorkflowId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        createMutation.mutate(
            {
                name,
                description: description || undefined,
                workflowId: workflowId || undefined,
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
                            icon={<Folder className="h-4 w-4 text-gray-400" />}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Choose a unique and descriptive name for your project.
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <div className="relative">
                            <div className="absolute top-3 left-3 pointer-events-none">
                                <FileText className="h-4 w-4 text-gray-400" />
                            </div>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Briefly describe the purpose of this project..."
                                rows={3}
                                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 bg-white resize-none"
                            />
                        </div>
                    </div>

                    {/* Workflow Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Workflow <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <div className="relative">
                            <div className="absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none">
                                <LayoutGrid className="h-4 w-4 text-gray-400" />
                            </div>
                            <select
                                value={workflowId}
                                onChange={(e) => setWorkflowId(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 bg-white appearance-none"
                            >
                                <option value="">No Workflow (Unassigned)</option>
                                {workflows?.map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name} {w.isDefault && '(Default)'}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            Organize this project by assigning it to a workflow.
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
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
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">
                            Failed to create project. Please try again.
                        </p>
                    </div>
                )}
            </form>
        </Modal>
    );
};
