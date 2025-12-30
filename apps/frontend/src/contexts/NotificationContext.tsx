import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // Auto-dismiss after milliseconds (0 = no auto-dismiss)
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000, // Default 5 seconds
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Auto-dismiss if duration is set
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, newNotification.duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, showNotification, removeNotification, clearAll }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div 
      className="fixed top-20 right-4 z-[9999] space-y-3 max-w-md w-full sm:w-auto"
      style={{
        pointerEvents: 'auto',
      }}
    >
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onDismiss: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onDismiss }) => {
  const iconStyles = {
    success: { color: 'var(--status-success)' },
    error: { color: 'var(--status-danger)' },
    warning: { color: 'var(--status-warning)' },
    info: { color: 'var(--status-info)' },
  };

  const borderStyles = {
    success: { borderLeftColor: 'var(--status-success)' },
    error: { borderLeftColor: 'var(--status-danger)' },
    warning: { borderLeftColor: 'var(--status-warning)' },
    info: { borderLeftColor: 'var(--status-info)' },
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5" style={iconStyles.success} />,
    error: <AlertCircle className="h-5 w-5" style={iconStyles.error} />,
    warning: <AlertTriangle className="h-5 w-5" style={iconStyles.warning} />,
    info: <Info className="h-5 w-5" style={iconStyles.info} />,
  };

  return (
    <div
      className="border-l-4 rounded-lg shadow-lg p-4 flex items-start gap-3 transition-all duration-300 ease-in-out animate-slide-in"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--border-subtle)',
        borderLeftWidth: '4px',
        ...borderStyles[notification.type],
        boxShadow: 'var(--shadow-lg)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div 
        className="flex-shrink-0 mt-0.5 p-1.5 rounded-lg"
        style={{
          backgroundColor: notification.type === 'success' ? 'var(--status-success-bg)' :
                           notification.type === 'error' ? 'var(--status-danger-bg)' :
                           notification.type === 'warning' ? 'var(--status-warning-bg)' :
                           'var(--status-info-bg)',
        }}
      >
        {icons[notification.type]}
      </div>
      <div className="flex-1 min-w-0">
        <h4 
          className="text-sm font-semibold mb-0.5"
          style={{ color: 'var(--text-primary)' }}
        >
          {notification.title}
        </h4>
        {notification.message && (
          <p 
            className="text-sm leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {notification.message}
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-1 rounded-md transition-all duration-200 hover:bg-elevation-2"
        style={{ color: 'var(--text-tertiary)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.backgroundColor = 'var(--elevation-2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-tertiary)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

