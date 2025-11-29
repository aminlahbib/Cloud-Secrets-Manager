import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, UserPlus, Download, Upload } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { Project, ProjectRole } from '../../types';

const ROLE_COLORS: Record<ProjectRole, 'owner-admin' | 'owner-admin' | 'info' | 'default'> = {
  OWNER: 'owner-admin',
  ADMIN: 'owner-admin',
  MEMBER: 'info',
  VIEWER: 'default',
};

const ROLE_ICONS: Record<ProjectRole, React.ReactNode> = {
  OWNER: <span className="text-xs">👑</span>,
  ADMIN: <span className="text-xs">🛡️</span>,
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
  secretsCount,
}) => {
  const navigate = useNavigate();
  const currentUserRole = project.currentUserRole;

  const handleBack = useCallback(() => {
    navigate('/projects');
  }, [navigate]);

  return (
    <div>
      <Button variant="ghost" onClick={handleBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Projects
      </Button>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-h1 font-bold text-theme-primary">{project.name}</h1>
              {currentUserRole && (
                <Badge variant={ROLE_COLORS[currentUserRole]}>
                  {ROLE_ICONS[currentUserRole]}
                  {currentUserRole}
                </Badge>
              )}
              {project.isArchived && <Badge variant="warning">Archived</Badge>}
            </div>
            {project.description && (
              <p className="mt-1 text-body-sm text-theme-secondary">{project.description}</p>
            )}
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
        <div className="rounded-3xl border border-theme-subtle px-6 py-4 text-body-sm bg-elevation-1 text-theme-secondary">
          <p>
            Need help?{' '}
            <button className="underline" type="button" onClick={() => {/* This will be handled by parent via onTabChange */}}>
              View project activity
            </button>{' '}
            or visit{' '}
            <button className="underline" type="button" onClick={() => {/* This will be handled by parent via onTabChange */}}>
              project settings
            </button>{' '}
            for more tools.
          </p>
        </div>
      </div>
    </div>
  );
});

ProjectHeader.displayName = 'ProjectHeader';

