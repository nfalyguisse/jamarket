import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthTokens, LoginPayload, RegisterPayload } from '../../../core/models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authUrl = `${environment.apiUrl}/auth`;

  login(payload: LoginPayload): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.authUrl}/login`, payload).pipe(
      tap((tokens) => this.persistTokens(tokens)),
    );
  }

  register(payload: RegisterPayload): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.authUrl}/register`, payload).pipe(
      tap((tokens) => this.persistTokens(tokens)),
    );
  }

  private persistTokens(tokens: AuthTokens): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem('jamarket_access_token', tokens.accessToken);
    localStorage.setItem('jamarket_refresh_token', tokens.refreshToken);
  }
}
