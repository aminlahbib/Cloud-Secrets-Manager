import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications(userId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-primary">Notifications</h1>
          <p className="text-body-sm text-theme-secondary mt-1">
            Review important updates about projects, secrets, and teams.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={() => userId && markAllAsRead()}>
            Mark all as read
          </Button>
        )}
      </div>

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
                className="px-6 py-4 hover:bg-elevation-1 cursor-pointer"
                onClick={async () => {
                  await markAsRead(n.id);
                  // TODO: navigate using metadata.deepLink when available
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-theme-primary">{n.title}</p>
                    {n.body && (
                      <p className="mt-1 text-xs text-theme-secondary">{n.body}</p>
                    )}
                  </div>
                  {!n.readAt && (
                    <span className="mt-1 h-2 w-2 rounded-full bg-accent-primary flex-shrink-0" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};


