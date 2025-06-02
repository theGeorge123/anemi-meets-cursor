import React from 'react';
import { withTranslation } from 'react-i18next';

interface ErrorBoundaryProps {
  t: any;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log naar console of externe service
    console.error('React rendering error:', error, errorInfo);
  }

  render() {
    const { t, fallback, children } = this.props;
    if (this.state.hasError) {
      return fallback || (
        <div className="max-w-xl mx-auto my-12 p-8 bg-red-50 border border-red-200 rounded-2xl shadow text-center">
          <span className="text-4xl mb-2 block">😬</span>
          <h2 className="text-xl font-bold text-red-700 mb-2">{t('renderErrorTitle')}</h2>
          <p className="text-red-700 mb-4">{t('renderErrorMessage')}</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>{t('reload')}</button>
        </div>
      );
    }
    return children;
  }
}

export default withTranslation()(ErrorBoundary); 