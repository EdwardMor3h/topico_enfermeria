import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const role = auth.getUserRole();

  // 👨‍⚕️ DOCTOR → citas del día
  if (role === 'DOCTOR') {
    router.navigateByUrl('/doctor/appointments');
    return false;
  }

  // 🏠 ADMIN y NURSE → inicio
  if (role === 'ADMIN' || role === 'NURSE') {
    router.navigateByUrl('/welcome');
    return false;
  }

  // ❌ si algo falla
  router.navigateByUrl('/auth');
  return false;
};
