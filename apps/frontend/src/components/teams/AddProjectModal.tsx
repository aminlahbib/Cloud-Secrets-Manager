import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';
import { EmptyState } from '../ui/EmptyState';
import { useNotifications } from '../../contexts/NotificationContext';
import { teamsService } from '../../services/teams';
import { projectsService } from '../../services/projects';
import { Folder, Search } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

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

  const handleClose = () => {
    if (!isAdding) {
      setSelectedProjectId(null);
      setSearchTerm('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Project to Team" size="lg">
      <div className="space-y-4">
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
                ? 'Try a different search term'
                : 'All your projects are already in this team'
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
      </div>
    </Modal>
  );
};

