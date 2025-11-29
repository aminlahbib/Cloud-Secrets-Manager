import React from 'react';
import { SidebarLogo } from './SidebarLogo';
import { SidebarNav } from './SidebarNav';
import { WorkflowSelector } from './WorkflowSelector';
import { ThemeControls } from './ThemeControls';
import { UserMenu } from './UserMenu';
import type { Workflow } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onNavigate?: () => void;
  workflows: Workflow[] | undefined;
  selectedWorkflowId: string | null;
  onSelectWorkflow: (workflowId: string) => void;
  isPlatformAdmin?: boolean;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onNavigate,
  workflows,
  selectedWorkflowId,
  onSelectWorkflow,
  isPlatformAdmin = false,
  onLogout,
}) => {
  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 w-72 flex flex-col justify-between padding-sidebar transition-all duration-200 md:translate-x-0 sidebar-glass
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      style={{
        borderRightColor: 'var(--sidebar-border)',
        borderRightWidth: '1px',
        borderRightStyle: 'solid',
      }}
    >
      <div>
        <SidebarLogo />
        <SidebarNav onNavigate={onNavigate} isPlatformAdmin={isPlatformAdmin} />
        <WorkflowSelector
          workflows={workflows}
          selectedWorkflowId={selectedWorkflowId}
          onSelectWorkflow={onSelectWorkflow}
        />
      </div>

      <div className="space-y-6">
        <div 
          className="border-t pt-6 space-y-3"
          style={{ borderTopColor: 'var(--border-subtle)' }}
        >
          <ThemeControls />
          <UserMenu onLogout={onLogout} />
        </div>
      </div>
    </aside>
  );
};

