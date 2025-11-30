import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
  content?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange?: (tabId: string) => void;
  onTabChange?: (tabId: string) => void; // Legacy prop for backwards compatibility
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, onTabChange }) => {
  const handleChange = (tabId: string) => {
    if (onChange) onChange(tabId);
    if (onTabChange) onTabChange(tabId);
  };

  // Check if we should render content (legacy mode)
  const hasContent = tabs.some(tab => tab.content);

  return (
    <div>
      {/* Tab Headers */}
      <div className="tab-container">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleChange(tab.id)}
                className={`tab-button ${isActive ? 'tab-button-active' : 'border-transparent'} ${isActive ? 'text-theme-primary' : 'text-theme-secondary'}`}
                style={{
                  borderBottomColor: isActive ? 'var(--tab-active-border)' : 'transparent',
                }}
              >
                {Icon && (
                  <Icon 
                    className={`h-4 w-4 transition-colors duration-300 ${isActive ? 'text-theme-primary' : 'text-theme-secondary'}`}
                  />
                )}
                {tab.label}
                {tab.count !== undefined && (
                  <span 
                    className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-300 border ${isActive ? 'border-accent-primary text-accent-primary bg-accent-primary-glow' : 'border-theme-subtle bg-elevation-2 text-theme-secondary'}`}
                    style={isActive ? { borderColor: 'var(--accent-primary)' } : {}}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content (only if tabs have content) */}
      {hasContent && (
        <div className="mt-6">
          {tabs.find((tab) => tab.id === activeTab)?.content}
        </div>
      )}
    </div>
  );
};
