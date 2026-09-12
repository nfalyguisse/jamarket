import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthTokens, LoginPayload, RegisterPayload } from '@core/models/auth.model';
import { UserProfile } from '@core/models/user-profile.model';
import { AuthStateService } from '@core/services/auth-state.service';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly authState = inject(AuthStateService);
  private readonly authUrl = `${environment.apiUrl}/auth`;

  login(payload: LoginPayload): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.authUrl}/login`, payload).pipe(
      tap((tokens) => this.authState.persistTokens(tokens, 'client')),
      switchMap((tokens) =>
        this.fetchAndStoreClientProfile().pipe(map(() => tokens)),
      ),
    );
  }

  register(payload: RegisterPayload): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.authUrl}/register`, payload).pipe(
      tap((tokens) => this.authState.persistTokens(tokens, 'client')),
      switchMap((tokens) =>
        this.fetchAndStoreClientProfile().pipe(map(() => tokens)),
      ),
    );
  }

  /** Charge le profil client et le stocke pour l’affichage (ex. initiales header). */
  fetchAndStoreClientProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.authUrl}/me`).pipe(
      tap((profile) => this.authState.setClientProfile(profile)),
    );
  }

  refreshClientProfile(): Observable<UserProfile> {
    return this.fetchAndStoreClientProfile();
  }
}
