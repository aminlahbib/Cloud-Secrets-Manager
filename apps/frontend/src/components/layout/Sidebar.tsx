import React, { useState } from 'react';
import { Key, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { SidebarLogo } from './SidebarLogo';
import { SidebarNav } from './SidebarNav';
import { WorkflowSelector } from './WorkflowSelector';
import { Button } from '../ui/Button';
import { useI18n } from '../../contexts/I18nContext';
import { CreateSecretModal } from '../secrets/CreateSecretModal';
import type { Workflow } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
  workflows: Workflow[] | undefined;
  selectedWorkflowId: string | null;
  onSelectWorkflow: (workflowId: string) => void;
  isPlatformAdmin?: boolean;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isCollapsed = false,
  onNavigate,
  onToggleCollapse,
  workflows,
  selectedWorkflowId,
  onSelectWorkflow,
  isPlatformAdmin = false,
  onLogout,
}) => {
  const { t } = useI18n();
  const [showCreateSecretModal, setShowCreateSecretModal] = useState(false);

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 flex flex-col padding-sidebar transition-all duration-200 md:translate-x-0 sidebar-glass
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Collapse Toggle Button */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-20 z-50 p-1.5 rounded-full bg-card border border-theme-subtle shadow-md hover:bg-elevation-2 transition-colors hidden md:flex items-center justify-center"
          style={{ color: 'var(--text-secondary)' }}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      )}

      {/* Logo */}
      <div className={`mb-8 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <SidebarLogo isCollapsed={isCollapsed} />
      </div>

      {/* Workspace Selector - First */}
      <div className="mb-8">
        <WorkflowSelector
          workflows={workflows}
          selectedWorkflowId={selectedWorkflowId}
          onSelectWorkflow={onSelectWorkflow}
          isCollapsed={isCollapsed}
        />
      </div>

      {/* Navigation */}
      <div className="flex-1">
        <SidebarNav 
          onNavigate={onNavigate} 
          isPlatformAdmin={isPlatformAdmin}
          isCollapsed={isCollapsed}
        />
      </div>

      {/* Bottom Actions */}
      <div className={`mt-auto pt-6 space-y-3 border-t border-theme-subtle ${isCollapsed ? 'flex flex-col items-center space-y-2' : ''}`}>
        <Button
          onClick={() => {
            setShowCreateSecretModal(true);
            onNavigate?.();
          }}
          className={isCollapsed ? 'w-auto px-3 py-3' : 'w-full'}
          variant="primary"
          title={isCollapsed ? t('nav.newSecret') : undefined}
        >
          <Key className={isCollapsed ? 'h-6 w-6' : 'h-4 w-4'} />
          {!isCollapsed && <span className="ml-2">{t('nav.newSecret')}</span>}
        </Button>
        <button
          onClick={onLogout}
          className={`
            flex items-center gap-2 px-3 py-2 text-sm text-theme-secondary hover:text-theme-primary transition-all duration-200
            ${isCollapsed ? 'w-auto justify-center p-3 rounded-lg hover:bg-elevation-1' : 'w-full'}
          `}
          title={isCollapsed ? t('nav.signOut') : undefined}
        >
          <LogOut className={isCollapsed ? 'h-6 w-6' : 'h-4 w-4'} />
          {!isCollapsed && <span>{t('nav.signOut')}</span>}
        </button>
      </div>

      {/* Create Secret Modal */}
      <CreateSecretModal
        isOpen={showCreateSecretModal}
        onClose={() => setShowCreateSecretModal(false)}
      />
    </aside>
  );
};

