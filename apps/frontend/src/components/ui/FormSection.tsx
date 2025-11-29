import React from 'react';
import { Card } from './Card';

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  variant?: 'default' | 'card';
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className = '',
  actions,
  variant = 'default',
}) => {
  if (variant === 'card') {
    return (
      <Card className={`rounded-3xl ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-theme-primary">{title}</h2>
            {description && (
              <p className="text-body-sm mt-1 text-theme-secondary">{description}</p>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
        <div className="space-y-5">{children}</div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h2 className="text-h3 font-semibold text-theme-primary">{title}</h2>
        {description && (
          <p className="text-body-sm mt-1 text-theme-secondary">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
      {actions && <div className="flex justify-end">{actions}</div>}
    </div>
  );
};

