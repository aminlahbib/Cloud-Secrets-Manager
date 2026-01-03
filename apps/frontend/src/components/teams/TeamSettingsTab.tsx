import React, { useState } from 'react';
import { FileText, Settings, Users, AlertTriangle } from 'lucide-react';
import { SettingsLayout, type SettingsSection } from '../shared/SettingsLayout';
import { TeamOverviewSection } from './settings/TeamOverviewSection';
import { TeamGeneralSettingsSection } from './settings/TeamGeneralSettingsSection';
import { TeamMembersSection } from './settings/TeamMembersSection';
import { TeamAdvancedSection } from './settings/TeamAdvancedSection';
import type { Team, TeamMember, TeamRole } from '../../types';

interface TeamSettingsTabProps {
  team: Team;
  members?: TeamMember[];
  memberCount?: number;
  projectCount?: number;
  canManageTeam: boolean;
  canDeleteTeam: boolean;
  onAddMember?: () => void;
  onRoleChange?: (memberId: string, newRole: TeamRole) => void;
  onRemoveMember?: (memberId: string) => void;
  onEditTeam?: () => void;
  onDeleteTeam?: () => void;
  roleChangeTarget?: string | null;
  isUpdatingRole?: boolean;
}

export const TeamSettingsTab: React.FC<TeamSettingsTabProps> = ({
  team,
  members,
  memberCount,
  projectCount,
  canManageTeam,
  canDeleteTeam,
  onAddMember,
  onRoleChange,
  onRemoveMember,
  onEditTeam,
  onDeleteTeam,
  roleChangeTarget,
  isUpdatingRole,
}) => {
  const [activeSection, setActiveSection] = useState<string>('overview');

  const sections: SettingsSection[] = [
    {
      id: 'overview',
      title: 'Team Overview',
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: 'general',
      title: 'General Settings',
      icon: <Settings className="h-4 w-4" />,
    },
    {
      id: 'members',
      title: 'Members & Invitations',
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: 'advanced',
      title: 'Advanced',
      icon: <AlertTriangle className="h-4 w-4" />,
    },
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <TeamOverviewSection
            team={team}
            memberCount={memberCount}
            projectCount={projectCount}
          />
        );
      case 'general':
        return (
          <TeamGeneralSettingsSection
            team={team}
          />
        );
      case 'members':
        return (
          <TeamMembersSection
            team={team}
            members={members}
            canManageTeam={canManageTeam}
            onAddMember={onAddMember}
            onRoleChange={onRoleChange}
            onRemoveMember={onRemoveMember}
            roleChangeTarget={roleChangeTarget}
            isUpdatingRole={isUpdatingRole}
          />
        );
      case 'advanced':
        return (
          <TeamAdvancedSection
            canDeleteTeam={canDeleteTeam}
            onEditTeam={onEditTeam || (() => {})}
            onDeleteTeam={onDeleteTeam || (() => {})}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="tab-content-container">
      <SettingsLayout
        sections={sections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      >
        {renderSectionContent()}
      </SettingsLayout>
    </div>
  );
};

