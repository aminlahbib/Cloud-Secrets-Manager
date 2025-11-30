import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Workflow } from '../../types';

interface WorkflowSelectorProps {
  workflows: Workflow[] | undefined;
  selectedWorkflowId: string | null;
  onSelectWorkflow: (workflowId: string) => void;
}

export const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({
  workflows,
  selectedWorkflowId,
  onSelectWorkflow,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedWorkflow = workflows?.find((wf) => wf.id === selectedWorkflowId);

  const handleWorkflowSelect = (workflowId: string) => {
    onSelectWorkflow(workflowId);
    setIsOpen(false);
  };

  return (
    <div ref={selectorRef}>
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide px-1 mb-3" style={{ color: 'var(--text-tertiary)' }}>
        <span>Workspace</span>
        <button
          onClick={() => navigate('/workflows/new')}
          className="text-xs font-medium flex items-center gap-1 transition-all duration-150 hover:opacity-80"
          style={{ color: 'var(--accent-primary)' }}
        >
          <Plus className="h-3 w-3" />
          New
        </button>
      </div>

      {workflows && workflows.length > 0 ? (
        <div>
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-200 flex items-center justify-between hover:bg-elevation-1"
            style={{
              borderColor: isOpen ? 'var(--accent-primary)' : 'var(--border-subtle)',
              backgroundColor: isOpen ? 'var(--elevation-1)' : 'transparent',
            }}
          >
            <div className="flex items-center gap-2.5">
              <div 
                className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-semibold text-white"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                {selectedWorkflow?.name?.substring(0, 2).toUpperCase() || 'MW'}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {selectedWorkflow?.name || 'Select workflow'}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {(selectedWorkflow?.projects?.length || 0)} Projects
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/workflows/new');
                }}
                className="p-1 rounded hover:bg-elevation-2 transition-colors"
                title="Settings"
              >
                <Settings className="h-4 w-4 text-theme-tertiary" />
              </button>
              <ChevronDown
                className="h-4 w-4 transition-transform duration-200"
                style={{ 
                  color: 'var(--text-tertiary)',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' 
                }}
              />
            </div>
          </button>

          {isOpen && (
            <div 
              className="mt-2 rounded-lg border overflow-hidden shadow-lg"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border-subtle)', 
              }}
            >
              <div className="max-h-64 overflow-y-auto">
                {workflows.map((workflow) => {
                  const isSelected = workflow.id === selectedWorkflowId;
                  return (
                    <button
                      key={workflow.id}
                      onClick={() => handleWorkflowSelect(workflow.id)}
                      className="w-full px-3 py-2.5 text-left flex items-center gap-2.5 text-sm transition-all duration-200 hover:bg-elevation-1"
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-primary-glow)' : 'transparent',
                      }}
                    >
                      <div 
                        className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                      >
                        {workflow.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{workflow.name}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                          {(workflow.projects?.length || 0)} Projects
                        </p>
                      </div>
                      {isSelected && (
                        <div 
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: 'var(--accent-primary)' }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/workflows/new');
                }}
                className="w-full px-3 py-2.5 text-sm font-medium border-t text-left flex items-center gap-2 transition-all duration-200 hover:bg-elevation-1"
                style={{ 
                  color: 'var(--accent-primary)',
                  borderTopColor: 'var(--border-subtle)',
                }}
              >
                <Plus className="h-4 w-4" />
                Create Workflow
              </button>
            </div>
          )}
        </div>
      ) : (
        <div 
          className="rounded-2xl border border-dashed p-6 text-center"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <p className="text-sm mb-3" style={{ color: 'var(--text-tertiary)' }}>No workflows yet</p>
          <Button onClick={() => navigate('/workflows/new')} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </div>
      )}
    </div>
  );
};

