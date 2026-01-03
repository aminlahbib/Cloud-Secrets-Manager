import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Shield, Users, Folder } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useI18n } from '../../contexts/I18nContext';
import type { Team, TeamRole } from '../../types';

const ROLE_ICONS: Record<TeamRole, React.ReactNode> = {
  TEAM_OWNER: <Crown className="h-3 w-3" />,
  TEAM_ADMIN: <Shield className="h-3 w-3" />,
  TEAM_MEMBER: null,
};

interface TeamHeaderProps {
  team: Team;
  activeTab?: string;
  canManageTeam?: boolean;
  onTabChange?: (tab: string) => void;
}

// Generate theme-aware gradient style for team avatars
const getTeamGradientStyle = (teamName: string): React.CSSProperties => {
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const direction = 135 + (Math.abs(hash) % 60) - 30;
  return {
    background: `linear-gradient(${direction}deg, var(--elevation-2), var(--elevation-1))`,
  };
};

export const TeamHeader: React.FC<TeamHeaderProps> = React.memo(({
  team,
}) => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUserRole = team.currentUserRole;

  const handleBack = useCallback(() => {
    navigate('/teams');
  }, [navigate]);

  const teamInitials = team.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const teamGradientStyle = getTeamGradientStyle(team.name);

  return (
    <div>
      <Button variant="ghost" onClick={handleBack} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('teamDetail.backToTeams')}
      </Button>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div 
              className="w-16 h-16 rounded-full border flex items-center justify-center font-bold text-xl flex-shrink-0"
              style={{ 
                ...teamGradientStyle,
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              {teamInitials}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-h1 font-bold text-theme-primary">{team.name}</h1>
                {currentUserRole && (
                  <Badge
                    variant={
                      currentUserRole === 'TEAM_OWNER' || currentUserRole === 'TEAM_ADMIN'
                        ? 'owner-admin'
                        : 'default'
                    }
                  >
                    {ROLE_ICONS[currentUserRole as TeamRole] && (
                      <span className="mr-1">{ROLE_ICONS[currentUserRole as TeamRole]}</span>
                    )}
                    {t(`teamDetail.role.${currentUserRole}`)}
                  </Badge>
                )}
              </div>
              {team.description && (
                <p className="mt-1 text-body-sm text-theme-secondary">{team.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-body-sm">
                  <Users className="h-3.5 w-3.5" style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-theme-secondary font-medium">
                    {team.memberCount || 0} {team.memberCount === 1 ? t('teamDetail.member') : t('teamDetail.memberPlural')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-body-sm">
                  <Folder className="h-3.5 w-3.5" style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-theme-secondary font-medium">
                    {team.projectCount || 0} {team.projectCount === 1 ? t('teamDetail.project') : t('teamDetail.projectPlural')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

TeamHeader.displayName = 'TeamHeader';

