import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (roles: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const role = auth.getUserRole();

    if (role && roles.includes(role)) {
      return true;
    }

    router.navigate(['/doctor/appointments']);
    return false;
  };
};
