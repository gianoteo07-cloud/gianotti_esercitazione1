import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService, UserRole } from '../services/auth.service';

export const roleGuard = (role: UserRole): CanActivateFn => {
  return async () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    await authService.init();

    if (!authService.state().authenticated) {
      await authService.login();
      return false;
    }

    const portalRole = authService.getPortalRole();
    if (portalRole !== 'all' && portalRole !== role) {
      return router.createUrlTree(['/accesso-negato']);
    }

    if (!authService.hasRole(role)) {
      return router.createUrlTree(['/accesso-negato']);
    }

    return true;
  };
};
