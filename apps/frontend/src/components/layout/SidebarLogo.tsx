import React from 'react';
import { Link } from 'react-router-dom';

export const SidebarLogo: React.FC = () => {
  return (
    <Link 
      to="/home" 
      className="flex items-center space-x-3 group mb-8 pb-6 border-b transition-all duration-200"
      style={{ 
        borderBottomColor: 'var(--border-subtle)',
      }}
    >
      <div 
        className="relative h-12 w-12 rounded-2xl overflow-hidden transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg"
        style={{
          backgroundColor: 'var(--elevation-2)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <img 
          src="/assets/csm-2.webp" 
          alt="Cloud Secrets Manager Logo" 
          className="h-full w-full object-contain p-2"
          onError={(e) => {
            // Fallback to text logo if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        <div 
          className="h-full w-full rounded-2xl flex items-center justify-center text-xl font-bold hidden"
          style={{ 
            backgroundColor: 'var(--accent-primary-glow)', 
            color: 'var(--accent-primary)',
          }}
        >
          CSM
        </div>
      </div>
      <div className="flex flex-col">
        <span 
          className="text-lg font-bold tracking-tight transition-colors duration-200 group-hover:opacity-90" 
          style={{ color: 'var(--text-primary)' }}
        >
          Cloud Secrets
        </span>
        <span 
          className="text-xs font-medium tracking-wider uppercase transition-colors duration-200" 
          style={{ color: 'var(--text-tertiary)' }}
        >
          Manager
        </span>
      </div>
    </Link>
  );
};

