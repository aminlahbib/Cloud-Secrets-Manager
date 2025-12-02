import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import type { AuditLog } from '../../types';

interface RecentActivityProps {
  activity: AuditLog[];
  isLoading: boolean;
  formatAction: (action: string) => string;
  getTimeAgo: (timestamp: string) => string;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activity,
  isLoading,
  formatAction,
  getTimeAgo,
}) => {
  return (
    <div className="card">
      <div className="p-3 border-b border-theme-subtle">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-theme-primary">Recent Activity</h2>
          <Link 
            to="/activity" 
            className="text-sm font-medium flex items-center transition-colors gap-1"
            style={{ color: 'var(--accent-primary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--accent-primary-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--accent-primary)';
            }}
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <div className="divide-y divide-theme-subtle">
        {isLoading ? (
          <div className="p-3 flex justify-center items-center">
            <Spinner size="sm" />
          </div>
        ) : activity.length === 0 ? (
          <div className="p-3 text-center text-theme-tertiary text-sm">
            No recent activity
          </div>
        ) : (
          activity.slice(0, 3).map((log: AuditLog) => {
            // Get user initials for avatar
            const userName = log.userDisplayName || log.userEmail || 'System';
            const userInitials = userName
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            
            return (
              <div 
                key={log.id} 
                className="p-3 transition-all duration-150 hover:bg-elevation-1"
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs flex-shrink-0"
                    style={{
                      backgroundColor: 'var(--elevation-1)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {userInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-theme-primary leading-relaxed">
                      <span className="font-medium">{userName}</span>
                      {' '}
                      <span>{formatAction(log.action)}</span>
                      {' '}
                      {log.resourceName && (
                        <span style={{ color: 'var(--accent-primary)' }}>
                          {log.resourceName}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-theme-tertiary mt-1">
                      {getTimeAgo(log.createdAt || '')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

