import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, tap } from 'rxjs';
import { LoginPayload } from '@core/models/auth.model';
import { UserProfile } from '@core/models/user-profile.model';
import { AuthStateService } from '@core/services/auth-state.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminAuthApiService {
  private readonly http = inject(HttpClient);
  private readonly authState = inject(AuthStateService);

  private readonly authUrl = `${environment.apiUrl}/auth`;

  login(payload: LoginPayload): Observable<UserProfile> {
    return this.http
      .post<{ accessToken: string; refreshToken: string }>(`${this.authUrl}/admin/login`, payload)
      .pipe(
        tap((tokens) => this.authState.persistTokens(tokens, 'admin')),
        switchMap(() => this.fetchAndStoreAdminProfile()),
      );
  }

  fetchAndStoreAdminProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.authUrl}/admin/me`).pipe(
      tap((profile) => this.authState.setAdminProfile(profile)),
    );
  }

  /** Rafraîchit le profil admin sans bloquer la navigation. */
  refreshAdminProfile(): Observable<UserProfile> {
    return this.fetchAndStoreAdminProfile();
  }

  logout(): void {
    this.authState.clearTokens();
  }
}
