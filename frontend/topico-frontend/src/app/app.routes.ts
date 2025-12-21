import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { authGuard } from './guards/auth-guard';

export const APP_ROUTES: Routes = [
  // RUTAS DE AUTENTICACIÓN
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },

  // RUTAS PROTEGIDAS (REQUERIR LOGIN)
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            m => m.DashboardComponent
          ),
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import('./pages/appointments/appointments.component').then(
            m => m.AppointmentsComponent
          ),
      },

      {
        path: 'appointments/new',
        loadComponent: () =>
          import('./pages/appointments/appointment-form.component')
            .then(m => m.AppointmentFormComponent),
      },
      {
        path: 'appointments/edit/:id',
        loadComponent: () =>
          import('./pages/appointments/appointment-form.component')
            .then(m => m.AppointmentFormComponent),
      },


      {
        path: 'patients',
        loadComponent: () =>
          import('./pages/patients/patients.component').then(
            m => m.PatientsComponent
          ),
      },
      
      {
        path: 'patients/new',
        loadComponent: () =>
          import('./pages/patients/patient-form.component')
            .then(m => m.PatientFormComponent),
      },
      {
        path: 'patients/edit/:id',
        loadComponent: () =>
          import('./pages/patients/patient-form.component')
            .then(m => m.PatientFormComponent),
      },


      {
        path: 'inventory',
        loadComponent: () =>
          import('./pages/inventory/inventory.component').then(
            m => m.InventoryComponent
          ),
      },
      {
        path: 'inventory/new',
        loadComponent: () =>
          import('./pages/inventory/supply-form.component').then(
            m => m.SupplyFormComponent
          ),
      },
      {
        path: 'inventory/edit/:id',
        loadComponent: () =>
          import('./pages/inventory/supply-form.component').then(
            m => m.SupplyFormComponent
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./pages/reports/reports.component').then(
            m => m.ReportsComponent
          ),
      },

      {
        path: 'sales',
        loadComponent: () =>
          import('./pages/sales/sales-list.component').then(
            m => m.SalesListComponent
          ),
      },
      {
        path: 'sales/new',
        loadComponent: () =>
          import('./pages/sales/sale-form.component').then(
            m => m.SaleFormComponent
          ),
      },

      {
        path: 'doctor',
        children: [
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./pages/doctor/doctor-dashboard.component')
                .then(m => m.DoctorDashboardComponent),
          },
          {
            path: 'appointments',
            loadComponent: () =>
              import('./pages/doctor/doctor-appointments.component')
                .then(m => m.DoctorAppointmentsComponent),
          },
          {
            path: 'consultation/:appointmentId',  // ✅ Cambié de 'id' a 'appointmentId'
            loadComponent: () =>
              import('./pages/doctor/consultation-form.component')
                .then(m => m.ConsultationFormComponent),
          }
        ]
      },


      




      // RUTA POR DEFECTO DENTRO DEL LAYOUT
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // RUTA POR DEFECTO GLOBAL
  { path: '**', redirectTo: 'dashboard' },
];
