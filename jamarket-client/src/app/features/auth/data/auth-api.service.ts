import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthTokens, LoginPayload, RegisterPayload } from '@core/models/auth.model';
import { AuthStateService } from '@core/services/auth-state.service';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly authState = inject(AuthStateService);
  private readonly authUrl = `${environment.apiUrl}/auth`;

  login(payload: LoginPayload): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.authUrl}/login`, payload).pipe(
      tap((tokens) => this.authState.persistTokens(tokens, 'client')),
    );
  }

  register(payload: RegisterPayload): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.authUrl}/register`, payload).pipe(
      tap((tokens) => this.authState.persistTokens(tokens, 'client')),
    );
  }
}
