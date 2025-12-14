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
  
  // Store callbacks in refs to avoid recreating EventSource on every render
  const onNotificationRef = useRef(onNotification);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onNotificationRef.current = onNotification;
    onErrorRef.current = onError;
  }, [onNotification, onError]);

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
        onNotificationRef.current?.(notification);
      } catch (error) {
        console.error('Failed to parse notification from SSE:', error);
      }
    });

    eventSource.onerror = (error) => {
      setIsConnected(false);
      onErrorRef.current?.(error);
      // EventSource will automatically attempt to reconnect
    };

    eventSourceRef.current = eventSource;

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [enabled]); // Only depend on enabled, not callbacks

  return { isConnected };
};
