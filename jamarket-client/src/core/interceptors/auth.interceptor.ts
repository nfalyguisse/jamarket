import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { SKIP_AUTH_REFRESH, AUTH_REFRESH_TOKEN_KEY } from '@core/constants/auth.constants';
import { AuthRefreshService } from '@core/services/auth-refresh.service';
import { AuthStateService } from '@core/services/auth-state.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const authState = inject(AuthStateService);
  const authRefresh = inject(AuthRefreshService);

  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  const token = authState.getAccessToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  if (req.context.get(SKIP_AUTH_REFRESH)) {
    return next(authReq);
  }

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      if (!authState.getAccessToken() && !localStorage.getItem(AUTH_REFRESH_TOKEN_KEY)) {
        return throwError(() => error);
      }

      return authRefresh.refreshAccessToken().pipe(
        switchMap((tokens) =>
          next(
            req.clone({
              setHeaders: { Authorization: `Bearer ${tokens.accessToken}` },
            }),
          ),
        ),
        catchError((refreshError) => throwError(() => refreshError)),
      );
    }),
  );
};
