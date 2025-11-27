import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { workflowsService } from '../services/workflows';
import {
  LayoutDashboard,
  Folder,
  FolderOpen,
  Activity,
  Users,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  Plus,
  ChevronDown,
  ChevronRight,
  Shield
} from 'lucide-react';
import type { Workflow } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isPlatformAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set());

  // Fetch user's workflows
  const { data: workflows } = useQuery<Workflow[]>({
    queryKey: ['workflows', user?.id],
    queryFn: () => workflowsService.listWorkflows(),
    enabled: !!user?.id,
    staleTime: 30000, // Cache for 30 seconds
  });

  const toggleWorkflow = (workflowId: string) => {
    setExpandedWorkflows(prev => {
      const next = new Set(prev);
      if (next.has(workflowId)) {
        next.delete(workflowId);
      } else {
        next.add(workflowId);
      }
      return next;
    });
  };

  const mainNavigation = [
    { name: 'Home', href: '/home', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: Folder },
    { name: 'Activity', href: '/activity', icon: Activity },
  ];

  const bottomNavigation = [
    { name: 'Teams', href: '/teams', icon: Users, badge: 'Soon' },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const isActiveLink = (href: string) => {
    if (href === '/home') return location.pathname === '/home' || location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="flex min-h-screen">
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-neutral-200 flex flex-col justify-between px-6 py-8 transition-transform duration-300 md:translate-x-0
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div>
            <Link to="/home" className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center text-xl font-semibold">
                CSM
              </div>
              <span className="text-lg font-semibold tracking-tight">Cloud Secrets</span>
            </Link>

            <div className="mt-10 space-y-1">
              {mainNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveLink(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-neutral-100 text-neutral-900'
                        : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-neutral-900' : 'text-neutral-400'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <div className="mt-10">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-neutral-400 px-1">
                <span>Workflows</span>
                <button
                  onClick={() => navigate('/workflows/new')}
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                  title="New Workflow"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 space-y-1 max-h-64 overflow-y-auto pr-1">
                {workflows?.map((workflow) => {
                  const isExpanded = expandedWorkflows.has(workflow.id);
                  const hasProjects = workflow.projects && workflow.projects.length > 0;
                  return (
                    <div key={workflow.id}>
                      <div className="flex items-center">
                        {hasProjects ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWorkflow(workflow.id);
                            }}
                            className="p-1 rounded-full text-neutral-400 hover:text-neutral-900"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        ) : (
                          <span className="w-6" />
                        )}
                        <button
                          onClick={() => navigate(`/workflows/${workflow.id}`)}
                          className="flex-1 text-left px-3 py-2 rounded-xl hover:bg-neutral-100 transition-colors text-sm font-medium text-neutral-700"
                        >
                          <div className="flex items-center space-x-2">
                            <FolderOpen className="h-4 w-4 text-neutral-400" />
                            <span className="truncate">{workflow.name}</span>
                            {workflow.isDefault && (
                              <span className="text-[11px] text-neutral-500 border border-neutral-200 rounded-full px-2 py-0.5">
                                Default
                              </span>
                            )}
                          </div>
                        </button>
                      </div>
                      {isExpanded && workflow.projects && (
                        <div className="ml-8 mt-1 space-y-1">
                          {workflow.projects.map((wp) => (
                            <Link
                              key={wp.projectId}
                              to={`/projects/${wp.projectId}`}
                              onClick={() => setIsSidebarOpen(false)}
                              className={`flex items-center px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                location.pathname === `/projects/${wp.projectId}`
                                  ? 'bg-neutral-900 text-white'
                                  : 'text-neutral-500 hover:bg-neutral-100'
                              }`}
                            >
                              <Folder className="h-4 w-4 mr-2" />
                              <span className="truncate">{wp.project?.name || 'Project'}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {(!workflows || workflows.length === 0) && (
                  <p className="px-3 py-2 text-sm text-neutral-400 italic">No workflows yet</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              {bottomNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveLink(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-neutral-100 text-neutral-900'
                        : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-neutral-900' : 'text-neutral-400'}`} />
                    {item.name}
                    {item.badge && (
                      <span className="ml-auto text-[11px] uppercase tracking-wide text-neutral-400">{item.badge}</span>
                    )}
                  </Link>
                );
              })}

              {isPlatformAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActiveLink('/admin')
                      ? 'bg-neutral-100 text-neutral-900'
                      : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  <Shield className={`mr-3 h-5 w-5 ${isActiveLink('/admin') ? 'text-neutral-900' : 'text-neutral-400'}`} />
                  Admin
                </Link>
              )}
            </div>

            <div className="border-t border-neutral-200 pt-6">
              <div className="flex items-center space-x-3">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.displayName || user.email} className="h-10 w-10 rounded-full" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{user?.displayName || user?.email?.split('@')[0]}</p>
                  <p className="text-xs text-neutral-500">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-4 w-full flex items-center justify-center rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col md:ml-72">
          <header className="md:hidden flex items-center justify-between px-4 py-4 border-b border-neutral-200 bg-white">
            <button onClick={toggleSidebar} className="p-2 rounded-lg border border-neutral-200">
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <span className="text-sm font-semibold tracking-tight uppercase">Cloud Secrets</span>
            <div className="h-8 w-8 rounded-full bg-neutral-900 text-white flex items-center justify-center">
              {user?.displayName?.[0] || user?.email?.[0] || 'U'}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-4 py-10 md:px-12">
            <div className="max-w-4xl mx-auto w-full space-y-6">{children}</div>
          </main>
        </div>
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
};
