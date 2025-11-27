import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default',
  className = '' 
}) => {
  const variantClasses: Record<string, string> = {
    default: 'bg-neutral-900 text-white',
    success: 'bg-neutral-200 text-neutral-900',
    warning: 'bg-neutral-100 text-neutral-800',
    danger: 'bg-neutral-800 text-white',
    info: 'bg-white text-neutral-800 border border-neutral-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

