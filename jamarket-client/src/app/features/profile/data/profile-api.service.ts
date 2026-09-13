import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { UserProfile } from '@core/models/user-profile.model';
import { AuthStateService } from '@core/services/auth-state.service';

export interface UpdateProfilePayload {
  name?: string;
  lastName?: string;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  private readonly http = inject(HttpClient);
  private readonly authState = inject(AuthStateService);
  private readonly meUrl = `${environment.apiUrl}/auth/me`;

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.meUrl).pipe(
      tap((profile) => this.authState.setClientProfile(profile)),
    );
  }

  updateProfile(payload: UpdateProfilePayload): Observable<UserProfile> {
    return this.http.patch<UserProfile>(this.meUrl, payload).pipe(
      tap((profile) => this.authState.setClientProfile(profile)),
    );
  }
}
