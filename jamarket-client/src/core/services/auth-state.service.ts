import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import {
  AUTH_ACCESS_TOKEN_KEY,
  AUTH_ADMIN_PROFILE_KEY,
  AUTH_CLIENT_PROFILE_KEY,
  AUTH_REFRESH_TOKEN_KEY,
  AUTH_SCOPE_KEY,
  type AuthScope,
} from '@core/constants/auth.constants';
import { AuthTokens } from '@core/models/auth.model';
import { UserProfile } from '@core/models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _accessToken = signal(this.readToken());
  private readonly _adminProfile = signal<UserProfile | null>(this.readAdminProfile());
  private readonly _clientProfile = signal<UserProfile | null>(this.readClientProfile());

  readonly isLoggedIn = computed(() => !!this._accessToken());
  readonly profileRoute = computed(() =>
    this.isLoggedIn() ? '/profil' : '/connexion',
  );

  readonly isAdmin = computed(() =>
    this._adminProfile()?.role.rights.includes('ADMIN') ?? false,
  );

  readonly adminProfile = this._adminProfile.asReadonly();
  readonly clientProfile = this._clientProfile.asReadonly();

  readonly clientInitials = computed(() => {
    const profile = this._clientProfile();
    if (!profile) {
      return null;
    }
    const first = profile.name?.charAt(0) ?? '';
    const last = profile.lastName?.charAt(0) ?? '';
    const initials = `${first}${last}`.toUpperCase();
    return initials || null;
  });

  readonly clientFullName = computed(() => {
    const profile = this._clientProfile();
    if (!profile) {
      return null;
    }
    return `${profile.name} ${profile.lastName}`.trim() || null;
  });

  getAccessToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);
    }
    return this._accessToken();
  }

  hasAdminSession(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const hasToken = !!localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);
    const isAdminScope = localStorage.getItem(AUTH_SCOPE_KEY) === 'admin';
    return hasToken && isAdminScope && this.isAdmin();
  }

  hasClientSession(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const hasToken = !!localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);
    const scope = localStorage.getItem(AUTH_SCOPE_KEY);
    return hasToken && scope !== 'admin';
  }

  setToken(token: string): void {
    this._accessToken.set(token);
  }

  setAdminProfile(profile: UserProfile): void {
    this._adminProfile.set(profile);
    this.persistAdminProfile(profile);
  }

  setClientProfile(profile: UserProfile): void {
    this._clientProfile.set(profile);
    this.persistClientProfile(profile);
  }

  persistTokens(tokens: AuthTokens, scope: AuthScope = 'client'): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(AUTH_SCOPE_KEY, scope);
    this._accessToken.set(tokens.accessToken);

    if (scope !== 'admin') {
      this.clearAdminProfile();
    } else {
      this.clearClientProfile();
    }
  }

  clearTokens(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY);
      localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
      localStorage.removeItem(AUTH_SCOPE_KEY);
    }
    this._accessToken.set(null);
    this.clearAdminProfile();
    this.clearClientProfile();
  }

  private persistAdminProfile(profile: UserProfile): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    sessionStorage.setItem(AUTH_ADMIN_PROFILE_KEY, JSON.stringify(profile));
  }

  private persistClientProfile(profile: UserProfile): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    sessionStorage.setItem(AUTH_CLIENT_PROFILE_KEY, JSON.stringify(profile));
  }

  private clearAdminProfile(): void {
    this._adminProfile.set(null);
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(AUTH_ADMIN_PROFILE_KEY);
    }
  }

  private clearClientProfile(): void {
    this._clientProfile.set(null);
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(AUTH_CLIENT_PROFILE_KEY);
    }
  }

  private readToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);
  }

  private readAdminProfile(): UserProfile | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    if (localStorage.getItem(AUTH_SCOPE_KEY) !== 'admin') {
      return null;
    }

    try {
      const raw = sessionStorage.getItem(AUTH_ADMIN_PROFILE_KEY);
      return raw ? (JSON.parse(raw) as UserProfile) : null;
    } catch {
      return null;
    }
  }

  private readClientProfile(): UserProfile | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    if (localStorage.getItem(AUTH_SCOPE_KEY) === 'admin') {
      return null;
    }

    try {
      const raw = sessionStorage.getItem(AUTH_CLIENT_PROFILE_KEY);
      return raw ? (JSON.parse(raw) as UserProfile) : null;
    } catch {
      return null;
    }
  }
}
