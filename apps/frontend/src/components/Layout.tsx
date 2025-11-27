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
  Shield,
  Bell
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
    queryKey: ['workflows'],
    queryFn: () => workflowsService.listWorkflows(),
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm z-20 relative border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 md:hidden"
              >
                {isSidebarOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
              <Link to="/home" className="flex items-center space-x-3 md:ml-0 ml-3">
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-2 rounded-lg shadow-sm">
                   <span className="text-white font-bold text-xl">CSM</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Cloud Secrets Manager</h1>
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="h-5 w-5" />
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-3 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
                {user?.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.displayName || user.email} 
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="bg-purple-100 p-2 rounded-full">
                    <User className="h-5 w-5 text-purple-600" />
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.displayName || user?.email?.split('@')[0]}
                  </p>
                  {isPlatformAdmin && (
                    <p className="text-xs text-purple-600 font-medium flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      Platform Admin
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-10 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:shadow-none border-r border-gray-200 pt-16 md:pt-0
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="h-full flex flex-col">
            {/* Main Navigation */}
            <nav className="mt-5 px-3 space-y-1">
              {mainNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveLink(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`
                      group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-purple-50 text-purple-700' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Workflows Section */}
            <div className="mt-6 px-3">
              <div className="flex items-center justify-between px-3 mb-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Workflows
                </h3>
                <button 
                  onClick={() => navigate('/workflows/new')}
                  className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                  title="New Workflow"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {workflows?.map((workflow) => {
                  const isExpanded = expandedWorkflows.has(workflow.id);
                  const hasProjects = workflow.projects && workflow.projects.length > 0;
                  
                  return (
                    <div key={workflow.id}>
                      <div className="flex items-center">
                        {hasProjects && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWorkflow(workflow.id);
                            }}
                            className="p-1 hover:bg-gray-100 rounded mr-1"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        )}
                        {!hasProjects && <span className="w-4 mr-2" />}
                        <button
                          onClick={() => navigate(`/workflows/${workflow.id}`)}
                          className={`
                            flex-1 flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                            cursor-pointer hover:bg-gray-50
                            text-gray-600
                          `}
                        >
                          <FolderOpen className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate flex-1 text-left">{workflow.name}</span>
                          {workflow.isDefault && (
                            <span className="text-xs text-purple-500 ml-2">Default</span>
                          )}
                        </button>
                      </div>
                      
                      {/* Projects under workflow */}
                      {isExpanded && workflow.projects && (
                        <div className="ml-6 mt-1 space-y-1">
                          {workflow.projects.map((wp) => (
                            <Link
                              key={wp.projectId}
                              to={`/projects/${wp.projectId}`}
                              onClick={() => setIsSidebarOpen(false)}
                              className={`
                                flex items-center px-3 py-1.5 text-sm rounded-md transition-colors
                                ${location.pathname === `/projects/${wp.projectId}`
                                  ? 'bg-purple-50 text-purple-700'
                                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                }
                              `}
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
                  <p className="px-3 py-2 text-sm text-gray-400 italic">
                    No workflows yet
                  </p>
                )}
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Bottom Navigation */}
            <nav className="px-3 space-y-1 mb-2">
              {bottomNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveLink(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`
                      group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-purple-50 text-purple-700' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                    {item.badge && (
                      <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
              
              {/* Platform Admin Link */}
              {isPlatformAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                    ${isActiveLink('/admin')
                      ? 'bg-purple-50 text-purple-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Shield
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActiveLink('/admin') ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  Admin
                </Link>
              )}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={logout}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        
        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-50 z-0 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
