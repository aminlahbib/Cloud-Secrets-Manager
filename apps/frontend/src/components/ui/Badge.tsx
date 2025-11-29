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
  const badgeClasses: Record<string, string> = {
    default: 'badge badge-default',
    success: 'badge badge-success',
    warning: 'badge badge-warning',
    danger: 'badge badge-danger',
    info: 'badge badge-primary',
  };

  return (
    <span className={`${badgeClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

