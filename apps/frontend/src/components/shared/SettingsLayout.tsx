import React from 'react';

export interface SettingsSection {
  id: string;
  title: string;
  icon?: React.ReactNode;
}

interface SettingsLayoutProps {
  sections: SettingsSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  children: React.ReactNode;
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  sections,
  activeSection,
  onSectionChange,
  children,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-0">
      {/* Left Sidebar */}
      <div className="flex-shrink-0 w-full md:w-64">
        <div 
          className="rounded-2xl p-4 space-y-1"
          style={{ backgroundColor: 'var(--tab-bg)' }}
        >
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'font-medium'
                    : 'text-theme-secondary hover:text-theme-primary'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--accent-primary-glow)' : 'transparent',
                  color: isActive ? 'var(--accent-primary)' : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--elevation-2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  {section.icon && (
                    <span className="flex-shrink-0" style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
                      {section.icon}
                    </span>
                  )}
                  <span className="text-body-sm">{section.title}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 min-w-0 overflow-auto">
        {children}
      </div>
    </div>
  );
};

