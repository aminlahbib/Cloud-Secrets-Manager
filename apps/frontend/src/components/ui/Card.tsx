import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '',
  onClick,
  hover = false,
  style
}) => {
  const hoverClass = hover ? 'cursor-pointer transition-all duration-150 hover:bg-card hover:shadow-theme-lg' : '';
  const clickClass = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`card ${hoverClass} ${clickClass} ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
};

