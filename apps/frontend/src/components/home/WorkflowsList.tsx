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
    <div className="lg:col-span-1 card">
      <div className="padding-card border-b border-theme-subtle">
        <div className="flex items-center justify-between">
          <h2 className="text-h3 font-semibold text-theme-primary">Workflows</h2>
          <Link
            to="/workflows/new"
            className="text-body-sm font-medium flex items-center transition-all duration-150 hover:scale-105 text-accent-primary"
          >
            New <Plus className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
      <div className="divide-y divide-theme-subtle">
        {isLoading ? (
          <div className="padding-card flex justify-center">
            <Spinner size="sm" />
          </div>
        ) : !workflows || workflows.length === 0 ? (
          <div className="padding-card text-center text-theme-tertiary text-body-sm">
            No workflows yet
          </div>
        ) : (
          workflows.map((workflow: Workflow) => (
            <Link
              key={workflow.id}
              to={`/workflows/${workflow.id}`}
              className="block p-4 transition-all duration-150 hover:bg-elevation-3"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded transition-all duration-150 bg-elevation-1">
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
          ))
        )}
      </div>
    </div>
  );
};

