import React from 'react';
import { FormSection } from '../../ui/FormSection';

interface ProjectOverviewSectionProps {
  metaPairs: Array<{ label: string; value: string | number }>;
  isArchived: boolean;
}

export const ProjectOverviewSection: React.FC<ProjectOverviewSectionProps> = ({
  metaPairs,
  isArchived,
}) => {
  return (
    <div className="tab-content-container">
      <FormSection
        variant="default"
        title="Project Overview"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metaPairs.map((item) => (
            <div key={item.label} className="rounded-2xl border border-theme-subtle p-4 bg-elevation-1">
              <p className="text-xs uppercase tracking-[0.2em] text-theme-tertiary">{item.label}</p>
              <p className="mt-2 text-lg font-semibold text-theme-primary">{item.value}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-theme-subtle p-4 bg-elevation-1">
            <p className="text-xs uppercase tracking-[0.2em] text-theme-tertiary">Status</p>
            <p className="mt-2 text-lg font-semibold text-theme-primary">
              {isArchived ? 'Archived' : 'Active'}
            </p>
          </div>
        </div>
      </FormSection>
    </div>
  );
};

