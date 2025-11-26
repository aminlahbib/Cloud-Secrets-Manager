import React from 'react';
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
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { projectsService } from '../services/projects';
import { auditService, type AuditLogsResponse } from '../services/audit';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import type { Project, AuditLog } from '../types';

export const HomePage: React.FC = () => {
  const { user, isPlatformAdmin } = useAuth();
  const navigate = useNavigate();

  // Fetch recent projects
  const { data: projectsData, isLoading: isProjectsLoading } = useQuery({
    queryKey: ['projects', 'recent'],
    queryFn: () => projectsService.listProjects({ size: 6 }),
  });

  // Fetch recent activity
  const { data: activityData, isLoading: isActivityLoading } = useQuery<AuditLogsResponse>({
    queryKey: ['activity', 'recent'],
    queryFn: () => auditService.listAuditLogs({ size: 5 }),
  });

  const projects = projectsData?.content ?? [];
  const recentActivity = activityData?.content ?? [];

  const totalSecrets = projects.reduce((sum, p) => sum + (p.secretCount ?? 0), 0);
  const totalMembers = projects.reduce((sum, p) => sum + (p.memberCount ?? 0), 0);

  const getTimeAgo = (timestamp: string) => {
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
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.displayName || user?.email?.split('@')[0]}! 👋
            </h1>
            <p className="text-purple-100 text-lg">
              Manage your cloud secrets securely and efficiently.
            </p>
            {isPlatformAdmin && (
              <div className="mt-3 flex items-center text-purple-200">
                <Shield className="h-4 w-4 mr-2" />
                <span className="text-sm">Platform Administrator</span>
              </div>
            )}
          </div>
          <div className="mt-6 md:mt-0">
            <Button
              onClick={() => navigate('/projects')}
              className="bg-white text-purple-600 hover:bg-purple-50"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Project
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Projects</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {isProjectsLoading ? '...' : projectsData?.totalElements ?? 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Folder className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Secrets</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {isProjectsLoading ? '...' : totalSecrets}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Key className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Team Members</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {isProjectsLoading ? '...' : totalMembers}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Recent Activity</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {isActivityLoading ? '...' : activityData?.totalElements ?? 0}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Activity className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
              <Link 
                to="/activity" 
                className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center"
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
                        {log.resourceId || log.secretKey || 'System'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {getTimeAgo(log.createdAt || log.timestamp || '')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Projects Overview */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Your Projects</h2>
              <Link 
                to="/projects" 
                className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center"
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
                  className="group block p-4 rounded-lg border border-gray-100 hover:border-purple-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                      <Folder className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                        {project.name}
                      </h3>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-purple-200 hover:bg-purple-50 transition-all text-left"
          >
            <div className="p-2 bg-purple-100 rounded-lg mr-4">
              <Plus className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">New Project</p>
              <p className="text-sm text-gray-500">Create a new project</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/activity')}
            className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-purple-200 hover:bg-purple-50 transition-all text-left"
          >
            <div className="p-2 bg-orange-100 rounded-lg mr-4">
              <Activity className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">View Activity</p>
              <p className="text-sm text-gray-500">See recent changes</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/teams')}
            className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-purple-200 hover:bg-purple-50 transition-all text-left"
          >
            <div className="p-2 bg-blue-100 rounded-lg mr-4">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Manage Team</p>
              <p className="text-sm text-gray-500">Invite collaborators</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-purple-200 hover:bg-purple-50 transition-all text-left"
          >
            <div className="p-2 bg-gray-100 rounded-lg mr-4">
              <TrendingUp className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Settings</p>
              <p className="text-sm text-gray-500">Configure preferences</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
