import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight } from 'lucide-react';
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
    <div className="lg:col-span-1 card">
      <div className="padding-card border-b border-theme-subtle">
        <div className="flex items-center justify-between">
          <h2 className="text-h3 font-semibold text-theme-primary">Recent Activity</h2>
          <Link 
            to="/activity" 
            className="text-body-sm font-medium flex items-center transition-all duration-150 hover:scale-105 text-accent-primary"
          >
            View all <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
      <div className="divide-y divide-theme-subtle">
        {isLoading ? (
          <div className="padding-card flex justify-center">
            <Spinner size="sm" />
          </div>
        ) : activity.length === 0 ? (
          <div className="padding-card text-center text-theme-tertiary text-body-sm">
            No recent activity
          </div>
        ) : (
          activity.map((log: AuditLog) => (
            <div 
              key={log.id} 
              className="p-4 transition-all duration-150 hover:bg-elevation-3"
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded transition-all duration-150 bg-elevation-1">
                  <Activity className="h-4 w-4 text-theme-tertiary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-medium text-theme-primary truncate">
                    {formatAction(log.action)}
                  </p>
                  <p className="text-caption text-theme-tertiary mt-0.5">
                    {log.resourceName || log.resourceId || 'System'}
                  </p>
                </div>
                <span className="text-caption text-theme-tertiary whitespace-nowrap">
                  {getTimeAgo(log.createdAt || '')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

