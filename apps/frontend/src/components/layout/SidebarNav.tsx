import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Folder, Activity, Users, Settings, Shield, LucideIcon } from 'lucide-react';

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

  const isActiveLink = (href: string) => {
    if (href === '/home') return location.pathname === '/home' || location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const mainNavigation: NavItem[] = [
    { name: 'Home', href: '/home', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: Folder },
    { name: 'Activity', href: '/activity', icon: Activity },
  ];

  const bottomNavigation: NavItem[] = [
    { name: 'Teams', href: '/teams', icon: Users, badge: 'Soon' },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      <div className="mt-10 space-y-1">
        {mainNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveLink(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onNavigate}
              className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="mt-10 space-y-2">
        {bottomNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveLink(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onNavigate}
              className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <Icon className="h-5 w-5" />
              {item.name}
              {item.badge && (
                <span className="ml-auto text-caption uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{item.badge}</span>
              )}
            </Link>
          );
        })}

        {isPlatformAdmin && (
          <Link
            to="/admin"
            onClick={onNavigate}
            className={`nav-item ${isActiveLink('/admin') ? 'nav-item-active' : ''}`}
          >
            <Shield className="h-5 w-5" />
            Admin
          </Link>
        )}
      </div>
    </>
  );
};

