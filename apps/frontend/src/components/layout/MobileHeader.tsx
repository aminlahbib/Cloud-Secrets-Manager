import React from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface MobileHeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ isSidebarOpen, onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header 
      className="md:hidden flex items-center justify-between px-4 py-4 border-b transition-colors"
      style={{
        backgroundColor: 'var(--sidebar-bg)',
        borderBottomColor: 'var(--border-subtle)',
      }}
    >
      <button 
        onClick={onToggleSidebar} 
        className="p-2 rounded-lg border min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation transition-colors"
        style={{
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      <span className="text-body-sm font-semibold tracking-tight uppercase" style={{ color: 'var(--text-primary)' }}>Cloud Secrets</span>
      <div 
        className="h-8 w-8 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--elevation-2)', color: 'var(--text-primary)' }}
      >
        {user?.displayName?.[0] || user?.email?.[0] || 'U'}
      </div>
    </header>
  );
};

