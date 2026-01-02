import React from 'react';
import { Card } from '../components/ui/Card';

/**
 * Notifications page - placeholder for future invite notifications
 * The simple notification service will provide invite notifications via REST API
 */
export const NotificationsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-theme-primary">Notifications</h1>
      </div>

      <Card>
        <div className="p-6 text-center text-theme-secondary">
          <p>Invite notifications will be available here once the simple notification service is implemented.</p>
        </div>
      </Card>
    </div>
  );
};
