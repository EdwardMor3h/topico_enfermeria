import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { authGuard } from './guards/auth-guard';
import { roleRedirectGuard } from './guards/role-redirect.guard';

export const APP_ROUTES: Routes = [

  // =========================
  // AUTH
  // =========================
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth.routes')
        .then(m => m.AUTH_ROUTES),
  },

  // =========================
  // APP PROTEGIDA
  // =========================
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [

      // 🔁 REDIRECCIÓN AUTOMÁTICA SEGÚN ROL
      {
        path: '',
        canActivate: [roleRedirectGuard],
        component: LayoutComponent
      },

      // =========================
      // 🏠 WELCOME (ADMIN y NURSE)
      // =========================
      {
        path: 'welcome',
        loadComponent: () =>
          import('./pages/welcome/welcome.component')
            .then(m => m.WelcomeComponent),
      },

      // =========================
      // 📊 DASHBOARD
      // =========================
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component')
            .then(m => m.DashboardComponent),
      },

      // =========================
      // 📅 APPOINTMENTS (NURSE)
      // =========================
      {
        path: 'appointments',
        loadComponent: () =>
          import('./pages/appointments/appointments.component')
            .then(m => m.AppointmentsComponent),
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

      // =========================
      // 👥 PATIENTS
      // =========================
      {
        path: 'patients',
        loadComponent: () =>
          import('./pages/patients/patients.component')
            .then(m => m.PatientsComponent),
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

      // =========================
      // 📋 CLINICAL HISTORIES
      // =========================
      {
        path: 'clinical-histories/:id',
        loadComponent: () =>
          import('./pages/clinical-histories/clinical-histories.component')
            .then(m => m.ClinicalHistoriesComponent),
      },
      {
        path: 'clinical-histories/:id/sign',
        loadComponent: () =>
          import('./pages/clinical-histories/signature.component')
            .then(m => m.SignatureComponent),
      },

      // =========================
      // 🩺 PROCEDURES
      // =========================
      {
        path: 'procedures',
        loadComponent: () =>
          import('./pages/procedures/procedures.component')
            .then(m => m.ProceduresComponent),
      },
      {
        path: 'procedures/assign',
        loadComponent: () =>
          import('./pages/procedures/assign-procedure.component')
            .then(m => m.AssignProcedureComponent),
      },
      {
        path: 'procedure-records',
        loadComponent: () =>
          import('./pages/procedures/procedure-records.component')
            .then(m => m.ProcedureRecordsComponent),
      },

      // =========================
      // 💊 INVENTORY
      // =========================
      {
        path: 'inventory',
        loadComponent: () =>
          import('./pages/inventory/inventory.component')
            .then(m => m.InventoryComponent),
      },
      {
        path: 'inventory/new',
        loadComponent: () =>
          import('./pages/inventory/supply-form.component')
            .then(m => m.SupplyFormComponent),
      },
      {
        path: 'inventory/edit/:id',
        loadComponent: () =>
          import('./pages/inventory/supply-form.component')
            .then(m => m.SupplyFormComponent),
      },

      // =========================
      // 💰 SALES
      // =========================
      {
        path: 'sales',
        loadComponent: () =>
          import('./pages/sales/sales-list.component')
            .then(m => m.SalesListComponent),
      },
      {
        path: 'sales/new',
        loadComponent: () =>
          import('./pages/sales/sale-form.component')
            .then(m => m.SaleFormComponent),
      },

      // =========================
      // 📊 REPORTS
      // =========================
      {
        path: 'reports',
        loadComponent: () =>
          import('./pages/reports/reports.component')
            .then(m => m.ReportsComponent),
      },

      // =========================
      // 👨‍⚕️ DOCTOR
      // =========================
      {
        path: 'doctor',
        children: [
          {
            path: 'appointments',
            loadComponent: () =>
              import('./pages/doctor/doctor-appointments.component')
                .then(m => m.DoctorAppointmentsComponent),
          },
          {
            path: 'consultation/:appointmentId',
            loadComponent: () =>
              import('./pages/doctor/consultation-form.component')
                .then(m => m.ConsultationFormComponent),
          }
        ]
      }
    ]
  },

  // =========================
  // FALLBACK
  // =========================
  { path: '**', redirectTo: '' }
];
