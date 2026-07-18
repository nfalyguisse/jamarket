import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import type { UserProfile } from '@core/models/user-profile.model';

export interface UpdateProfilePayload {
  name?: string;
  lastName?: string;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  private readonly http = inject(HttpClient);
  private readonly meUrl = `${environment.apiUrl}/auth/me`;

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.meUrl);
  }

  updateProfile(payload: UpdateProfilePayload): Observable<UserProfile> {
    return this.http.patch<UserProfile>(this.meUrl, payload);
  }
}
