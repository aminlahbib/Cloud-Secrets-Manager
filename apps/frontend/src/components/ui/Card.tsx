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
  const hoverClass = hover ? 'hover:shadow-lg hover:border-neutral-300 dark:hover:border-[rgba(255,255,255,0.1)] dark:hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.4)] cursor-pointer transition-all duration-300' : '';
  const clickClass = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`bg-white dark:bg-[#1a1a1a] rounded-2xl border border-neutral-200 dark:border-[rgba(255,255,255,0.05)] shadow-sm dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)] transition-all duration-300 ${hoverClass} ${clickClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

