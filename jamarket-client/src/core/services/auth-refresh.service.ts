import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Observable, finalize, shareReplay, tap } from 'rxjs';
import {
  AUTH_REFRESH_TOKEN_KEY,
  AUTH_SCOPE_KEY,
  SKIP_AUTH_REFRESH,
  type AuthScope,
} from '@core/constants/auth.constants';
import { AuthTokens } from '@core/models/auth.model';
import { AuthStateService } from '@core/services/auth-state.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthRefreshService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authState = inject(AuthStateService);

  private refreshInFlight: Observable<AuthTokens> | null = null;

  refreshAccessToken(): Observable<AuthTokens> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('Le refresh token est indisponible côté serveur.');
    }

    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    const refreshToken = localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error('Refresh token absent.');
    }

    const scope = (localStorage.getItem(AUTH_SCOPE_KEY) as AuthScope | null) ?? 'client';
    const endpoint =
      scope === 'admin'
        ? `${environment.apiUrl}/auth/admin/refresh`
        : `${environment.apiUrl}/auth/refresh`;

    this.refreshInFlight = this.http
      .post<AuthTokens>(
        endpoint,
        { refreshToken },
        {
          context: new HttpContext().set(SKIP_AUTH_REFRESH, true),
        },
      )
      .pipe(
        tap((tokens) => this.authState.persistTokens(tokens, scope)),
        finalize(() => {
          this.refreshInFlight = null;
        }),
        shareReplay(1),
      );

    return this.refreshInFlight;
  }
}
