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
      <div className="card rounded-3xl p-8 shadow-sm dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)] transition-all duration-300">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Dashboard</p>
            <h1 className="text-3xl font-semibold mt-2 text-neutral-900 dark:text-white">
              Welcome back, {user?.displayName || user?.email?.split('@')[0]}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-300 mt-2 max-w-2xl">
              Everything you need to organise secrets, workflows and teams now lives in one calm, focused surface.
            </p>
            {isPlatformAdmin && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 px-3 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-400">
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
        <div className="group bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-[rgba(255,255,255,0.05)] transition-all duration-300 hover:shadow-lg dark:hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.4)] hover:border-neutral-300 dark:hover:border-[rgba(255,255,255,0.1)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Projects</p>
              <p className="text-3xl font-semibold text-neutral-900 dark:text-white mt-1">
                {isProjectsLoading ? '...' : projectsData?.totalElements ?? 0}
              </p>
            </div>
            <div className="p-3 rounded-2xl border border-neutral-200 dark:border-[rgba(255,255,255,0.05)] text-neutral-500 dark:text-neutral-400 group-hover:text-orange-500 dark:group-hover:text-orange-400 group-hover:border-orange-200 dark:group-hover:border-orange-500/30 transition-all duration-300 group-hover:bg-orange-50 dark:group-hover:bg-orange-500/10">
              <Folder className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-[rgba(255,255,255,0.05)] transition-all duration-300 hover:shadow-lg dark:hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.4)] hover:border-neutral-300 dark:hover:border-[rgba(255,255,255,0.1)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Total Secrets</p>
              <p className="text-3xl font-semibold text-neutral-900 dark:text-white mt-1">
                {isProjectsLoading ? '...' : totalSecrets}
              </p>
            </div>
            <div className="p-3 rounded-2xl border border-neutral-200 dark:border-[rgba(255,255,255,0.05)] text-neutral-500 dark:text-neutral-400 group-hover:text-orange-500 dark:group-hover:text-orange-400 group-hover:border-orange-200 dark:group-hover:border-orange-500/30 transition-all duration-300 group-hover:bg-orange-50 dark:group-hover:bg-orange-500/10">
              <Key className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="group bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-[rgba(255,255,255,0.05)] transition-all duration-300 hover:shadow-lg dark:hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.4)] hover:border-neutral-300 dark:hover:border-[rgba(255,255,255,0.1)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Team Members</p>
              <p className="text-3xl font-semibold text-neutral-900 dark:text-white mt-1">
                {isProjectsLoading ? '...' : totalMembers}
              </p>
            </div>
            <div className="p-3 rounded-2xl border border-neutral-200 dark:border-[rgba(255,255,255,0.05)] text-neutral-500 dark:text-neutral-400 group-hover:text-orange-500 dark:group-hover:text-orange-400 group-hover:border-orange-200 dark:group-hover:border-orange-500/30 transition-all duration-300 group-hover:bg-orange-50 dark:group-hover:bg-orange-500/10">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        {isPlatformAdmin && (
          <div className="group bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-[rgba(255,255,255,0.05)] transition-all duration-300 hover:shadow-lg dark:hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.4)] hover:border-neutral-300 dark:hover:border-[rgba(255,255,255,0.1)]">
          <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Recent Activity</p>
                <p className="text-3xl font-semibold text-neutral-900 dark:text-white mt-1">
                {isActivityLoading ? '...' : activityData?.totalElements ?? 0}
              </p>
            </div>
              <div className="p-3 rounded-2xl border border-neutral-200 dark:border-[rgba(255,255,255,0.05)] text-neutral-500 dark:text-neutral-400 group-hover:text-orange-500 dark:group-hover:text-orange-400 group-hover:border-orange-200 dark:group-hover:border-orange-500/30 transition-all duration-300 group-hover:bg-orange-50 dark:group-hover:bg-orange-500/10">
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflows */}
        <div className="lg:col-span-1 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm border border-gray-100 dark:border-[rgba(255,255,255,0.05)] transition-all duration-300">
          <div className="p-6 border-b border-gray-100 dark:border-[rgba(255,255,255,0.05)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Workflows</h2>
              <Link
                to="/workflows/new"
                className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium flex items-center transition-colors group"
              >
                New <Plus className="w-4 h-4 ml-1 group-hover:scale-110 transition-transform" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[rgba(255,255,255,0.05)]">
            {isWorkflowsLoading ? (
              <div className="p-6 flex justify-center">
                <Spinner size="sm" />
              </div>
            ) : !workflows || workflows.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-neutral-400 text-sm">
                No workflows yet
              </div>
            ) : (
              workflows.map((workflow: Workflow) => (
                <Link
                  key={workflow.id}
                  to={`/workflows/${workflow.id}`}
                  className="block p-4 hover:bg-gray-50 dark:hover:bg-[rgba(255,255,255,0.08)] transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded group-hover:bg-orange-50 dark:group-hover:bg-orange-500/10 transition-colors">
                      <Folder className="h-4 w-4 text-neutral-600 dark:text-neutral-400 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {workflow.name}
                        {workflow.isDefault && (
                          <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">(Default)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
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
        <div className="lg:col-span-1 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm border border-gray-100 dark:border-[rgba(255,255,255,0.05)] transition-all duration-300">
          <div className="p-6 border-b border-gray-100 dark:border-[rgba(255,255,255,0.05)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h2>
              <Link 
                to="/activity" 
                className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium flex items-center transition-colors group"
              >
                View all <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[rgba(255,255,255,0.05)]">
            {isActivityLoading ? (
              <div className="p-6 flex justify-center">
                <Spinner size="sm" />
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-neutral-400 text-sm">
                No recent activity
              </div>
            ) : (
              recentActivity.map((log: AuditLog) => (
                <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-[rgba(255,255,255,0.08)] transition-all duration-300 group">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-gray-100 dark:bg-neutral-800 rounded group-hover:bg-orange-50 dark:group-hover:bg-orange-500/10 transition-colors">
                      <Activity className="h-4 w-4 text-gray-500 dark:text-neutral-400 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {formatAction(log.action)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                        {log.resourceName || log.resourceId || 'System'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-neutral-500 whitespace-nowrap">
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
        <div className="lg:col-span-2 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm border border-gray-100 dark:border-[rgba(255,255,255,0.05)] transition-all duration-300">
          <div className="p-6 border-b border-gray-100 dark:border-[rgba(255,255,255,0.05)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your Projects</h2>
              <Link 
                to="/projects" 
                className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm font-medium flex items-center transition-colors group"
              >
                View all <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
          
          {isProjectsLoading ? (
            <div className="p-6 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center">
              <Folder className="h-12 w-12 text-gray-300 dark:text-neutral-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No projects yet</h3>
              <p className="text-gray-500 dark:text-neutral-400 mb-6">Create your first project to start managing secrets</p>
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
                  className="group block p-4 rounded-xl border border-neutral-200 dark:border-[rgba(255,255,255,0.05)] hover:border-orange-300 dark:hover:border-orange-500/30 hover:shadow-lg dark:hover:shadow-[0_8px_16px_-4px_rgba(249,115,22,0.2)] transition-all duration-300 bg-white dark:bg-[#1a1a1a] hover:bg-orange-50/50 dark:hover:bg-orange-500/5"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-all duration-300 text-neutral-600 dark:text-neutral-400">
                      <Folder className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
                        {project.name}
                      </h3>
                      {project.workflowName && (
                        <div className="flex items-center gap-1.5 mt-1 mb-1.5">
                          <LayoutGrid className="h-3 w-3 text-neutral-400 dark:text-neutral-500" />
                          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium truncate">
                            {project.workflowName}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-neutral-400">
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
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-neutral-200 dark:border-[rgba(255,255,255,0.05)] p-6 transition-all duration-300">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="group flex items-center p-4 rounded-xl border border-neutral-200 dark:border-[rgba(255,255,255,0.05)] hover:border-orange-300 dark:hover:border-orange-500/30 hover:bg-orange-50/50 dark:hover:bg-orange-500/5 hover:shadow-md dark:hover:shadow-[0_4px_12px_-2px_rgba(249,115,22,0.15)] transition-all duration-300 text-left bg-white dark:bg-[#1a1a1a]"
          >
            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl mr-4 text-neutral-600 dark:text-neutral-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-all duration-300">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">New Project</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Create a new project</p>
            </div>
          </button>

          {isPlatformAdmin && (
          <button
            onClick={() => navigate('/activity')}
              className="group flex items-center p-4 rounded-xl border border-neutral-200 dark:border-[rgba(255,255,255,0.05)] hover:border-orange-300 dark:hover:border-orange-500/30 hover:bg-orange-50/50 dark:hover:bg-orange-500/5 hover:shadow-md dark:hover:shadow-[0_4px_12px_-2px_rgba(249,115,22,0.15)] transition-all duration-300 text-left bg-white dark:bg-[#1a1a1a]"
          >
              <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl mr-4 text-neutral-600 dark:text-neutral-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-all duration-300">
                <Activity className="h-5 w-5" />
            </div>
            <div>
                <p className="font-medium text-neutral-900 dark:text-white">View Activity</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">See recent changes</p>
            </div>
          </button>
          )}

          <button
            onClick={() => navigate('/teams')}
            className="group flex items-center p-4 rounded-xl border border-neutral-200 dark:border-[rgba(255,255,255,0.05)] hover:border-orange-300 dark:hover:border-orange-500/30 hover:bg-orange-50/50 dark:hover:bg-orange-500/5 hover:shadow-md dark:hover:shadow-[0_4px_12px_-2px_rgba(249,115,22,0.15)] transition-all duration-300 text-left bg-white dark:bg-[#1a1a1a]"
          >
            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl mr-4 text-neutral-600 dark:text-neutral-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-all duration-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">Manage Team</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Invite collaborators</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="group flex items-center p-4 rounded-xl border border-neutral-200 dark:border-[rgba(255,255,255,0.05)] hover:border-orange-300 dark:hover:border-orange-500/30 hover:bg-orange-50/50 dark:hover:bg-orange-500/5 hover:shadow-md dark:hover:shadow-[0_4px_12px_-2px_rgba(249,115,22,0.15)] transition-all duration-300 text-left bg-white dark:bg-[#1a1a1a]"
          >
            <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl mr-4 text-neutral-600 dark:text-neutral-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-all duration-300">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">Settings</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Configure preferences</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
