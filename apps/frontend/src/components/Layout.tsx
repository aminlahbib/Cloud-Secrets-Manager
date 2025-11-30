import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWorkflows } from '../hooks/useWorkflows';
import { Sidebar } from './layout/Sidebar';
import { TopBar } from './layout/TopBar';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isPlatformAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

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

  const handleWorkflowSelect = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
    navigate(`/workflows/${workflowId}`);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div 
      className="min-h-screen transition-colors duration-200"
      style={{
        backgroundColor: 'var(--page-bg)',
        color: 'var(--text-primary)',
      }}
    >
      <div className="flex min-h-screen">
        <Sidebar
          isOpen={isSidebarOpen}
          onNavigate={() => setIsSidebarOpen(false)}
          workflows={workflows}
          selectedWorkflowId={selectedWorkflowId}
          onSelectWorkflow={handleWorkflowSelect}
          isPlatformAdmin={isPlatformAdmin}
          onLogout={logout}
        />

        <div className="flex-1 flex flex-col md:ml-64">
          {/* Top Bar - Persistent across pages */}
          <TopBar />

          {/* Mobile Menu Button */}
          <button
            onClick={toggleSidebar}
            className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-elevation-1 border border-theme-subtle text-theme-primary"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 py-8 md:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 md:hidden" 
          style={{ backgroundColor: 'var(--overlay-bg-light)' }}
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}
    </div>
  );
};
