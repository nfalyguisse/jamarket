import * as Sentry from '@sentry/node';

let initialized = false;

/**
 * Initialise Sentry si SENTRY_DSN est défini.
 * tracesSampleRate=0 : error-tracking uniquement (pas de tracing distribué V1).
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn || initialized) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
  initialized = true;
}

export function captureServerException(
  exception: unknown,
  context: {
    method?: string;
    path?: string;
    statusCode?: number;
    feature?: string;
    tags?: Record<string, string>;
  } = {},
): void {
  if (!process.env.SENTRY_DSN?.trim()) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context.method) scope.setTag('method', context.method);
    if (context.path) scope.setTag('path', context.path);
    if (context.statusCode != null) {
      scope.setTag('statusCode', String(context.statusCode));
    }
    if (context.feature) scope.setTag('feature', context.feature);
    if (context.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value);
      }
    }
    scope.setLevel('error');

    if (exception instanceof Error) {
      Sentry.captureException(exception);
    } else {
      Sentry.captureException(new Error(String(exception)));
    }
  });
}

export { Sentry };
