import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  /** Size of the logo icon (default: 'md') */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to show the text label (default: true) */
  showText?: boolean;
  /** Text to display (default: 'CloudSecrets') */
  text?: string;
  /** Whether the logo is clickable/linkable (default: true) */
  clickable?: boolean;
  /** Custom onClick handler (if provided, clickable is true) */
  onClick?: () => void;
  /** Custom className for the container */
  className?: string;
  /** Custom className for the text */
  textClassName?: string;
}

const sizeMap = {
  sm: { container: 'w-6 h-6', text: 'text-base' },
  md: { container: 'w-8 h-8', text: 'text-lg' },
  lg: { container: 'w-10 h-10', text: 'text-xl' },
  xl: { container: 'w-12 h-12', text: 'text-2xl' },
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  text = 'CloudSecrets',
  clickable = true,
  onClick,
  className = '',
  textClassName = '',
}) => {
  const sizeClasses = sizeMap[size];
  const isClickable = clickable || !!onClick;

  const logoContent = (
    <div 
      className={`flex flex-row items-center gap-2.5 transition-all duration-200 ${isClickable ? 'cursor-pointer group' : ''} ${className}`}
      onClick={onClick}
      style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
    >
      <img 
        src="/assets/logo.webp"
        alt="Cloud Secrets Manager Logo"
        className={`${sizeClasses.container} object-contain flex-shrink-0 transition-all duration-200 rounded-lg ${isClickable ? 'group-hover:scale-105' : ''}`}
        style={{ borderRadius: '10px' }}
      />
      {showText && (
        <span 
          className={`font-bold tracking-tight transition-colors duration-200 whitespace-nowrap ${isClickable ? 'group-hover:opacity-90' : ''} ${sizeClasses.text} ${textClassName}`}
          style={{ color: 'var(--text-primary)' }}
        >
          {text}
        </span>
      )}
    </div>
  );

  if (isClickable && !onClick) {
    return (
      <Link to="/home" className="inline-block">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};

