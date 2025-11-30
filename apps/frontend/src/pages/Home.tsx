import React, { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Folder, Key, Users, Building2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { projectsService } from '../services/projects';
import { workflowsService } from '../services/workflows';
import { auditService, type AuditLogsResponse } from '../services/audit';
import { StatsStrip } from '../components/home/StatsStrip';
import { CollaborationSection } from '../components/home/CollaborationSection';
import { RecentActivity } from '../components/home/RecentActivity';
import { ProjectsOverview } from '../components/home/ProjectsOverview';
import { QuickActions } from '../components/home/QuickActions';
import { Button } from '../components/ui/Button';
import type { Project, Workflow } from '../types';

export const HomePage: React.FC = () => {
  const { user, isPlatformAdmin } = useAuth();
  const navigate = useNavigate();

  // Fetch recent projects
  const { data: projectsData, isLoading: isProjectsLoading } = useQuery({
    queryKey: ['projects', 'recent', user?.id],
    queryFn: () => projectsService.listProjects({ size: 8 }),
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute - recent projects change moderately
  });

  // Fetch workflows
  const { data: workflows, isLoading: isWorkflowsLoading } = useQuery<Workflow[]>({
    queryKey: ['workflows', user?.id],
    queryFn: () => workflowsService.listWorkflows(),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes - workflows rarely change
  });

  // Fetch teams for stats
  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => import('../services/teams').then(m => m.teamsService.listTeams()),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch recent activity (only for platform admins)
  const { data: activityData, isLoading: isActivityLoading } = useQuery<AuditLogsResponse>({
    queryKey: ['activity', 'recent'],
    queryFn: () => auditService.listAuditLogs({ size: 5 }),
    enabled: isPlatformAdmin, // Only fetch for platform admins
    retry: false,
    staleTime: 30 * 1000, // 30 seconds - activity is real-time data
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

  const totalSecrets = useMemo(() => 
    projects.reduce((sum, p) => sum + (p.secretCount ?? 0), 0),
    [projects]
  );
  const totalMembers = useMemo(() => 
    projects.reduce((sum, p) => sum + (p.memberCount ?? 0), 0),
    [projects]
  );

  // Prepare stats for the strip
  const stats = useMemo(() => [
    {
      label: 'Projects',
      value: projectsData?.totalElements ?? 0,
      icon: Folder,
      isLoading: isProjectsLoading,
    },
    {
      label: 'Secrets',
      value: totalSecrets,
      icon: Key,
      isLoading: isProjectsLoading,
    },
    {
      label: 'Teams',
      value: teams?.length ?? 0,
      icon: Building2,
      isLoading: false,
    },
    {
      label: 'Members',
      value: totalMembers,
      icon: Users,
      isLoading: isProjectsLoading,
    },
  ], [projectsData?.totalElements, totalSecrets, teams?.length, totalMembers, isProjectsLoading]);

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
      {/* Header with Title and Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-theme-primary">Overview</h1>
          <p className="text-body text-theme-secondary mt-1">
            Manage your organization's secrets and access controls.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('/activity')}>
            View Audit Logs
          </Button>
          <Button onClick={() => navigate('/projects')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        </div>
      </div>

      {/* Stats Strip */}
      <StatsStrip stats={stats} />

      {/* Main Content: Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        {/* Left Column: Projects Hero Section (65-70%) */}
        <div className="lg:col-span-7 space-y-6">
          <ProjectsOverview projects={projects} isLoading={isProjectsLoading} />
          <QuickActions isPlatformAdmin={isPlatformAdmin} />
        </div>

        {/* Right Column: Collaboration (30-35%) */}
        <div className="lg:col-span-3">
          <CollaborationSection
            workflows={workflows}
            isWorkflowsLoading={isWorkflowsLoading}
            maxTeams={3}
          />
        </div>
      </div>

      {/* Admin Activity Section */}
      {isPlatformAdmin && (
        <div className="mt-8">
          <RecentActivity
            activity={recentActivity}
            isLoading={isActivityLoading}
            formatAction={formatAction}
            getTimeAgo={getTimeAgo}
          />
        </div>
      )}
    </div>
  );
};
