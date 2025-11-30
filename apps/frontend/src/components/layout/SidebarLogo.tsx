import React from 'react';
import { Link } from 'react-router-dom';

export const SidebarLogo: React.FC = () => {
  return (
    <Link 
      to="/home" 
      className="flex items-center space-x-3 group transition-all duration-200"
    >
      <div 
        className="relative h-10 w-10 rounded-lg overflow-hidden transition-all duration-200 group-hover:scale-105"
        style={{
          backgroundColor: 'var(--accent-primary-glow)',
        }}
      >
        <img 
          src="/assets/csm-2.webp" 
          alt="Cloud Secrets Manager Logo" 
          className="h-full w-full object-contain p-1.5"
          onError={(e) => {
            // Fallback to text logo if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        <div 
          className="h-full w-full rounded-lg flex items-center justify-center text-sm font-bold hidden"
          style={{ 
            backgroundColor: 'var(--accent-primary-glow)', 
            color: 'var(--accent-primary)',
          }}
        >
          CS
        </div>
      </div>
      <span 
        className="text-lg font-bold tracking-tight transition-colors duration-200 group-hover:opacity-90" 
        style={{ color: 'var(--text-primary)' }}
      >
        CloudSecrets
      </span>
    </Link>
  );
};

