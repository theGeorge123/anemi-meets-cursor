import * as Sentry from "@sentry/react";
import { BrowserRouter } from 'react-router-dom';
import { SentryRouteTracker } from './components/SentryRouteTracker';

Sentry.init({
  dsn: "https://9c9ec0d710df965baa6558ee822c0928@o4509423043018752.ingest.de.sentry.io/4509423100624976",
  sendDefaultPii: true,
  integrations: [
    Sentry.browserTracingIntegration()
  ],
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
  environment: import.meta.env.MODE,
  release: 'anemi-meets@1.0.0',
  beforeSend(event) {
    if (event.message?.includes("ResizeObserver") || event.message?.includes("test error")) {
      return null;
    }
    return event;
  }
});

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import i18n from './i18n/i18n';
import { I18nextProvider } from 'react-i18next';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <Sentry.ErrorBoundary fallback={<div style={{padding: 40, textAlign: 'center'}}><h2>Er is iets misgegaan 😬</h2><p>Probeer het later opnieuw of <a href="/">ga terug naar home</a>.</p></div>} showDialog={false}>
        <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <SentryRouteTracker />
          <App />
        </BrowserRouter>
      </Sentry.ErrorBoundary>
    </I18nextProvider>
  </React.StrictMode>,
); 