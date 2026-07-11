import { HttpContextToken } from '@angular/common/http';

export const AUTH_ACCESS_TOKEN_KEY = 'jamarket_access_token';
export const AUTH_REFRESH_TOKEN_KEY = 'jamarket_refresh_token';
export const AUTH_SCOPE_KEY = 'jamarket_auth_scope';
export const AUTH_ADMIN_PROFILE_KEY = 'jamarket_admin_profile';

export type AuthScope = 'client' | 'admin';

export const SKIP_AUTH_REFRESH = new HttpContextToken<boolean>(() => false);

export function hasAdminRight(profile: { role: { rights: string[] } }): boolean {
  return profile.role.rights.includes('ADMIN');
}

export function hasBackOfficeAccess(profile: { role: { rights: string[] } }): boolean {
  return (
    profile.role.rights.includes('ADMIN') ||
    profile.role.rights.includes('CREATE_AD')
  );
}

export function hasCreateAdRight(profile: { role: { rights: string[] } }): boolean {
  return profile.role.rights.includes('CREATE_AD');
}
