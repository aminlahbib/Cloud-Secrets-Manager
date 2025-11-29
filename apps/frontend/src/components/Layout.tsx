import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWorkflows } from '../hooks/useWorkflows';
import { Sidebar } from './layout/Sidebar';
import { MobileHeader } from './layout/MobileHeader';
import { useAuth } from '../contexts/AuthContext';


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

        <div className="flex-1 flex flex-col md:ml-72">
          <MobileHeader isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />

          <main className="flex-1 overflow-y-auto px-4 py-10 md:px-12">
            <div className="max-w-4xl mx-auto w-full space-y-6">{children}</div>
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
