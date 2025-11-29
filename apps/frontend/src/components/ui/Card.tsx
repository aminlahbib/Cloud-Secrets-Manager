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
  const hoverClass = hover ? 'cursor-pointer transition-all duration-150' : '';
  const clickClass = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`card ${hoverClass} ${clickClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

