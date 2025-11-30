import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLogo } from './SidebarLogo';
import { SidebarNav } from './SidebarNav';
import { WorkflowSelector } from './WorkflowSelector';
import { Key, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';
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
  const navigate = useNavigate();

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 w-64 flex flex-col padding-sidebar transition-all duration-200 md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        borderRightColor: 'var(--sidebar-border)',
        borderRightWidth: '1px',
        borderRightStyle: 'solid',
      }}
    >
      {/* Logo */}
      <div className="mb-8">
        <SidebarLogo />
      </div>

      {/* Workspace Selector - First */}
      <div className="mb-8">
        <WorkflowSelector
          workflows={workflows}
          selectedWorkflowId={selectedWorkflowId}
          onSelectWorkflow={onSelectWorkflow}
        />
      </div>

      {/* Navigation */}
      <div className="flex-1">
        <SidebarNav onNavigate={onNavigate} isPlatformAdmin={isPlatformAdmin} />
      </div>

      {/* Bottom Actions */}
      <div className="mt-auto pt-6 space-y-3 border-t border-theme-subtle">
        <Button
          onClick={() => {
            navigate('/projects');
            onNavigate?.();
          }}
          className="w-full"
          variant="primary"
        >
          <Key className="h-4 w-4 mr-2" />
          New Secret
        </Button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-theme-secondary hover:text-theme-primary transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

