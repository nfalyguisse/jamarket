import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, tap } from 'rxjs';
import { LoginPayload } from '@core/models/auth.model';
import {
  ChangeAdminPasswordPayload,
  UpdateAdminProfilePayload,
  UserProfile,
} from '@core/models/user-profile.model';
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

  updateProfile(payload: UpdateAdminProfilePayload): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.authUrl}/admin/me`, payload).pipe(
      tap((profile) => this.authState.setAdminProfile(profile)),
    );
  }

  changePassword(payload: ChangeAdminPasswordPayload): Observable<UserProfile> {
    return this.http.patch<UserProfile>(`${this.authUrl}/admin/me/password`, payload);
  }

  uploadAvatar(file: File): Observable<UserProfile> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UserProfile>(`${this.authUrl}/admin/me/avatar`, formData).pipe(
      tap((profile) => this.authState.setAdminProfile(profile)),
    );
  }

  deleteAvatar(): Observable<UserProfile> {
    return this.http.delete<UserProfile>(`${this.authUrl}/admin/me/avatar`).pipe(
      tap((profile) => this.authState.setAdminProfile(profile)),
    );
  }

  logout(): void {
    this.authState.clearTokens();
  }
}
