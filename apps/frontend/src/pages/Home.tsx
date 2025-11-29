import React, { useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Folder, 
  Plus, 
  ArrowRight, 
  Key, 
  Users, 
  Activity,
  Shield,
  TrendingUp,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { projectsService } from '../services/projects';
import { workflowsService } from '../services/workflows';
import { auditService, type AuditLogsResponse } from '../services/audit';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import type { Project, AuditLog, Workflow } from '../types';

export const HomePage: React.FC = () => {
  const { user, isPlatformAdmin } = useAuth();
  const navigate = useNavigate();

  // Fetch recent projects
  const { data: projectsData, isLoading: isProjectsLoading } = useQuery({
    queryKey: ['projects', 'recent', user?.id],
    queryFn: () => projectsService.listProjects({ size: 6 }),
    enabled: !!user?.id,
  });

  // Fetch workflows
  const { data: workflows, isLoading: isWorkflowsLoading } = useQuery<Workflow[]>({
    queryKey: ['workflows', user?.id],
    queryFn: () => workflowsService.listWorkflows(),
    enabled: !!user?.id,
  });

  // Fetch recent activity (only for platform admins)
  const { data: activityData, isLoading: isActivityLoading } = useQuery<AuditLogsResponse>({
    queryKey: ['activity', 'recent'],
    queryFn: () => auditService.listAuditLogs({ size: 5 }),
    enabled: isPlatformAdmin, // Only fetch for platform admins
    retry: false,
  });

  const projectsList = projectsData?.content ?? [];
  const recentActivity = activityData?.content ?? [];

  // Enrich projects with workflow information
  const projects = useMemo(() => {
    if (!workflows || workflows.length === 0) return projectsList;

    return projectsList.map((project: Project) => {
      // Find which workflow contains this project
      for (const workflow of workflows) {
        if (workflow.projects?.some(wp => wp.projectId === project.id)) {
          return {
            ...project,
            workflowId: workflow.id,
            workflowName: workflow.name,
          };
        }
      }
      return project;
    });
  }, [projectsList, workflows]);

  const totalSecrets = projects.reduce((sum, p) => sum + (p.secretCount ?? 0), 0);
  const totalMembers = projects.reduce((sum, p) => sum + (p.memberCount ?? 0), 0);

  const getTimeAgo = useCallback((timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  }, []);

  const formatAction = useCallback((action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-neutral-400">Dashboard</p>
            <h1 className="text-3xl font-semibold mt-2 text-neutral-900">
              Welcome back, {user?.displayName || user?.email?.split('@')[0]}
            </h1>
            <p className="text-neutral-500 mt-2 max-w-2xl">
              Everything you need to organise secrets, workflows and teams now lives in one calm, focused surface.
            </p>
            {isPlatformAdmin && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600">
                <Shield className="h-3.5 w-3.5" />
                Platform administrator
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <Button onClick={() => navigate('/projects')} className="w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
            <Button variant="secondary" onClick={() => navigate('/projects')} className="w-full md:w-auto">
              Browse Projects
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Total Projects</p>
              <p className="text-3xl font-semibold text-neutral-900 mt-1">
                {isProjectsLoading ? '...' : projectsData?.totalElements ?? 0}
              </p>
            </div>
            <div className="p-3 rounded-2xl border border-neutral-200 text-neutral-500">
              <Folder className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Total Secrets</p>
              <p className="text-3xl font-semibold text-neutral-900 mt-1">
                {isProjectsLoading ? '...' : totalSecrets}
              </p>
            </div>
            <div className="p-3 rounded-2xl border border-neutral-200 text-neutral-500">
              <Key className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">Team Members</p>
              <p className="text-3xl font-semibold text-neutral-900 mt-1">
                {isProjectsLoading ? '...' : totalMembers}
              </p>
            </div>
            <div className="p-3 rounded-2xl border border-neutral-200 text-neutral-500">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        {isPlatformAdmin && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-neutral-500">Recent Activity</p>
                <p className="text-3xl font-semibold text-neutral-900 mt-1">
                {isActivityLoading ? '...' : activityData?.totalElements ?? 0}
              </p>
            </div>
              <div className="p-3 rounded-2xl border border-neutral-200 text-neutral-500">
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflows */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Workflows</h2>
              <Link
                to="/workflows/new"
                className="text-neutral-600 hover:text-neutral-900 text-sm font-medium flex items-center"
              >
                New <Plus className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {isWorkflowsLoading ? (
              <div className="p-6 flex justify-center">
                <Spinner size="sm" />
              </div>
            ) : !workflows || workflows.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                No workflows yet
              </div>
            ) : (
              workflows.map((workflow: Workflow) => (
                <Link
                  key={workflow.id}
                  to={`/workflows/${workflow.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-neutral-100 rounded">
                      <Folder className="h-4 w-4 text-neutral-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {workflow.name}
                        {workflow.isDefault && (
                          <span className="ml-2 text-xs text-neutral-500">(Default)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {workflow.projects?.length || 0} projects
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity - Only for Platform Admins */}
        {isPlatformAdmin && (
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
              <Link 
                to="/activity" 
                className="text-neutral-600 hover:text-neutral-900 text-sm font-medium flex items-center"
              >
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {isActivityLoading ? (
              <div className="p-6 flex justify-center">
                <Spinner size="sm" />
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                No recent activity
              </div>
            ) : (
              recentActivity.map((log: AuditLog) => (
                <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-gray-100 rounded">
                      <Activity className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {formatAction(log.action)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {log.resourceName || log.resourceId || 'System'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {getTimeAgo(log.createdAt || '')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        )}

        {/* Projects Overview */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Your Projects</h2>
              <Link 
                to="/projects" 
                className="text-neutral-600 hover:text-neutral-900 text-sm font-medium flex items-center"
              >
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          
          {isProjectsLoading ? (
            <div className="p-6 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center">
              <Folder className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-6">Create your first project to start managing secrets</p>
              <Button onClick={() => navigate('/projects')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
              {projects.slice(0, 4).map((project: Project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="group block p-4 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-neutral-100 rounded-xl group-hover:bg-neutral-900 group-hover:text-white transition-colors text-neutral-600">
                      <Folder className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900 truncate group-hover:text-neutral-900">
                        {project.name}
                      </h3>
                      {project.workflowName && (
                        <div className="flex items-center gap-1.5 mt-1 mb-1.5">
                          <LayoutGrid className="h-3 w-3 text-neutral-400" />
                          <span className="text-xs text-neutral-500 font-medium truncate">
                            {project.workflowName}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Key className="h-3.5 w-3.5 mr-1" />
                          {project.secretCount ?? 0}
                        </span>
                        <span className="flex items-center">
                          <Users className="h-3.5 w-3.5 mr-1" />
                          {project.memberCount ?? 1}
                        </span>
                      </div>
                    </div>
                    {project.currentUserRole && (
                      <Badge 
                        variant={
                          project.currentUserRole === 'OWNER' ? 'danger' :
                          project.currentUserRole === 'ADMIN' ? 'warning' :
                          'default'
                        }
                        className="text-xs"
                      >
                        {project.currentUserRole}
                      </Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center p-4 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left"
          >
            <div className="p-2 bg-neutral-100 rounded-xl mr-4 text-neutral-600">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-neutral-900">New Project</p>
              <p className="text-sm text-neutral-500">Create a new project</p>
            </div>
          </button>

          {isPlatformAdmin && (
          <button
            onClick={() => navigate('/activity')}
              className="flex items-center p-4 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left"
          >
              <div className="p-2 bg-neutral-100 rounded-xl mr-4 text-neutral-600">
                <Activity className="h-5 w-5" />
            </div>
            <div>
                <p className="font-medium text-neutral-900">View Activity</p>
                <p className="text-sm text-neutral-500">See recent changes</p>
            </div>
          </button>
          )}

          <button
            onClick={() => navigate('/teams')}
            className="flex items-center p-4 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left"
          >
            <div className="p-2 bg-neutral-100 rounded-xl mr-4 text-neutral-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-neutral-900">Manage Team</p>
              <p className="text-sm text-neutral-500">Invite collaborators</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="flex items-center p-4 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 transition-all text-left"
          >
            <div className="p-2 bg-neutral-100 rounded-xl mr-4 text-neutral-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-neutral-900">Settings</p>
              <p className="text-sm text-neutral-500">Configure preferences</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
