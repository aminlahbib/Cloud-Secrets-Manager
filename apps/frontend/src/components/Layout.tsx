import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useWorkflows } from '../hooks/useWorkflows';
import { Button } from './ui/Button';
import {
  LayoutDashboard,
  Folder,
  Activity,
  Users,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  Plus,
  ChevronDown,
  Shield,
  Moon,
  Sun
} from 'lucide-react';


interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isPlatformAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [isWorkflowMenuOpen, setIsWorkflowMenuOpen] = useState(false);
  const workflowSelectorRef = useRef<HTMLDivElement | null>(null);

  // Fetch user's workflows
  const { data: workflows } = useWorkflows(user?.id);

  // Extract workflow ID from route (e.g., /workflows/:workflowId)
  useEffect(() => {
    const workflowMatch = location.pathname.match(/^\/workflows\/([^/]+)/);
    if (workflowMatch && workflowMatch[1]) {
      const workflowIdFromRoute = workflowMatch[1];
      // Only update if it's different to avoid unnecessary re-renders
      if (workflowIdFromRoute !== selectedWorkflowId) {
        setSelectedWorkflowId(workflowIdFromRoute);
      }
    } else if (!selectedWorkflowId && workflows && workflows.length > 0) {
      // If not on a workflow page and no workflow is selected, select default
      const defaultWorkflow = workflows.find((wf) => wf.isDefault) || workflows[0];
      setSelectedWorkflowId(defaultWorkflow.id);
    }
  }, [location.pathname, workflows, selectedWorkflowId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        workflowSelectorRef.current &&
        !workflowSelectorRef.current.contains(event.target as Node)
      ) {
        setIsWorkflowMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedWorkflow = workflows?.find((wf) => wf.id === selectedWorkflowId);

  const handleWorkflowSelect = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    setIsWorkflowMenuOpen(false);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
    navigate(`/workflows/${workflowId}`);
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
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
      <div className="flex min-h-screen">
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 flex flex-col justify-between px-6 py-8 transition-transform duration-300 md:translate-x-0
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
                    className={`flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px] touch-manipulation ${isActive
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

            <div className="mt-10" ref={workflowSelectorRef}>
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 px-1 mb-3">
                <span>Workspace</span>
                <button
                  onClick={() => navigate('/workflows/new')}
                  className="text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  New
                </button>
              </div>

              {workflows && workflows.length > 0 ? (
                <div>
                  <button
                    onClick={() => setIsWorkflowMenuOpen((prev) => !prev)}
                    className={`
                      w-full text-left rounded-2xl border px-4 py-3 transition-all flex items-center justify-between
                      ${isWorkflowMenuOpen ? 'border-neutral-900 shadow-sm' : 'border-neutral-200 hover:border-neutral-300'}
                    `}
                  >
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">
                        {selectedWorkflow?.name || 'Select workflow'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {(selectedWorkflow?.projects?.length || 0)} Projects
                      </p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-neutral-400 transition-transform ${isWorkflowMenuOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>

                  {isWorkflowMenuOpen && (
                    <div className="mt-2 rounded-2xl border border-neutral-200 bg-white shadow-lg overflow-hidden">
                      <div className="max-h-64 overflow-y-auto">
                        {workflows.map((workflow) => {
                          const isSelected = workflow.id === selectedWorkflowId;
                          return (
                            <button
                              key={workflow.id}
                              onClick={() => handleWorkflowSelect(workflow.id)}
                              className={`w-full px-4 py-3 text-left flex items-center justify-between text-sm ${isSelected ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100' : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                                }`}
                            >
                              <div>
                                <p className="font-medium">{workflow.name}</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                  {(workflow.projects?.length || 0)} Projects
                                </p>
                              </div>
                              {isSelected && <span className="text-neutral-900 dark:text-neutral-100 text-lg">•</span>}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => {
                          setIsWorkflowMenuOpen(false);
                          navigate('/workflows/new');
                        }}
                        className="w-full px-4 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-300 border-t border-neutral-100 dark:border-neutral-700 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create Workflow
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-center">
                  <p className="text-sm text-neutral-500 mb-3">No workflows yet</p>
                  <Button onClick={() => navigate('/workflows/new')} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Workflow
                  </Button>
                </div>
              )}
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
                    className={`flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px] touch-manipulation ${isActive
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
                    className={`flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px] touch-manipulation ${isActiveLink('/admin')
                    ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100'
                    }`}
                >
                  <Shield className={`mr-3 h-5 w-5 ${isActiveLink('/admin') ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-400 dark:text-neutral-500'}`} />
                  Admin
                </Link>
              )}
            </div>

            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6 space-y-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-colors text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="mr-3 h-5 w-5" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="mr-3 h-5 w-5" />
                    Dark Mode
                  </>
                )}
              </button>

              <div className="flex items-center space-x-3">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.displayName || user.email} className="h-10 w-10 rounded-full" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{user?.displayName || user?.email?.split('@')[0]}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-4 w-full flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col md:ml-72">
          <header className="md:hidden flex items-center justify-between px-4 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
            <button onClick={toggleSidebar} className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation text-neutral-900 dark:text-neutral-100">
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <span className="text-sm font-semibold tracking-tight uppercase text-neutral-900 dark:text-neutral-100">Cloud Secrets</span>
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
