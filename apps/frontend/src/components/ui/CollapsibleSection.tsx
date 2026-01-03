import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  description,
  icon,
  defaultOpen = true,
  children,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-lg border border-theme-subtle bg-card overflow-hidden ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-elevation-1 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          {icon && (
            <div className="flex-shrink-0">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-theme-primary">{title}</h3>
            {description && (
              <p className="text-xs text-theme-tertiary mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 ml-4">
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-theme-tertiary" />
          ) : (
            <ChevronDown className="h-5 w-5 text-theme-tertiary" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="p-4 border-t border-theme-subtle">
          {children}
        </div>
      )}
    </div>
  );
};

