import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'rounded';
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded',
  };
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={clsx(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        ...style,
        backgroundColor: 'var(--elevation-1)',
      }}
    />
  );
};

// Pre-built skeleton components
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div 
    className={clsx('rounded-lg p-6', className)}
    style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}
  >
    <Skeleton variant="text" width="60%" height={24} className="mb-4" />
    <Skeleton variant="text" width="100%" height={16} className="mb-2" />
    <Skeleton variant="text" width="80%" height={16} />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}>
    <div className="px-6 py-3 border-b" style={{ backgroundColor: 'var(--table-header-bg)', borderBottomColor: 'var(--border-subtle)' }}>
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="text" width="20%" height={16} />
        ))}
      </div>
    </div>
    <div style={{ borderTopColor: 'var(--border-subtle)' }}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4 flex gap-4" style={{ borderTop: rowIndex > 0 ? '1px solid var(--border-subtle)' : 'none' }}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" width="20%" height={16} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonList: React.FC<{ items?: number }> = ({ items = 5 }) => (
  <div className="space-y-4">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="rounded-lg p-4" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" height={16} />
            <Skeleton variant="text" width="60%" height={14} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonStats: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="rounded-lg p-6" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}>
        <Skeleton variant="text" width="50%" height={14} className="mb-2" />
        <Skeleton variant="text" width="30%" height={32} />
      </div>
    ))}
  </div>
);

