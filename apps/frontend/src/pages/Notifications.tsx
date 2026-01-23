import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Key, 
  UserPlus, 
  Shield, 
  User, 
  AlertCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { notificationsService } from '../services/notifications';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Pagination } from '../components/ui/Pagination';
import { Badge } from '../components/ui/Badge';
import type { NotificationFilters } from '../services/notifications';

const NOTIFICATION_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'PROJECT_INVITATION', label: 'Project Invitations' },
  { value: 'TEAM_INVITATION', label: 'Team Invitations' },
  { value: 'SECRET_EXPIRING_SOON', label: 'Secret Expiration' },
  { value: 'ROLE_CHANGED', label: 'Role Changes' },
  { value: 'SECURITY_ALERT', label: 'Security Alerts' },
];

// Helper function to format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }
  
  return date.toLocaleDateString();
};

// Get icon and color for notification type
const getNotificationTypeInfo = (type: string) => {
  switch (type) {
    case 'SECRET_EXPIRING_SOON':
      return {
        icon: Key,
        color: 'var(--status-warning)',
        bgColor: 'var(--status-warning-bg)',
        label: 'Secret Expiration'
      };
    case 'PROJECT_INVITATION':
    case 'TEAM_INVITATION':
      return {
        icon: UserPlus,
        color: 'var(--status-info)',
        bgColor: 'var(--status-info-bg)',
        label: type === 'PROJECT_INVITATION' ? 'Project Invitation' : 'Team Invitation'
      };
    case 'ROLE_CHANGED':
      return {
        icon: User,
        color: 'var(--status-info)',
        bgColor: 'var(--status-info-bg)',
        label: 'Role Change'
      };
    case 'SECURITY_ALERT':
      return {
        icon: Shield,
        color: 'var(--status-danger)',
        bgColor: 'var(--status-danger-bg)',
        label: 'Security Alert'
      };
    default:
      return {
        icon: Bell,
        color: 'var(--text-secondary)',
        bgColor: 'var(--elevation-1)',
        label: 'Notification'
      };
  }
};

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id;
  const [filters, setFilters] = useState<NotificationFilters>({
    unreadOnly: false,
    page: 0,
    size: 50,
  });
  const [showFilters, setShowFilters] = useState(false);
  const {
    notificationsQuery,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    totalPages,
    currentPage,
  } = useNotifications(userId, filters);

  const handleFilterChange = useCallback((key: keyof NotificationFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 0 }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary">Notifications</h1>
          <p className="text-body-sm text-theme-secondary mt-1">
            Review important updates about projects, secrets, and teams.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={() => userId && markAllAsRead()}>
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-1">
                Notification Type
              </label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                className="w-full px-3 py-2 rounded-lg border bg-elevation-1 border-theme-subtle text-theme-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                {NOTIFICATION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-1">
                Start Date
              </label>
              <Input
                type="datetime-local"
                value={filters.startDate ? new Date(filters.startDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-1">
                End Date
              </label>
              <Input
                type="datetime-local"
                value={filters.endDate ? new Date(filters.endDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.unreadOnly || false}
                  onChange={(e) => handleFilterChange('unreadOnly', e.target.checked)}
                  className="w-4 h-4 rounded border-theme-subtle"
                />
                <span className="text-sm text-theme-primary">Unread only</span>
              </label>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        {notificationsQuery.isLoading ? (
          <div className="px-6 py-10 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-primary)' }}></div>
              <p className="text-sm text-theme-secondary">Loading notifications...</p>
            </div>
          </div>
        ) : notificationsQuery.isError ? (
          <div className="px-6 py-10 text-center">
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="h-8 w-8" style={{ color: 'var(--status-danger)' }} />
              <p className="text-sm font-medium text-theme-primary">Failed to load notifications</p>
              <p className="text-xs text-theme-secondary">
                {notificationsQuery.error instanceof Error 
                  ? notificationsQuery.error.message 
                  : 'An unexpected error occurred'}
              </p>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => notificationsQuery.refetch()}
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <Bell className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-sm font-medium text-theme-primary mb-1">No notifications</p>
            <p className="text-xs text-theme-secondary">
              {filters.unreadOnly 
                ? "You're all caught up! No unread notifications." 
                : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-theme-subtle">
            {notifications.map((n) => {
              const typeInfo = getNotificationTypeInfo(n.type);
              const Icon = typeInfo.icon;
              
              return (
                <li
                  key={n.id}
                  className="px-6 py-4 hover:bg-elevation-1 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Notification Type Icon */}
                    <div 
                      className="p-2 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: typeInfo.bgColor }}
                    >
                      <Icon className="h-4 w-4" style={{ color: typeInfo.color }} />
                    </div>
                    
                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-theme-primary">{n.title}</p>
                            {!n.readAt && (
                              <span className="h-2 w-2 rounded-full bg-accent-primary flex-shrink-0" />
                            )}
                          </div>
                          {n.body && (
                            <p className="text-xs text-theme-secondary line-clamp-2">{n.body}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Metadata: Type badge and time */}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="default" className="text-xs">
                          {typeInfo.label}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          <Clock className="h-3 w-3" />
                          <span>{formatRelativeTime(n.createdAt)}</span>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      {(() => {
                        const actions = n.metadata?.actions;
                        if (actions && Array.isArray(actions) && actions.length > 0) {
                          const actionArray = actions as string[];
                          return (
                            <div className="flex gap-2 mt-3">
                              {actionArray.includes('VIEW_PROJECT') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await markAsRead(n.id);
                                    await notificationsService.trackAction(n.id, 'VIEW_PROJECT');
                                    if (n.metadata?.deepLink) {
                                      navigate(n.metadata.deepLink as string);
                                    }
                                  }}
                                >
                                  View
                                </Button>
                              )}
                              {actionArray.includes('ROTATE_SECRET') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await markAsRead(n.id);
                                    await notificationsService.trackAction(n.id, 'ROTATE_SECRET');
                                    if (n.metadata?.deepLink) {
                                      navigate(n.metadata.deepLink as string + '/rotate');
                                    }
                                  }}
                                >
                                  Rotate
                                </Button>
                              )}
                              {actionArray.includes('ACCEPT_INVITATION') && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await markAsRead(n.id);
                                    await notificationsService.trackAction(n.id, 'ACCEPT_INVITATION');
                                    if (n.metadata?.deepLink) {
                                      navigate(n.metadata.deepLink as string);
                                    }
                                  }}
                                >
                                  Accept
                                </Button>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    
                    {/* Click to mark as read */}
                    <button
                      onClick={async () => {
                        await markAsRead(n.id);
                        await notificationsService.trackOpen(n.id);
                        if (n.metadata?.deepLink) {
                          navigate(n.metadata.deepLink as string);
                        }
                      }}
                      className="flex-shrink-0 p-1 rounded hover:bg-elevation-2 transition-colors"
                      title="Mark as read"
                    >
                      {n.readAt ? (
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--text-tertiary)' }} />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-accent-primary" />
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};


