import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '',
  onClick,
  hover = false 
}) => {
  const hoverClass = hover ? 'hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600 cursor-pointer transition-all' : '';
  const clickClass = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm ${hoverClass} ${clickClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

