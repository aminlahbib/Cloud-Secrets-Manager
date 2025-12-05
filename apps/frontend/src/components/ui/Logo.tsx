import React from 'react';
import { Shield } from 'lucide-react';
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
  sm: { icon: 'w-6 h-6', container: 'w-6 h-6', text: 'text-base' },
  md: { icon: 'w-5 h-5', container: 'w-8 h-8', text: 'text-lg' },
  lg: { icon: 'w-6 h-6', container: 'w-10 h-10', text: 'text-xl' },
  xl: { icon: 'w-8 h-8', container: 'w-12 h-12', text: 'text-2xl' },
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
      <div 
        className={`${sizeClasses.container} rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${isClickable ? 'group-hover:scale-105' : ''}`}
        style={{ 
          backgroundColor: 'var(--accent-primary)', 
          color: 'var(--text-inverse)' 
        }}
      >
        <Shield className={`${sizeClasses.icon} fill-current`} />
      </div>
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

