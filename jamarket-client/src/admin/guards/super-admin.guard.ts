import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { hasSuperAdminRight } from '@core/constants/auth.constants';
import { AuthStateService } from '@core/services/auth-state.service';

/**
 * Restreint l'accès aux fonctionnalités réservées au super administrateur.
 */
export const superAdminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authState = inject(AuthStateService);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const profile = authState.adminProfile();
  if (profile && hasSuperAdminRight(profile)) {
    return true;
  }

  return router.createUrlTree(['/admin/dashboard']);
};
