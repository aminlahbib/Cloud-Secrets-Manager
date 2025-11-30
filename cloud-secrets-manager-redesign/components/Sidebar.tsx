import React from 'react';
import { 
  LayoutGrid, 
  FolderClosed, 
  Activity, 
  Users, 
  Settings, 
  LogOut, 
  Shield,
  Plus
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'home', label: 'Overview', icon: LayoutGrid },
    { id: 'projects', label: 'Projects', icon: FolderClosed },
    { id: 'activity', label: 'Activity Logs', icon: Activity },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full sticky top-0 z-30">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Shield className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">CloudSecrets</span>
        </div>
      </div>

      {/* Workspace Selector */}
      <div className="p-4">
        <button className="w-full p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between transition-colors text-left">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-brand-600">
                MW
             </div>
             <div>
                <div className="text-xs text-slate-500 font-medium">Workspace</div>
                <div className="text-sm font-semibold text-slate-900 leading-none">My Workflow</div>
             </div>
          </div>
          <Settings className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === item.id
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <item.icon 
              className={`w-4.5 h-4.5 ${activeTab === item.id ? 'text-brand-600' : 'text-slate-400'}`} 
            />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        <button className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          New Secret
        </button>
        
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;