import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { captureClientHttpError } from '@core/sentry/sentry';

function resolveFeature(url: string): string {
  if (/\/ads(?:\/|\?|$)/.test(url)) return 'ads';
  if (url.includes('/annonces')) return 'annonces';
  if (url.includes('/auth')) return 'auth';
  if (url.includes('/chat')) return 'chat';
  return 'http';
}

export const sentryHttpInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        captureClientHttpError(error, {
          feature: resolveFeature(req.url),
          url: req.url,
        });
      }

      return throwError(() => error);
    }),
  );
};
