import React from 'react';
import { Link } from 'react-router-dom';
import { Folder, Plus } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import type { Workflow } from '../../types';

interface WorkflowsListProps {
  workflows: Workflow[] | undefined;
  isLoading: boolean;
}

export const WorkflowsList: React.FC<WorkflowsListProps> = ({
  workflows,
  isLoading,
}) => {
  return (
    <div className="card h-full flex flex-col">
      <div className="padding-card border-b border-theme-subtle flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-h3 font-semibold text-theme-primary">Workflows</h2>
          <Link
            to="/workflows/new"
            className="text-body-sm font-medium flex items-center gap-1 transition-all duration-200 hover:gap-2 text-accent-primary hover:text-accent-primary-hover"
          >
            New <Plus className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="padding-card flex justify-center items-center min-h-[150px]">
            <Spinner size="sm" />
          </div>
        ) : !workflows || workflows.length === 0 ? (
          <div className="padding-card text-center text-theme-tertiary text-body-sm py-8">
            No workflows yet
          </div>
        ) : (
          <div className="divide-y divide-theme-subtle">
            {workflows.map((workflow: Workflow) => (
              <Link
                key={workflow.id}
                to={`/workflows/${workflow.id}`}
                className="block p-4 transition-all duration-200 hover:bg-elevation-2 active:bg-elevation-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg transition-all duration-200 bg-elevation-1 group-hover:bg-accent-primary-glow">
                    <Folder className="h-4 w-4 text-theme-tertiary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-theme-primary truncate">
                      {workflow.name}
                      {workflow.isDefault && (
                        <span className="ml-2 text-caption text-theme-tertiary">(Default)</span>
                      )}
                    </p>
                    <p className="text-caption text-theme-tertiary mt-0.5">
                      {workflow.projects?.length || 0} projects
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

