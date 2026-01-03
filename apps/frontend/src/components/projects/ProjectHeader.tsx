import React, { useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, UserPlus, Download, Upload, Crown, Shield, Building2, LayoutGrid } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProjectSourceIndicator } from './ProjectSourceIndicator';
import type { Project, ProjectRole } from '../../types';

const ROLE_COLORS: Record<ProjectRole, 'owner-admin' | 'owner-admin' | 'info' | 'default'> = {
  OWNER: 'owner-admin',
  ADMIN: 'owner-admin',
  MEMBER: 'info',
  VIEWER: 'default',
};

const ROLE_ICONS: Record<ProjectRole, React.ReactNode> = {
  OWNER: <Crown className="h-3 w-3" />,
  ADMIN: <Shield className="h-3 w-3" />,
  MEMBER: null,
  VIEWER: null,
};

interface ProjectHeaderProps {
  project: Project;
  activeTab: string;
  canManageSecrets: boolean;
  canManageMembers: boolean;
  onExportSecrets: () => void;
  onImportSecrets: () => void;
  onAddSecret: () => void;
  onInviteMember: () => void;
  onTabChange?: (tab: string) => void;
  secretsCount: number;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = React.memo(({
  project,
  activeTab,
  canManageSecrets,
  canManageMembers,
  onExportSecrets,
  onImportSecrets,
  onAddSecret,
  onInviteMember,
  onTabChange: _onTabChange,
  secretsCount,
}) => {
  const navigate = useNavigate();
  const currentUserRole = project.currentUserRole;

  const handleBack = useCallback(() => {
    navigate('/projects');
  }, [navigate]);

  return (
    <div>
      <Button variant="ghost" onClick={handleBack} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Projects
      </Button>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-h1 font-bold text-theme-primary">{project.name}</h1>
              {currentUserRole && (
                <Badge variant={ROLE_COLORS[currentUserRole]}>
                  {ROLE_ICONS[currentUserRole] && (
                    <span className="mr-1">{ROLE_ICONS[currentUserRole]}</span>
                  )}
                  {currentUserRole}
                </Badge>
              )}
              {project.isArchived && <Badge variant="warning">Archived</Badge>}
            </div>
            {project.description && (
              <p className="mt-1 text-body-sm text-theme-secondary">{project.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {project.workflowName && (
                <div className="flex items-center gap-1.5 text-body-sm">
                  <LayoutGrid className="h-3.5 w-3.5" style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-theme-secondary font-medium">{project.workflowName}</span>
                </div>
              )}
              {project.teams && project.teams.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {project.teams.map((team) => (
                    <Link
                      key={team.teamId}
                      to={`/teams`}
                      className="flex items-center gap-1.5 text-body-sm transition-colors hover:opacity-80"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      <span className="font-medium">{team.teamName}</span>
                    </Link>
                  ))}
                </div>
              )}
              <ProjectSourceIndicator project={project} />
            </div>
          </div>

          <div className="flex gap-2">
            {activeTab === 'secrets' && canManageSecrets && (
              <>
                <Button
                  variant="secondary"
                  onClick={onExportSecrets}
                  disabled={secretsCount === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="secondary" onClick={onImportSecrets}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button onClick={onAddSecret}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Secret
                </Button>
              </>
            )}

            {activeTab === 'members' && canManageMembers && (
              <Button onClick={onInviteMember}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ProjectHeader.displayName = 'ProjectHeader';

