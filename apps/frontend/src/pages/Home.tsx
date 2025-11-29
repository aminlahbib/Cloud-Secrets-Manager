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
      <div className="card rounded-3xl padding-section gradient-hero ambient-glow">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-label text-tertiary mb-2">Dashboard</p>
            <h1 className="text-hero text-primary mt-2">
              Welcome back, {user?.displayName || user?.email?.split('@')[0]}
            </h1>
            <p className="text-body text-secondary mt-3 max-w-2xl">
              Everything you need to organise secrets, workflows and teams now lives in one calm, focused surface.
            </p>
            {isPlatformAdmin && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-caption font-medium badge-primary">
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
        <div className="card group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-sm font-medium text-secondary">Total Projects</p>
              <p className="text-h1 font-semibold text-primary mt-1">
                {isProjectsLoading ? '...' : projectsData?.totalElements ?? 0}
              </p>
            </div>
            <div 
              className="p-3 rounded-2xl border transition-all duration-150"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-tertiary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-accent)';
                e.currentTarget.style.color = 'var(--accent-primary)';
                e.currentTarget.style.backgroundColor = 'var(--accent-primary-glow)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-tertiary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Folder className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="card group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-sm font-medium text-secondary">Total Secrets</p>
              <p className="text-h1 font-semibold text-primary mt-1">
                {isProjectsLoading ? '...' : totalSecrets}
              </p>
            </div>
            <div 
              className="p-3 rounded-2xl border transition-all duration-150"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-tertiary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-accent)';
                e.currentTarget.style.color = 'var(--accent-primary)';
                e.currentTarget.style.backgroundColor = 'var(--accent-primary-glow)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-tertiary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Key className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="card group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-sm font-medium text-secondary">Team Members</p>
              <p className="text-h1 font-semibold text-primary mt-1">
                {isProjectsLoading ? '...' : totalMembers}
              </p>
            </div>
            <div 
              className="p-3 rounded-2xl border transition-all duration-150"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-tertiary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-accent)';
                e.currentTarget.style.color = 'var(--accent-primary)';
                e.currentTarget.style.backgroundColor = 'var(--accent-primary-glow)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-tertiary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        {isPlatformAdmin && (
          <div className="card group">
          <div className="flex items-center justify-between">
            <div>
                <p className="text-body-sm font-medium text-secondary">Recent Activity</p>
                <p className="text-h1 font-semibold text-primary mt-1">
                {isActivityLoading ? '...' : activityData?.totalElements ?? 0}
              </p>
            </div>
              <div 
                className="p-3 rounded-2xl border transition-all duration-150"
                style={{
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-tertiary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-accent)';
                  e.currentTarget.style.color = 'var(--accent-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--accent-primary-glow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.color = 'var(--text-tertiary)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflows */}
        <div className="lg:col-span-1 card">
          <div className="padding-card border-b" style={{ borderBottomColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-h3 font-semibold text-primary">Workflows</h2>
              <Link
                to="/workflows/new"
                className="text-body-sm font-medium flex items-center transition-all duration-150 hover:scale-105"
                style={{ color: 'var(--accent-primary)' }}
              >
                New <Plus className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {isWorkflowsLoading ? (
              <div className="padding-card flex justify-center">
                <Spinner size="sm" />
              </div>
            ) : !workflows || workflows.length === 0 ? (
              <div className="padding-card text-center text-tertiary text-body-sm">
                No workflows yet
              </div>
            ) : (
              workflows.map((workflow: Workflow) => (
                <Link
                  key={workflow.id}
                  to={`/workflows/${workflow.id}`}
                  className="block p-4 transition-all duration-150"
                  style={{
                    '--hover-bg': 'var(--elevation-3)',
                  } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--elevation-3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-1.5 rounded transition-all duration-150"
                      style={{ backgroundColor: 'var(--elevation-1)' }}
                    >
                      <Folder className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-primary truncate">
                        {workflow.name}
                        {workflow.isDefault && (
                          <span className="ml-2 text-caption text-tertiary">(Default)</span>
                        )}
                      </p>
                      <p className="text-caption text-tertiary mt-0.5">
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
        <div className="lg:col-span-1 card">
          <div className="padding-card border-b" style={{ borderBottomColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-h3 font-semibold text-primary">Recent Activity</h2>
              <Link 
                to="/activity" 
                className="text-body-sm font-medium flex items-center transition-all duration-150 hover:scale-105"
                style={{ color: 'var(--accent-primary)' }}
              >
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {isActivityLoading ? (
              <div className="padding-card flex justify-center">
                <Spinner size="sm" />
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="padding-card text-center text-tertiary text-body-sm">
                No recent activity
              </div>
            ) : (
              recentActivity.map((log: AuditLog) => (
                <div 
                  key={log.id} 
                  className="p-4 transition-all duration-150"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--elevation-3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="p-1.5 rounded transition-all duration-150"
                      style={{ backgroundColor: 'var(--elevation-1)' }}
                    >
                      <Activity className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-primary truncate">
                        {formatAction(log.action)}
                      </p>
                      <p className="text-caption text-tertiary mt-0.5">
                        {log.resourceName || log.resourceId || 'System'}
                      </p>
                    </div>
                    <span className="text-caption text-tertiary whitespace-nowrap">
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
        <div className="lg:col-span-2 card">
          <div className="padding-card border-b" style={{ borderBottomColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-h3 font-semibold text-primary">Your Projects</h2>
              <Link 
                to="/projects" 
                className="text-body-sm font-medium flex items-center transition-all duration-150 hover:scale-105"
                style={{ color: 'var(--accent-primary)' }}
              >
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          
          {isProjectsLoading ? (
            <div className="padding-card flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center">
              <Folder className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
              <h3 className="text-h3 font-medium text-primary mb-2">No projects yet</h3>
              <p className="text-body-sm text-secondary mb-6">Create your first project to start managing secrets</p>
              <Button onClick={() => navigate('/projects')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 padding-card">
              {projects.slice(0, 4).map((project: Project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="group block p-4 rounded-xl border transition-all duration-150 card hover:border-default"
                  style={{
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="p-2 rounded-xl transition-all duration-150"
                      style={{ backgroundColor: 'var(--elevation-1)', color: 'var(--text-tertiary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--accent-primary-glow)';
                        e.currentTarget.style.color = 'var(--accent-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--elevation-1)';
                        e.currentTarget.style.color = 'var(--text-tertiary)';
                      }}
                    >
                      <Folder className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-primary truncate text-body-sm">
                        {project.name}
                      </h3>
                      {project.workflowName && (
                        <div className="flex items-center gap-1.5 mt-1 mb-1.5">
                          <LayoutGrid className="h-3 w-3" style={{ color: 'var(--text-tertiary)' }} />
                          <span className="text-caption text-tertiary font-medium truncate">
                            {project.workflowName}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-body-sm" style={{ color: 'var(--text-secondary)' }}>
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
      <div className="card">
        <h2 className="text-h3 font-semibold text-primary mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="group flex items-center p-4 rounded-xl border text-left transition-all duration-150 card hover:border-default"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div 
              className="p-2 rounded-xl mr-4 transition-all duration-150"
              style={{ backgroundColor: 'var(--elevation-1)', color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-primary-glow)';
                e.currentTarget.style.color = 'var(--accent-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--elevation-1)';
                e.currentTarget.style.color = 'var(--text-tertiary)';
              }}
            >
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-primary text-body-sm">New Project</p>
              <p className="text-caption text-secondary">Create a new project</p>
            </div>
          </button>

          {isPlatformAdmin && (
          <button
            onClick={() => navigate('/activity')}
            className="group flex items-center p-4 rounded-xl border text-left transition-all duration-150 card hover:border-default"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
              <div 
                className="p-2 rounded-xl mr-4 transition-all duration-150"
                style={{ backgroundColor: 'var(--elevation-1)', color: 'var(--text-tertiary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-primary-glow)';
                  e.currentTarget.style.color = 'var(--accent-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--elevation-1)';
                  e.currentTarget.style.color = 'var(--text-tertiary)';
                }}
              >
                <Activity className="h-5 w-5" />
            </div>
            <div>
                <p className="font-medium text-primary text-body-sm">View Activity</p>
                <p className="text-caption text-secondary">See recent changes</p>
            </div>
          </button>
          )}

          <button
            onClick={() => navigate('/teams')}
            className="group flex items-center p-4 rounded-xl border text-left transition-all duration-150 card hover:border-default"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div 
              className="p-2 rounded-xl mr-4 transition-all duration-150"
              style={{ backgroundColor: 'var(--elevation-1)', color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-primary-glow)';
                e.currentTarget.style.color = 'var(--accent-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--elevation-1)';
                e.currentTarget.style.color = 'var(--text-tertiary)';
              }}
            >
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-primary text-body-sm">Manage Team</p>
              <p className="text-caption text-secondary">Invite collaborators</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="group flex items-center p-4 rounded-xl border text-left transition-all duration-150 card hover:border-default"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div 
              className="p-2 rounded-xl mr-4 transition-all duration-150"
              style={{ backgroundColor: 'var(--elevation-1)', color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-primary-glow)';
                e.currentTarget.style.color = 'var(--accent-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--elevation-1)';
                e.currentTarget.style.color = 'var(--text-tertiary)';
              }}
            >
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-primary text-body-sm">Settings</p>
              <p className="text-caption text-secondary">Configure preferences</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
