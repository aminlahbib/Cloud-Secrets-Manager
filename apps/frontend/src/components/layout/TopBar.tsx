import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, HelpCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeControls } from './ThemeControls';

export const TopBar: React.FC = () => {
  const { user, logout, isPlatformAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      const html = document.documentElement;
      const theme = html.getAttribute('data-theme') || '';
      setIsDark(theme.includes('dark'));
    };
    
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    
    return () => observer.disconnect();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement global search
      console.log('Searching for:', searchQuery);
    }
  };

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
        backgroundColor: isDark ? 'rgba(20, 20, 20, 0.85)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
        borderBottomWidth: '1px',
        boxShadow: isDark 
          ? '0 1px 2px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)' 
          : '0 1px 2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="flex items-center justify-between h-16 px-4 md:px-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-theme-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, secrets, or teams..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border transition-colors duration-200 bg-elevation-1 border-theme-subtle text-theme-primary placeholder-theme-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
            />
          </div>
        </form>

        {/* Right Side: Theme Controls, Notifications, Help, Profile */}
        <div className="flex items-center gap-3">
          {/* Theme Controls */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeControls />
          </div>

          {/* Notifications */}
          <button
            className="p-2 rounded-lg hover:bg-elevation-1 transition-colors text-theme-tertiary hover:text-theme-primary"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>

          {/* Help */}
          <button
            className="p-2 rounded-lg hover:bg-elevation-1 transition-colors text-theme-tertiary hover:text-theme-primary"
            title="Help"
          >
            <HelpCircle className="h-5 w-5" />
          </button>

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
                  <span className="text-xs text-theme-tertiary">ADMIN</span>
                )}
              </div>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                {userInitials}
              </div>
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
                        {user?.displayName || 'User'}
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
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setShowProfileDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-status-danger hover:bg-elevation-1 rounded transition-colors"
                    >
                      Sign Out
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

