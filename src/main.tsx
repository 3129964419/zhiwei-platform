import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ErrorTracker } from '@/services/errorTracking';
import { WebVitals } from '@/services/webVitals';
import { adminAuthService } from '@/services/adminAuth';

WebVitals.subscribe();
adminAuthService.init();

const originalErrorHandler = window.onerror;
window.onerror = (message, source, lineno, colno, error) => {
  ErrorTracker.track(error || message as string, {
    url: source || window.location.href,
    line: lineno,
    column: colno,
    action: 'Global Error Handler',
  });
  if (originalErrorHandler) {
    return originalErrorHandler(message, source, lineno, colno, error);
  }
  return true;
};

window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  ErrorTracker.track(event.reason as Error || 'Unhandled Promise Rejection', {
    action: 'Unhandled Promise Rejection',
  });
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
