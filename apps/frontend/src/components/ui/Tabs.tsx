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
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleChange(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 transition-colors min-h-[44px] touch-manipulation
                  ${isActive
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300'
                  }
                `}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-medium
                    ${isActive 
                      ? 'bg-neutral-900 text-white' 
                      : 'bg-neutral-100 text-neutral-600'
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
