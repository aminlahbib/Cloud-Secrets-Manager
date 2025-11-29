import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to error reporting service (e.g., Sentry) in production
    // TODO: Integrate with error reporting service
    // if (process.env.NODE_ENV === 'production') {
    //   logErrorToService(error, errorInfo);
    // }

    this.setState({
      error,
      errorInfo,
    });
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error boundary if resetKeys change
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }

    // Reset on any prop change if enabled
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--page-bg)' }}>
          <Card className="max-w-2xl w-full p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--status-danger-bg)' }}>
                  <AlertTriangle className="h-6 w-6" style={{ color: 'var(--status-danger)' }} />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Something went wrong</h1>
                <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                  We're sorry, but something unexpected happened. Please try refreshing the page or
                  return to the home page.
                </p>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)' }}>
                    <p className="text-sm font-semibold mb-2" style={{ color: 'var(--status-danger)' }}>Error Details:</p>
                    <p className="text-sm font-mono mb-2" style={{ color: 'var(--status-danger)' }}>
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <details className="mt-2">
                        <summary className="text-sm cursor-pointer" style={{ color: 'var(--status-danger)' }}>
                          Stack Trace
                        </summary>
                        <pre className="mt-2 text-xs overflow-auto max-h-48 p-2 rounded" style={{ color: 'var(--status-danger)', backgroundColor: 'var(--elevation-1)' }}>
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={this.resetErrorBoundary}
                    className="flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => (window.location.href = '/home')}
                    className="flex items-center justify-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Go to Home
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to reset error boundary
export const useErrorHandler = () => {
  return (error: Error) => {
    // This will be caught by the nearest ErrorBoundary
    throw error;
  };
};

