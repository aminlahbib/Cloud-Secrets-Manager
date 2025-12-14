import { useEffect, useRef, useState } from 'react';
import { notificationsService, type NotificationDto } from '../services/notifications';

export interface UseNotificationStreamOptions {
  enabled?: boolean;
  onNotification?: (notification: NotificationDto) => void;
  onError?: (error: Event) => void;
}

export const useNotificationStream = (options: UseNotificationStreamOptions = {}) => {
  const { enabled = true, onNotification, onError } = options;
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const url = notificationsService.getStreamUrl();
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'connected') {
          return; // Ignore connection confirmation
        }
      } catch (e) {
        // Not JSON, ignore
      }
    };

    eventSource.addEventListener('notification', (event: MessageEvent) => {
      try {
        const notification: NotificationDto = JSON.parse(event.data);
        onNotification?.(notification);
      } catch (error) {
        console.error('Failed to parse notification from SSE:', error);
      }
    });

    eventSource.onerror = (error) => {
      setIsConnected(false);
      onError?.(error);
      // EventSource will automatically attempt to reconnect
    };

    eventSourceRef.current = eventSource;

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [enabled, onNotification, onError]);

  return { isConnected };
};
