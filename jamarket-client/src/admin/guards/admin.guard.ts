import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { catchError, defer, map, of } from 'rxjs';
import {
  AUTH_ACCESS_TOKEN_KEY,
  AUTH_SCOPE_KEY,
  hasAdminRight,
} from '@core/constants/auth.constants';
import { AuthStateService } from '@core/services/auth-state.service';
import { AdminAuthApiService } from '@admin/data/admin-auth-api.service';

/**
 * Guard protégeant les routes du back office admin.
 *
 * Au reload, la validation API dans un guard async peut être annulée par le
 * routeur SSR. On s'appuie donc sur la session admin restaurée depuis
 * sessionStorage, puis on rafraîchit le profil en arrière-plan dans le layout.
 */
export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authState = inject(AuthStateService);
  const adminAuthApi = inject(AdminAuthApiService);
  const platformId = inject(PLATFORM_ID);

  const loginUrl = router.createUrlTree(['/admin/connexion']);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  return defer(() => {
    const hasToken = !!localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);
    const isAdminScope = localStorage.getItem(AUTH_SCOPE_KEY) === 'admin';

    if (!hasToken || !isAdminScope) {
      return of(loginUrl);
    }

    const cachedProfile = authState.adminProfile();
    if (cachedProfile && hasAdminRight(cachedProfile)) {
      return of(true);
    }

    return adminAuthApi.fetchAndStoreAdminProfile().pipe(
      map((profile) => (hasAdminRight(profile) ? true : loginUrl)),
      catchError(() => of(loginUrl)),
    );
  });
};
