import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Verificar si hay token
  const token = localStorage.getItem('token');

  if (token) {
    // Usuario autenticado → permitir acceso
    return true;
  }

  // No autenticado → redirigir al login
  router.navigate(['/auth']);
  return false;
};
