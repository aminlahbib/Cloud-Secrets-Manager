import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';
import { EmptyState } from '../ui/EmptyState';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkflows } from '../../hooks/useWorkflows';
import { useCreateProject } from '../../hooks/useProjects';
import { teamsService } from '../../services/teams';
import { projectsService } from '../../services/projects';
import { Folder, Search, Plus, LayoutGrid, FileText } from 'lucide-react';
import type { Project } from '../../types';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  onSuccess: () => void;
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({
  isOpen,
  onClose,
  teamId,
  onSuccess,
}) => {
  const { showNotification } = useNotifications();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Create project form state
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [workflowId, setWorkflowId] = useState<string>('');
  
  // Fetch workflows for project creation
  const { data: workflows } = useWorkflows(user?.id);
  const createProjectMutation = useCreateProject();

  // Fetch user's accessible projects
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects', 'accessible'],
    queryFn: () => projectsService.listProjects({ size: 1000 }),
  });

  // Fetch team projects to exclude already added ones
  const { data: teamProjects } = useQuery({
    queryKey: ['teams', teamId, 'projects'],
    queryFn: () => teamsService.listTeamProjects(teamId),
    enabled: isOpen && !!teamId,
  });

  const projects = projectsData?.content || [];
  const teamProjectIds = new Set(teamProjects?.map(tp => tp.projectId) || []);

  // Filter projects: exclude already added and filter by search
  const availableProjects = projects.filter((project: Project) => {
    if (teamProjectIds.has(project.id)) return false;
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      project.name.toLowerCase().includes(search) ||
      project.description?.toLowerCase().includes(search)
    );
  });

  const handleAddProject = async () => {
    if (!selectedProjectId) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a project',
      });
      return;
    }

    setIsAdding(true);
    try {
      await teamsService.addProjectToTeam(teamId, selectedProjectId);
      
      // Invalidate queries to refresh data (use exact: false to catch all variations)
      queryClient.invalidateQueries({ queryKey: ['projects'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'projects'] });
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'], exact: false });
      
      showNotification({
        type: 'success',
        title: 'Project added',
        message: 'The project has been added to the team',
      });
      setSelectedProjectId(null);
      setSearchTerm('');
      onSuccess();
      onClose();
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Failed to add project',
        message: error?.response?.data?.message || error?.message || 'An error occurred',
      });
    } finally {
      setIsAdding(false);
    }
  };

  // Reset form when modal opens or mode changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'create') {
        setProjectName('');
        setProjectDescription('');
        if (workflows && workflows.length > 0) {
          const defaultWorkflow = workflows.find(w => w.isDefault) || workflows[0];
          setWorkflowId(defaultWorkflow.id);
        } else {
          setWorkflowId('');
        }
      } else {
        setSelectedProjectId(null);
        setSearchTerm('');
      }
    }
  }, [isOpen, mode, workflows]);

  const handleCreateAndAddProject = async () => {
    if (!projectName.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter a project name',
      });
      return;
    }

    if (!workflowId) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a workflow',
      });
      return;
    }

    setIsAdding(true);
    try {
      // Create the project
      const newProject = await createProjectMutation.mutateAsync({
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
        workflowId: workflowId,
      });

      // Add the project to the team
      await teamsService.addProjectToTeam(teamId, newProject.id);
      
      // Invalidate queries to refresh data (use exact: false to catch all variations)
      queryClient.invalidateQueries({ queryKey: ['projects'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'projects'] });
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'], exact: false });
      
      showNotification({
        type: 'success',
        title: 'Project created and added',
        message: 'The project has been created and added to the team',
      });
      
      // Reset form
      setProjectName('');
      setProjectDescription('');
      setMode('select');
      onSuccess();
      onClose();
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Failed to create project',
        message: error?.response?.data?.message || error?.message || 'An error occurred',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    if (!isAdding && !createProjectMutation.isPending) {
      setSelectedProjectId(null);
      setSearchTerm('');
      setProjectName('');
      setProjectDescription('');
      setMode('select');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Project to Team" size="lg">
      <div className="space-y-4">
        {/* Mode Toggle */}
        <div className="flex gap-2 p-1 border rounded-lg" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            type="button"
            onClick={() => setMode('select')}
            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
              mode === 'select'
                ? 'bg-elevation-1'
                : 'hover:bg-elevation-1'
            }`}
            style={{
              color: mode === 'select' ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
            disabled={isAdding || createProjectMutation.isPending}
          >
            Select Existing
          </button>
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
              mode === 'create'
                ? 'bg-elevation-1'
                : 'hover:bg-elevation-1'
            }`}
            style={{
              color: mode === 'create' ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
            disabled={isAdding || createProjectMutation.isPending}
          >
            Create New
          </button>
        </div>

        {mode === 'select' ? (
          <>
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-theme-tertiary" />
              </div>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects..."
                className="pl-10"
                disabled={isAdding}
              />
            </div>

            {/* Projects List */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : availableProjects.length === 0 ? (
              <EmptyState
                icon={<Folder className="h-12 w-12 text-theme-tertiary" />}
                title={searchTerm ? 'No projects found' : 'No available projects'}
                description={
                  searchTerm
                    ? 'Try a different search term or create a new project'
                    : 'All your projects are already in this team. Create a new one instead.'
                }
              />
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {availableProjects.map((project: Project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedProjectId === project.id
                        ? 'border-accent-primary bg-elevation-1'
                        : 'border-theme-subtle hover:bg-elevation-1'
                    }`}
                    disabled={isAdding}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-elevation-1">
                        <Folder className="h-4 w-4 text-theme-tertiary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium transition-colors duration-300" style={{ color: 'var(--tab-text)' }}>
                          {project.name}
                        </p>
                        {project.description && (
                          <p className="text-xs transition-colors duration-300" style={{ color: 'var(--tab-text-muted)' }}>
                            {project.description}
                          </p>
                        )}
                      </div>
                      {selectedProjectId === project.id && (
                        <div className="w-5 h-5 rounded-full border-2 border-accent-primary bg-accent-primary flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-theme-subtle">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isAdding}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleAddProject}
                isLoading={isAdding}
                disabled={!selectedProjectId}
              >
                Add Project
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Create Project Form */}
            <div className="space-y-4">
              {/* Project Name */}
              <div>
                <Input
                  label="Project Name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Backend Services"
                  required
                  autoFocus
                  disabled={isAdding || createProjectMutation.isPending}
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
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Briefly describe the purpose of this project..."
                    rows={3}
                    disabled={isAdding || createProjectMutation.isPending}
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
                    disabled={!workflows || workflows.length === 0 || isAdding || createProjectMutation.isPending}
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

            <div className="flex justify-end gap-3 pt-4 border-t border-theme-subtle">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isAdding || createProjectMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleCreateAndAddProject}
                isLoading={isAdding || createProjectMutation.isPending}
                disabled={!projectName.trim() || !workflowId}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create & Add to Team
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

