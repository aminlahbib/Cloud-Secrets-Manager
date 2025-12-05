import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Folder, Activity, Building2, Settings, Shield, LucideIcon } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

interface SidebarNavProps {
  onNavigate?: () => void;
  isPlatformAdmin?: boolean;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ onNavigate, isPlatformAdmin = false }) => {
  const location = useLocation();
  const { t } = useI18n();

  const isActiveLink = (href: string) => {
    if (href === '/home') return location.pathname === '/home' || location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const navigation: NavItem[] = [
    { name: t('nav.overview'), href: '/home', icon: LayoutDashboard },
    { name: t('nav.projects'), href: '/projects', icon: Folder },
    { name: t('nav.activityLogs'), href: '/activity', icon: Activity },
    { name: t('nav.teams'), href: '/teams', icon: Building2 },
    { name: t('nav.settings'), href: '/settings', icon: Settings },
  ];

  return (
    <div className="space-y-1">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = isActiveLink(item.href);
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={onNavigate}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
              ${isActive 
                ? 'text-accent-primary' 
                : 'text-theme-secondary hover:text-theme-primary hover:bg-elevation-1'
              }
            `}
            style={isActive ? {
              backgroundColor: 'var(--accent-primary-glow)',
            } : {}}
          >
            <Icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}

      {isPlatformAdmin && (
        <Link
          to="/admin"
          onClick={onNavigate}
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
            ${isActiveLink('/admin')
              ? 'text-accent-primary'
              : 'text-theme-secondary hover:text-theme-primary hover:bg-elevation-1'
            }
          `}
          style={isActiveLink('/admin') ? {
            backgroundColor: 'var(--accent-primary-glow)',
          } : {}}
        >
          <Shield className="h-5 w-5" />
          {t('nav.admin')}
        </Link>
      )}
    </div>
  );
};

