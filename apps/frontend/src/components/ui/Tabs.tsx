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
      <div className="bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-[rgba(255,255,255,0.05)] rounded-t-xl px-6 pt-2">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleChange(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 transition-all duration-300 min-h-[44px] touch-manipulation
                  ${isActive
                    ? 'border-orange-500 dark:border-orange-400 text-neutral-900 dark:text-white'
                    : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-300 dark:hover:border-orange-500/30'
                  }
                `}
              >
                {Icon && <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-neutral-500'}`} />}
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-300
                    ${isActive 
                      ? 'bg-orange-500 dark:bg-orange-400 text-white dark:text-neutral-900' 
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }
                  `}>
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
