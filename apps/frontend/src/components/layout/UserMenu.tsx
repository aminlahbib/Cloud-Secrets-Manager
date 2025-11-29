import React from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface UserMenuProps {
  onLogout: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onLogout }) => {
  const { user } = useAuth();

  return (
    <>
      <div className="flex items-center space-x-3">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.displayName || user.email} className="h-10 w-10 rounded-full" />
        ) : (
          <div 
            className="h-10 w-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--elevation-2)' }}
          >
            <User className="h-5 w-5" style={{ color: 'var(--text-primary)' }} />
          </div>
        )}
        <div>
          <p className="text-body-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user?.displayName || user?.email?.split('@')[0]}</p>
          <p className="text-caption" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="mt-4 w-full flex items-center justify-center rounded-xl border px-3 py-2 text-body-sm font-medium transition-all duration-150 hover:bg-elevation-2"
        style={{
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-secondary)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-default)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </button>
    </>
  );
};

