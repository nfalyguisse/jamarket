import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _accessToken = signal(this.readToken());

  readonly isLoggedIn = computed(() => !!this._accessToken());
  readonly profileRoute = computed(() =>
    this.isLoggedIn() ? '/profil' : '/connexion',
  );

  setToken(token: string): void {
    this._accessToken.set(token);
  }

  clearTokens(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('jamarket_access_token');
      localStorage.removeItem('jamarket_refresh_token');
    }
    this._accessToken.set(null);
  }

  private readToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem('jamarket_access_token');
  }
}
