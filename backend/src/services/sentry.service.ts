import * as Sentry from '@sentry/node';
import { env } from '../config/env';

export class SentryService {
  static initialize() {
    if (!env.SENTRY_DSN) {
      console.log('[Sentry] DSN not configured, monitoring disabled');
      return;
    }

    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      tracesSampleRate: 1.0,
      beforeSend(event) {
        // Don't send events in development
        if (env.NODE_ENV === 'development') {
          return null;
        }
        return event;
      },
    });

    console.log('[Sentry] Monitoring initialized');
  }

  static captureException(error: Error, context?: Record<string, any>) {
    if (!env.SENTRY_DSN) return;

    Sentry.withScope((scope) => {
      if (context) {
        scope.setExtras(context);
      }
      Sentry.captureException(error);
    });

    console.error('[Sentry] Exception captured:', error.message);
  }

  static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (!env.SENTRY_DSN) return;

    Sentry.withScope((scope) => {
      scope.setLevel(level as any);
      Sentry.captureMessage(message);
    });
  }

  static setUser(userId: number, email?: string) {
    if (!env.SENTRY_DSN) return;

    Sentry.setUser({
      id: userId.toString(),
      email,
    });
  }

  static addBreadcrumb(message: string, category?: string, data?: Record<string, any>) {
    if (!env.SENTRY_DSN) return;

    Sentry.addBreadcrumb({
      message,
      category,
      data,
      timestamp: Date.now() / 1000,
    });
  }

  // Express error handler middleware
  static errorHandler() {
    return Sentry.Handlers.errorHandler() as any;
  }

  // Express request handler middleware
  static requestHandler() {
    return Sentry.Handlers.requestHandler();
  }

  // Express tracing handler middleware
  static tracingHandler() {
    return Sentry.Handlers.tracingHandler();
  }
}
