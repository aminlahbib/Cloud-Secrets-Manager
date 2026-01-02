import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { ThemeControls } from './ThemeControls';
import { LanguageSelector } from '../ui/LanguageSelector';

export const TopBar: React.FC = () => {
  const { user, logout, isPlatformAdmin } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Reset avatar error when user or avatarUrl changes
  React.useEffect(() => {
    setAvatarError(false);
  }, [user?.avatarUrl]);

  const userInitials = user?.displayName
    ? user.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0].toUpperCase() || 'U';

  return (
    <header
      className="sticky top-0 z-50 w-full border-b transition-colors duration-200"
      style={{
        backgroundColor: 'var(--topbar-bg)',
        borderBottomColor: 'var(--topbar-border)',
        borderBottomWidth: '1px',
        boxShadow: 'var(--topbar-shadow)',
      }}
    >
      <div className="flex items-center justify-end h-16 px-4 md:px-8">
        {/* Right Side: Theme Controls, Notifications, Help, Profile */}
        <div className="flex items-center gap-3">
          {/* Theme Controls */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeControls />
          </div>

          {/* Help */}
          <button
            className="p-2 rounded-lg hover:bg-elevation-1 transition-colors text-theme-tertiary hover:text-theme-primary"
            title={t('topbar.help')}
          >
            <HelpCircle className="h-5 w-5" />
          </button>

          {/* Language Selector */}
          <LanguageSelector iconOnly={true} />

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-elevation-1 transition-colors"
            >
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-theme-primary">
                  {user?.displayName || user?.email?.split('@')[0]}
                </span>
                {isPlatformAdmin && (
                  <span className="text-xs text-theme-tertiary">{t('topbar.admin')}</span>
                )}
              </div>
              {user?.avatarUrl && !avatarError ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.displayName || user.email}
                  className="w-8 h-8 rounded-full object-cover border border-theme-subtle"
                  onError={() => {
                    // Fallback to initials if image fails to load
                    setAvatarError(true);
                  }}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  {userInitials}
                </div>
              )}
              <ChevronDown className="h-4 w-4 text-theme-tertiary" />
            </button>

            {/* Dropdown Menu */}
            {showProfileDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowProfileDropdown(false)}
                />
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg border z-20 dropdown-glass"
                  style={{
                    borderWidth: '0.5px',
                  }}
                >
                  <div className="p-2">
                    <div className="px-3 py-2 border-b border-theme-subtle mb-2">
                      <p className="text-sm font-medium text-theme-primary">
                        {user?.displayName || t('topbar.user')}
                      </p>
                      <p className="text-xs text-theme-secondary truncate">
                        {user?.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigate('/settings');
                        setShowProfileDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-theme-primary hover:bg-elevation-1 rounded transition-colors"
                    >
                      {t('topbar.settings')}
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setShowProfileDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-status-danger hover:bg-elevation-1 rounded transition-colors"
                    >
                      {t('topbar.signOut')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

