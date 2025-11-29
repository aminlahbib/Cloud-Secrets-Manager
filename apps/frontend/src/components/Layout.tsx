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
  const { mode, toggleMode } = useTheme();
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
    <div 
      className="min-h-screen transition-colors duration-200"
      style={{
        backgroundColor: 'var(--page-bg)',
        color: 'var(--text-primary)',
      }}
    >
      <div className="flex min-h-screen">
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 w-72 flex flex-col justify-between padding-sidebar transition-all duration-200 md:translate-x-0
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          style={{
            backgroundColor: 'var(--sidebar-bg)',
            borderRightColor: 'var(--sidebar-border)',
            borderRightWidth: '1px',
            borderRightStyle: 'solid',
          }}
        >
          <div>
            <Link to="/home" className="flex items-center space-x-3">
              <img 
                src="/assets/csm-2.webp" 
                alt="Cloud Secrets Manager Logo" 
                className="h-12 w-12 rounded-2xl object-contain"
                onError={(e) => {
                  // Fallback to text logo if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div 
                className="h-12 w-12 rounded-2xl flex items-center justify-center text-xl font-semibold hidden"
                style={{ backgroundColor: 'var(--elevation-1)', color: 'var(--text-primary)' }}
              >
                CSM
              </div>
              <span className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Cloud Secrets</span>
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
                    className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <div className="mt-10" ref={workflowSelectorRef}>
              <div className="flex items-center justify-between text-label px-1 mb-3" style={{ color: 'var(--sidebar-section-header, var(--text-tertiary))' }}>
                <span>Workspace</span>
                <button
                  onClick={() => navigate('/workflows/new')}
                  className="text-xs font-medium flex items-center gap-1 transition-all duration-150 hover:scale-105"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  <Plus className="h-4 w-4" />
                  New
                </button>
              </div>

              {workflows && workflows.length > 0 ? (
                <div>
                  <button
                    onClick={() => setIsWorkflowMenuOpen((prev) => !prev)}
                    className="w-full text-left rounded-2xl border px-4 py-3 transition-all duration-150 flex items-center justify-between card hover:border-default"
                    style={{
                      borderColor: isWorkflowMenuOpen ? 'var(--border-accent)' : 'var(--border-subtle)',
                      boxShadow: isWorkflowMenuOpen ? 'var(--shadow-md), var(--glow-accent)' : 'var(--shadow-sm)',
                    }}
                  >
                    <div>
                      <p className="text-body-sm font-semibold text-primary">
                        {selectedWorkflow?.name || 'Select workflow'}
                      </p>
                      <p className="text-caption text-tertiary">
                        {(selectedWorkflow?.projects?.length || 0)} Projects
                      </p>
                    </div>
                    <ChevronDown
                      className="h-4 w-4 text-tertiary transition-transform duration-150"
                      style={{ transform: isWorkflowMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </button>

                  {isWorkflowMenuOpen && (
                    <div 
                      className="mt-2 rounded-2xl border overflow-hidden" 
                      style={{ 
                        borderColor: 'var(--border-subtle)', 
                        boxShadow: 'var(--shadow-lg)',
                        backgroundColor: 'var(--elevation-2)',
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      <div className="max-h-64 overflow-y-auto">
                        {workflows.map((workflow) => {
                          const isSelected = workflow.id === selectedWorkflowId;
                          return (
                            <button
                              key={workflow.id}
                              onClick={() => handleWorkflowSelect(workflow.id)}
                              className="w-full px-4 py-3 text-left flex items-center justify-between text-body-sm transition-all duration-150"
                              style={{
                                backgroundColor: isSelected ? 'var(--sidebar-active-bg)' : 'transparent',
                                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                                borderLeft: isSelected ? '3px solid var(--accent-primary)' : 'none',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.backgroundColor = 'var(--sidebar-hover-bg)';
                                  e.currentTarget.style.color = 'var(--text-primary)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = 'var(--text-secondary)';
                                }
                              }}
                            >
                              <div>
                                <p className="font-medium">{workflow.name}</p>
                                <p className="text-caption text-tertiary">
                                  {(workflow.projects?.length || 0)} Projects
                                </p>
                              </div>
                              {isSelected && <span className="text-primary text-lg">•</span>}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => {
                          setIsWorkflowMenuOpen(false);
                          navigate('/workflows/new');
                        }}
                        className="w-full px-4 py-3 text-body-sm font-medium border-t text-left flex items-center gap-2 transition-all duration-150 hover:bg-elevation-2"
                        style={{ 
                          color: 'var(--accent-primary)',
                          borderTopColor: 'var(--border-subtle)',
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Create Workflow
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  className="rounded-2xl border border-dashed p-6 text-center"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <p className="text-sm mb-3" style={{ color: 'var(--text-tertiary)' }}>No workflows yet</p>
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
                    className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                    {item.badge && (
                      <span className="ml-auto text-caption text-tertiary uppercase tracking-wide">{item.badge}</span>
                    )}
                  </Link>
                );
              })}

              {isPlatformAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsSidebarOpen(false)}
                  className={`nav-item ${isActiveLink('/admin') ? 'nav-item-active' : ''}`}
                >
                  <Shield className="h-5 w-5" />
                  Admin
                </Link>
              )}
            </div>

            <div 
              className="border-t pt-6 space-y-3"
              style={{ borderTopColor: 'var(--border-subtle)' }}
            >
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleMode}
                className="nav-item"
              >
                {mode === 'dark' ? (
                  <>
                    <Sun className="h-5 w-5" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="h-5 w-5" />
                    Dark Mode
                  </>
                )}
              </button>

              <div className="flex items-center space-x-3">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.displayName || user.email} className="h-10 w-10 rounded-full" />
                ) : (
                  <div 
                    className="h-10 w-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--elevation-2)' }}
                  >
                    <User className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
                  </div>
                )}
                <div>
                  <p className="text-body-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user?.displayName || user?.email?.split('@')[0]}</p>
                  <p className="text-caption" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-4 w-full flex items-center justify-center rounded-xl border px-3 py-2 text-body-sm font-medium transition-all duration-150 hover:bg-elevation-2"
                style={{
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col md:ml-72">
          <header 
            className="md:hidden flex items-center justify-between px-4 py-4 border-b transition-colors"
            style={{
              backgroundColor: 'var(--sidebar-bg)',
              borderBottomColor: 'var(--border-subtle)',
            }}
          >
            <button 
              onClick={toggleSidebar} 
              className="p-2 rounded-lg border min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation transition-colors"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <span className="text-body-sm font-semibold tracking-tight uppercase text-primary">Cloud Secrets</span>
            <div 
              className="h-8 w-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--elevation-2)', color: 'var(--text-primary)' }}
            >
              {user?.displayName?.[0] || user?.email?.[0] || 'U'}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-4 py-10 md:px-12">
            <div className="max-w-4xl mx-auto w-full space-y-6">{children}</div>
          </main>
        </div>
      </div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 md:hidden" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}
    </div>
  );
};
