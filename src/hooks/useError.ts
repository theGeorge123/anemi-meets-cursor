import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import * as Sentry from '@sentry/react';

interface ErrorState {
  message: string;
  code?: string;
  details?: unknown;
}

interface UseErrorReturn {
  error: ErrorState | null;
  setError: (error: ErrorState | null) => void;
  handleError: (error: unknown, reportToSentry?: boolean) => void;
  clearError: () => void;
}

export const useError = (): UseErrorReturn => {
  const [error, setError] = useState<ErrorState | null>(null);
  const { t } = useTranslation();

  const handleError = useCallback((error: unknown, reportToSentry: boolean = true) => {
    let errorMessage = t('errors.unknown');
    let errorCode: string | undefined;
    let errorDetails: unknown;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      const apiError = error as { message?: string; code?: string; details?: unknown };
      errorMessage = apiError.message || t('errors.unknown');
      errorCode = apiError.code;
      errorDetails = apiError.details;
    }

    // Log error for debugging
    if (import.meta.env.MODE !== 'production') {
      console.error('Error occurred:', {
        message: errorMessage,
        code: errorCode,
        details: errorDetails,
        timestamp: new Date().toISOString(),
      });
    }

    // Add Sentry breadcrumb
    Sentry.addBreadcrumb({
      category: 'error',
      message: errorMessage,
      level: 'error',
      data: { code: errorCode, details: errorDetails }
    });

    // Report to Sentry
    if (reportToSentry) {
      Sentry.captureException(error);
    }

    // Set error state
    setError({
      message: errorMessage,
      code: errorCode,
      details: errorDetails,
    });

    // Show toast notification
    toast.error(errorMessage, {
      duration: 5000,
      position: 'top-center',
    });
  }, [t]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    setError,
    handleError,
    clearError,
  };
}; 