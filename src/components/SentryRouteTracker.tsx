import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import * as Sentry from '@sentry/react';

export function SentryRouteTracker() {
  const location = useLocation();

  useEffect(() => {
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: `Navigated to ${location.pathname}`,
      level: 'info',
    });
    Sentry.setContext('route', { pathname: location.pathname });
  }, [location]);

  useEffect(() => {
    Sentry.setContext('browser', {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
    });
  }, []);

  useEffect(() => {
    import('../services/authService').then(({ getUser }) => {
      getUser().then(({ data }) => {
        if (data?.user) {
          Sentry.setUser({ id: data.user.id });
        } else {
          Sentry.setUser(null);
        }
      });
    });
  }, []);

  return null;
}
