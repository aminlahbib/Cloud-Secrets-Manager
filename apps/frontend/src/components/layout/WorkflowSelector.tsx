import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown } from 'lucide-react';
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
    <div className="mt-10" ref={selectorRef}>
      <div className="flex items-center justify-between text-label px-1 mb-3" style={{ color: 'var(--sidebar-section-header, var(--text-tertiary))' }}>
        <span>Workspace</span>
        <button
          onClick={() => navigate('/workflows/new')}
          className="text-xs font-medium flex items-center gap-1 transition-all duration-150 hover:scale-105"
          style={{ color: 'var(--accent-primary)' }}
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>

      {workflows && workflows.length > 0 ? (
        <div>
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="w-full text-left rounded-2xl border px-4 py-3 transition-all duration-150 flex items-center justify-between card hover:border-default"
            style={{
              borderColor: isOpen ? 'var(--border-accent)' : 'var(--border-subtle)',
              boxShadow: isOpen ? 'var(--shadow-md), var(--glow-accent)' : 'var(--shadow-sm)',
            }}
          >
            <div>
              <p className="text-body-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {selectedWorkflow?.name || 'Select workflow'}
              </p>
              <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
                {(selectedWorkflow?.projects?.length || 0)} Projects
              </p>
            </div>
            <ChevronDown
              className="h-4 w-4 transition-transform duration-150"
              style={{ 
                color: 'var(--text-tertiary)',
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' 
              }}
            />
          </button>

          {isOpen && (
            <div 
              className="mt-2 rounded-2xl border overflow-hidden" 
              style={{ 
                borderColor: 'var(--border-subtle)', 
                boxShadow: 'var(--shadow-lg)',
                backgroundColor: 'var(--elevation-2)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="max-h-64 overflow-y-auto">
                {workflows.map((workflow) => {
                  const isSelected = workflow.id === selectedWorkflowId;
                  return (
                    <button
                      key={workflow.id}
                      onClick={() => handleWorkflowSelect(workflow.id)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between text-body-sm transition-all duration-150"
                      style={{
                        backgroundColor: isSelected ? 'var(--sidebar-active-bg)' : 'transparent',
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                        borderLeft: isSelected ? '3px solid var(--accent-primary)' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'var(--sidebar-hover-bg)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }
                      }}
                    >
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{workflow.name}</p>
                        <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
                          {(workflow.projects?.length || 0)} Projects
                        </p>
                      </div>
                      {isSelected && <span className="text-lg" style={{ color: 'var(--accent-primary)' }}>•</span>}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/workflows/new');
                }}
                className="w-full px-4 py-3 text-body-sm font-medium border-t text-left flex items-center gap-2 transition-all duration-150"
                style={{ 
                  color: 'var(--accent-primary)',
                  borderTopColor: 'var(--border-subtle)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--elevation-2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
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

