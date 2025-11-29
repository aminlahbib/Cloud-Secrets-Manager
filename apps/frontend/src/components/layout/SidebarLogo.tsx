import React from 'react';
import { Link } from 'react-router-dom';

export const SidebarLogo: React.FC = () => {
  return (
    <Link to="/home" className="flex items-center space-x-3">
      <img 
        src="/assets/csm-2.webp" 
        alt="Cloud Secrets Manager Logo" 
        className="h-12 w-12 rounded-2xl object-contain"
        onError={(e) => {
          // Fallback to text logo if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = 'flex';
        }}
      />
      <div 
        className="h-12 w-12 rounded-2xl flex items-center justify-center text-xl font-semibold hidden"
        style={{ backgroundColor: 'var(--elevation-1)', color: 'var(--text-primary)' }}
      >
        CSM
      </div>
      <span className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Cloud Secrets</span>
    </Link>
  );
};

