import React, { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Folder, Key, Users, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { projectsService } from '../services/projects';
import { workflowsService } from '../services/workflows';
import { auditService, type AuditLogsResponse } from '../services/audit';
import { WelcomeSection } from '../components/home/WelcomeSection';
import { StatsCard } from '../components/home/StatsCard';
import { WorkflowsList } from '../components/home/WorkflowsList';
import { TeamsOverview } from '../components/home/TeamsOverview';
import { RecentActivity } from '../components/home/RecentActivity';
import { ProjectsOverview } from '../components/home/ProjectsOverview';
import { QuickActions } from '../components/home/QuickActions';
import type { Project, Workflow } from '../types';

export const HomePage: React.FC = () => {
  const { user, isPlatformAdmin } = useAuth();

  // Fetch recent projects
  const { data: projectsData, isLoading: isProjectsLoading } = useQuery({
    queryKey: ['projects', 'recent', user?.id],
    queryFn: () => projectsService.listProjects({ size: 6 }),
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
      <WelcomeSection />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          label="Total Projects"
          value={projectsData?.totalElements ?? 0}
          icon={Folder}
          isLoading={isProjectsLoading}
        />
        <StatsCard
          label="Total Secrets"
          value={totalSecrets}
          icon={Key}
          isLoading={isProjectsLoading}
        />
        <StatsCard
          label="Teams"
          value={teams?.length ?? 0}
          icon={Building2}
          isLoading={false}
        />
        <StatsCard
          label="Team Members"
          value={totalMembers}
          icon={Users}
          isLoading={isProjectsLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WorkflowsList workflows={workflows} isLoading={isWorkflowsLoading} />
        <TeamsOverview maxTeams={3} />
        <ProjectsOverview projects={projects} isLoading={isProjectsLoading} />
      </div>

      {isPlatformAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivity
            activity={recentActivity}
            isLoading={isActivityLoading}
            formatAction={formatAction}
            getTimeAgo={getTimeAgo}
          />
        </div>
      )}

      <QuickActions isPlatformAdmin={isPlatformAdmin} />
    </div>
  );
};
