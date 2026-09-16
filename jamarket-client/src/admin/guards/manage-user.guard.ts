import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { hasManageUserRight } from '@core/constants/auth.constants';
import { AuthStateService } from '@core/services/auth-state.service';

/** Accès à la gestion des utilisateurs (MANAGE_USER ou SUPER_ADMIN). */
export const manageUserGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authState = inject(AuthStateService);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const profile = authState.adminProfile();
  if (profile && hasManageUserRight(profile)) {
    return true;
  }

  return router.createUrlTree(['/admin/dashboard']);
};
