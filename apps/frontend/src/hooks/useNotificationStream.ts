import { useEffect, useRef, useState, useCallback } from 'react';
import { notificationsService, type NotificationDto } from '../services/notifications';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface UseNotificationStreamOptions {
  enabled?: boolean;
  onNotification?: (notification: NotificationDto) => void;
  onError?: (error: Event) => void;
  onStatusChange?: (status: ConnectionStatus) => void;
  retryDelay?: number; // Delay between retry attempts in ms
  maxRetries?: number; // Maximum number of retry attempts
}

export const useNotificationStream = (options: UseNotificationStreamOptions = {}) => {
  const { 
    enabled = true, 
    onNotification, 
    onError,
    onStatusChange,
    retryDelay = 3000,
    maxRetries = 5
  } = options;
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [retryCount, setRetryCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Store callbacks in refs to avoid recreating EventSource on every render
  const onNotificationRef = useRef(onNotification);
  const onErrorRef = useRef(onError);
  const onStatusChangeRef = useRef(onStatusChange);

  // Update refs when callbacks change
  useEffect(() => {
    onNotificationRef.current = onNotification;
    onErrorRef.current = onError;
    onStatusChangeRef.current = onStatusChange;
  }, [onNotification, onError, onStatusChange]);

  const updateStatus = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    onStatusChangeRef.current?.(status);
  }, []);

  const connect = useCallback(() => {
    if (!enabled) {
      return;
    }

    // Clear any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Clear any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (retryCount >= maxRetries) {
      console.error(`SSE connection failed after ${maxRetries} retries. Giving up.`);
      updateStatus('error');
      return;
    }

    try {
      updateStatus('connecting');
      const url = notificationsService.getStreamUrl();
      
      if (!url) {
        console.error('Notification service URL is not configured');
        updateStatus('error');
        return;
      }

      console.log(`Connecting to SSE stream: ${url.replace(/token=[^&]*/, 'token=***')}`);
      const eventSource = new EventSource(url);

      eventSource.onopen = () => {
        console.log('SSE connection established');
        setRetryCount(0);
        updateStatus('connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status === 'connected') {
            console.log('SSE connection confirmed');
            return; // Ignore connection confirmation
          }
        } catch (e) {
          // Not JSON, ignore
        }
      };

      eventSource.addEventListener('notification', (event: MessageEvent) => {
        try {
          const notification: NotificationDto = JSON.parse(event.data);
          console.debug('Received notification via SSE:', notification.type);
          onNotificationRef.current?.(notification);
        } catch (error) {
          console.error('Failed to parse notification from SSE:', error);
        }
      });

      eventSource.onerror = (error) => {
        const readyState = eventSource.readyState;
        
        // EventSource readyState: 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
        if (readyState === EventSource.CLOSED) {
          console.warn('SSE connection closed. Will attempt to reconnect...');
          updateStatus('disconnected');
          
          // Increment retry count and schedule retry
          setRetryCount(prev => prev + 1);
          retryTimeoutRef.current = setTimeout(() => {
            connect();
          }, retryDelay);
        } else if (readyState === EventSource.CONNECTING) {
          console.warn('SSE connection error (connecting). Retrying...');
          updateStatus('connecting');
        } else {
          console.error('SSE connection error:', error);
          updateStatus('error');
        }
        
        onErrorRef.current?.(error);
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      updateStatus('error');
      onErrorRef.current?.(error as Event);
    }
  }, [enabled, retryCount, maxRetries, retryDelay, updateStatus]);

  useEffect(() => {
    if (!enabled) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      updateStatus('disconnected');
      return;
    }

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      updateStatus('disconnected');
    };
  }, [enabled, connect, updateStatus]);

  return { 
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    retryCount
  };
};
