import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      // Enable query deduplication
      structuralSharing: true,
      // Performance optimizations
      networkMode: 'online',
      // Note: keepPreviousData is deprecated in v5, use placeholderData per-query if needed
    },
    mutations: {
      retry: 0, // Don't retry mutations by default
      networkMode: 'online',
    },
  },
});

type RootInstance = ReturnType<typeof ReactDOM.createRoot>;

declare global {
  interface Window {
    __CSM_ROOT__?: RootInstance;
  }
}

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element #root not found');
}

if (!window.__CSM_ROOT__) {
  window.__CSM_ROOT__ = ReactDOM.createRoot(container);
}

const root = window.__CSM_ROOT__;

root.render(
  <React.StrictMode>
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

