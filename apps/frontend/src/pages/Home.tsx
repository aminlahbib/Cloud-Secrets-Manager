import React, { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Folder, Key, Users, Building2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { projectsService } from '../services/projects';
import { workflowsService } from '../services/workflows';
import { auditService } from '../services/audit';
import type { AuditLog } from '../types';
import { StatsStrip } from '../components/home/StatsStrip';
import { CollaborationSection } from '../components/home/CollaborationSection';
import { RecentActivity } from '../components/home/RecentActivity';
import { ProjectsOverview } from '../components/home/ProjectsOverview';
import { Button } from '../components/ui/Button';
import type { Project, Workflow } from '../types';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

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

  const projectsList = projectsData?.content ?? [];

  // Fetch recent activity from all user's projects
  const { data: activityData, isLoading: isActivityLoading } = useQuery<AuditLog[]>({
    queryKey: ['activity', 'recent', projectsList.length],
    queryFn: async () => {
      if (projectsList.length === 0) return [];
      
      // Fetch activities from all projects in parallel
      const activityPromises = projectsList.map(async (project: Project) => {
        try {
          const response = await auditService.getProjectAuditLogs(project.id, {
            page: 0,
            size: 20, // Get more items per project to find most recent
          });
          return response.content || [];
        } catch (err: any) {
          // Skip projects user doesn't have access to
          if (err.response?.status === 403 || err.response?.status === 404) {
            return [];
          }
          return [];
        }
      });

      const allActivities = await Promise.all(activityPromises);
      const flattened = allActivities.flat();

      // Sort by date (newest first) and take top 3
      const sorted = flattened.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      return sorted.slice(0, 3);
    },
    enabled: !!user?.id && projectsList.length > 0,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - preserve audit data across sessions
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache for 30 minutes even when not in use
  });

  const recentActivity = activityData ?? [];

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

    if (diffMins < 1) return t('home.justNow');
    if (diffMins < 60) return t('home.timeAgo.minutes', { count: diffMins });
    if (diffHours < 24) return t('home.timeAgo.hours', { count: diffHours });
    if (diffDays < 7) return t('home.timeAgo.days', { count: diffDays });
    return then.toLocaleDateString();
  }, [t]);

  const formatAction = useCallback((action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }, []);

  return (
    <div className="space-y-8">
      {/* Header with Title and Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-theme-primary">{t('home.title')}</h1>
          <p className="text-body text-theme-secondary mt-1">
            {t('home.subtitle')}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('/activity')}>
            {t('home.viewAuditLogs')}
          </Button>
          <Button onClick={() => navigate('/projects')}>
            <Plus className="w-4 h-4 mr-2" />
            {t('home.addProject')}
          </Button>
        </div>
      </div>

      {/* Stats Strip */}
      <StatsStrip stats={stats} />

      {/* Main Content: Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        {/* Left Column: Projects Hero Section (70%) */}
        <div className="lg:col-span-7">
          <ProjectsOverview projects={projects} isLoading={isProjectsLoading} getTimeAgo={getTimeAgo} />
        </div>

        {/* Right Column: Teams and Recent Activity (30%) */}
        <div className="lg:col-span-3 space-y-4">
          <CollaborationSection
            workflows={workflows}
            isWorkflowsLoading={isWorkflowsLoading}
            maxTeams={2}
          />
          <RecentActivity
            activity={recentActivity}
            isLoading={isActivityLoading}
            formatAction={formatAction}
            getTimeAgo={getTimeAgo}
          />
        </div>
      </div>
    </div>
  );
};
