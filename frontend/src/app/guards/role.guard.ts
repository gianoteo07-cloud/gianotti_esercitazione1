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

    if (!authService.hasRole(role)) {
      return router.createUrlTree(['/accesso-negato']);
    }

    return true;
  };
};
