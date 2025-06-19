import React from 'react';
import { withTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import * as Sentry from '@sentry/react';

interface ErrorBoundaryProps {
  t: TFunction;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Log to Sentry with additional context
    Sentry.withScope((scope) => {
      scope.setExtra('componentStack', errorInfo.componentStack);
      scope.setTag('errorType', 'react_render_error');
      
      // Add user and environment context if available
      const user = localStorage.getItem('supabase.auth.token');
      if (user) {
        try {
          const userData = JSON.parse(user);
          scope.setUser({ id: userData.user?.id });
        } catch (e) {
          console.warn('Could not parse user data for error context');
        }
      }

      Sentry.captureException(error);
    });

    // Also log to console for local development
    if (import.meta.env.DEV) {
      console.error('React rendering error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  render() {
    const { t, fallback, children } = this.props;
    const { hasError, error, errorInfo } = this.state;

    if (hasError) {
      return fallback || (
        <div className="max-w-xl mx-auto my-12 p-8 bg-red-50 border border-red-200 rounded-2xl shadow text-center">
          <span className="text-4xl mb-2 block">😬</span>
          <h2 className="text-xl font-bold text-red-700 mb-2">{t('renderErrorTitle')}</h2>
          <p className="text-red-700 mb-4">{t('renderErrorMessage')}</p>
          {import.meta.env.DEV && error && (
            <div className="mt-4 p-4 bg-white rounded text-left overflow-auto">
              <p className="font-mono text-sm text-gray-700 whitespace-pre-wrap">
                {error.toString()}
              </p>
              {errorInfo && (
                <pre className="mt-2 font-mono text-xs text-gray-600 whitespace-pre-wrap">
                  {errorInfo.componentStack}
                </pre>
              )}
            </div>
          )}
          <div className="mt-6 space-x-4">
            <button 
              className="btn-primary" 
              onClick={() => window.location.reload()}
            >
              {t('reload')}
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                Sentry.showReportDialog({
                  title: t('errorReportTitle'),
                  subtitle: t('errorReportSubtitle'),
                  subtitle2: t('errorReportSubtitle2'),
                  labelName: t('errorReportLabelName'),
                  labelEmail: t('errorReportLabelEmail'),
                  labelComments: t('errorReportLabelComments'),
                  labelClose: t('errorReportLabelClose'),
                  labelSubmit: t('errorReportLabelSubmit'),
                  errorGeneric: t('errorReportGeneric'),
                  errorFormEntry: t('errorReportFormEntry'),
                  successMessage: t('errorReportSuccess'),
                });
              }}
            >
              {t('reportError')}
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default withTranslation()(ErrorBoundary);
