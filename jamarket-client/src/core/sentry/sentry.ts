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

function resolveHttpCategory(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'network';
  }
  if (error.status >= 500) {
    return 'server';
  }
  if (error.status >= 400) {
    return 'client';
  }
  return 'http';
}

function shouldIgnoreHttpError(error: HttpErrorResponse): boolean {
  return error.status >= 400 && error.status < 500;
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
  if (shouldIgnoreHttpError(error) && !blockedByClient) {
    return;
  }
  const category = resolveHttpCategory(error);

  Sentry.withScope((scope) => {
    scope.setTag('platform', 'browser');
    scope.setTag('feature', context.feature);
    scope.setTag('httpStatus', String(error.status));
    scope.setTag('errorCategory', category);
    scope.setExtra('statusText', error.statusText);
    scope.setExtra('httpMessage', error.message);

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

    const exception =
      error.error instanceof Error
        ? error.error
        : new Error(
            `[HTTP ${error.status}] ${requestUrl ?? 'URL inconnue'} — ${error.message || 'HTTP error'}`,
          );

    Sentry.captureException(exception);
  });
}

export { Sentry };
