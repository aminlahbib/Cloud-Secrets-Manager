import React from 'react';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  error?: unknown;
  onRetry?: () => void;
  onGoHome?: () => void;
  onGoBack?: () => void;
  showDetails?: boolean;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = 'Something went wrong',
  message,
  error,
  onRetry,
  onGoHome,
  onGoBack,
  showDetails = process.env.NODE_ENV === 'development',
  className = '',
}) => {
  const errorDetails = error instanceof Error ? error.message : String(error);

  return (
    <Card className={`p-6 ${className}`}>
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>

        {showDetails && errorDetails && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-left">
            <p className="text-xs font-mono text-gray-600 break-all">{errorDetails}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <Button onClick={onRetry} variant="primary" className="flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          {onGoBack && (
            <Button onClick={onGoBack} variant="secondary" className="flex items-center justify-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          )}
          {onGoHome && (
            <Button onClick={onGoHome} variant="secondary" className="flex items-center justify-center gap-2">
              <Home className="h-4 w-4" />
              Go to Home
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

