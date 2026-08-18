import { HttpErrorResponse } from '@angular/common/http';
import * as Sentry from '@sentry/angular';

let initialized = false;

export type ClientSentryContext = {
  feature: string;
  url?: string;
  tags?: Record<string, string>;
};

/**
 * Initialise Sentry si sentryDsn est défini dans l'environnement Angular.
 * tracesSampleRate=0 : error-tracking uniquement (aligné sur l'API Nest).
 */
export function initSentry(options: {
  dsn?: string;
  production: boolean;
}): void {
  const dsn = options.dsn?.trim();
  if (!dsn || initialized) {
    return;
  }

  Sentry.init({
    dsn,
    environment: options.production ? 'production' : 'development',
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
  initialized = true;
}

function isAdsRoute(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\/ads(?:\/|\?|$)/.test(url);
}

function isLikelyBlockedByClient(error: HttpErrorResponse): boolean {
  if (error.status !== 0) {
    return false;
  }

  const url = error.url ?? '';
  if (isAdsRoute(url)) {
    return true;
  }

  const message = `${error.message} ${error.statusText}`.toLowerCase();
  return (
    message.includes('unknown error') ||
    message.includes('failed to fetch') ||
    message.includes('load failed') ||
    message.includes('network error')
  );
}

export function captureClientHttpError(
  error: unknown,
  context: ClientSentryContext,
): void {
  if (!initialized || !(error instanceof HttpErrorResponse)) {
    return;
  }

  const requestUrl = context.url ?? error.url ?? undefined;
  const blockedByClient = isLikelyBlockedByClient(error);

  Sentry.withScope((scope) => {
    scope.setTag('platform', 'browser');
    scope.setTag('feature', context.feature);
    scope.setTag('httpStatus', String(error.status));

    if (requestUrl) {
      scope.setTag('url', requestUrl);
      scope.setExtra('httpUrl', requestUrl);
    }

    if (blockedByClient) {
      scope.setTag('blocked_by_client', 'true');
      scope.setTag('anomaly', 'ANOM-2026-002');
      scope.setTag('bug', 'BUG-PROD-001');
    }

    if (context.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value);
      }
    }

    scope.setLevel('error');

    if (blockedByClient) {
      Sentry.captureMessage(
        `ERR_BLOCKED_BY_CLIENT — requête API bloquée par le navigateur : ${requestUrl ?? 'URL inconnue'}`,
        'error',
      );
      return;
    }

    if (error.status === 0) {
      Sentry.captureMessage(
        `Erreur réseau client (HTTP status 0) : ${requestUrl ?? 'URL inconnue'}`,
        'error',
      );
      return;
    }

    Sentry.captureException(
      error.error instanceof Error ? error.error : new Error(error.message || 'HTTP error'),
    );
  });
}

export { Sentry };
