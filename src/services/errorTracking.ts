interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  url?: string;
  line?: number;
  column?: number;
}

export const ErrorTracker = {
  track(error: Error | string, context?: ErrorContext) {
    const errorInfo = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? null : error.stack,
      context: {
        url: context?.url || window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        ...context,
      },
    };

    const isProduction = process.env.NODE_ENV === 'production' || false;
    if (isProduction) {
      console.error('[Production Error]', JSON.stringify(errorInfo, null, 2));
    } else {
      console.error('[Development Error]', errorInfo);
    }
  },

  trackWarning(warning: string, context?: ErrorContext) {
    console.warn('[Warning]', warning, context);
  },

  trackPerformance(metric: PerformanceEntry) {
    const perfInfo = {
      name: metric.name,
      type: metric.entryType,
      duration: metric.duration,
      startTime: metric.startTime,
      timestamp: new Date().toISOString(),
    };
    console.log('[Performance]', perfInfo);
  },
};

export const withErrorHandling = <T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  errorMessage: string,
  context?: ErrorContext
): ((...args: Args) => Promise<T | null>) => {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof Error) {
        ErrorTracker.track(error, { ...context, action: errorMessage });
      } else {
        ErrorTracker.track(String(error), { ...context, action: errorMessage });
      }
      return null;
    }
  };
};

export const logErrorBoundary = (error: Error, errorInfo: React.ErrorInfo) => {
  ErrorTracker.track(error, {
    component: errorInfo.componentStack?.split('\n')[1]?.trim(),
    action: 'React Error Boundary',
  });
};