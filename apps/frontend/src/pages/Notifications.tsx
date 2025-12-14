import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Pagination } from '../components/ui/Pagination';
import type { NotificationFilters } from '../services/notifications';

const NOTIFICATION_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'PROJECT_INVITATION', label: 'Project Invitations' },
  { value: 'TEAM_INVITATION', label: 'Team Invitations' },
  { value: 'SECRET_EXPIRING_SOON', label: 'Secret Expiration' },
  { value: 'ROLE_CHANGED', label: 'Role Changes' },
  { value: 'SECURITY_ALERT', label: 'Security Alerts' },
];

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
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    totalPages,
    currentPage,
    pageSize,
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
        {notifications.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-theme-secondary">
            You don&apos;t have any notifications yet.
          </div>
        ) : (
          <ul className="divide-y divide-theme-subtle">
            {notifications.map((n) => (
              <li
                key={n.id}
                className="px-6 py-4 hover:bg-elevation-1"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 cursor-pointer" onClick={async () => {
                    await markAsRead(n.id);
                    await notificationsService.trackOpen(n.id);
                    if (n.metadata?.deepLink) {
                      navigate(n.metadata.deepLink as string);
                    }
                  }}>
                    <p className="text-sm font-medium text-theme-primary">{n.title}</p>
                    {n.body && (
                      <p className="mt-1 text-xs text-theme-secondary">{n.body}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {n.metadata?.actions && Array.isArray(n.metadata.actions) && (
                      <div className="flex gap-1">
                        {(n.metadata.actions as string[]).includes('VIEW_PROJECT') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await notificationsService.trackAction(n.id, 'VIEW_PROJECT');
                              if (n.metadata?.deepLink) {
                                navigate(n.metadata.deepLink as string);
                              }
                            }}
                          >
                            View
                          </Button>
                        )}
                        {(n.metadata.actions as string[]).includes('ROTATE_SECRET') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await notificationsService.trackAction(n.id, 'ROTATE_SECRET');
                              if (n.metadata?.deepLink) {
                                navigate(n.metadata.deepLink as string + '/rotate');
                              }
                            }}
                          >
                            Rotate
                          </Button>
                        )}
                        {(n.metadata.actions as string[]).includes('ACCEPT_INVITATION') && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation();
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
                    )}
                    {!n.readAt && (
                      <span className="mt-1 h-2 w-2 rounded-full bg-accent-primary flex-shrink-0" />
                    )}
                  </div>
                </div>
              </li>
            ))}
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


