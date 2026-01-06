import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AppointmentsService } from '../../services/appointments.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './doctor-appointments.component.html',
})
export class DoctorAppointmentsComponent implements OnInit {

  appointments: any[] = [];
  loading = true;
  error: string = '';

  // 🔹 Modal signos vitales
  selectedAppointment: any = null;
  showVitalSignsModal = false;

  constructor(
    private appointmentsService: AppointmentsService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTodayAppointments();
  }

  loadTodayAppointments() {
    this.loading = true;
    this.error = '';

    this.appointmentsService.getTodayAppointments().subscribe({
      next: (data) => {
        this.appointments = data.filter(a => a.status === 'SCHEDULED');
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Error al cargar las citas del día';
        this.loading = false;
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }

  // 👁️ Ver signos vitales
  viewVitalSigns(appointment: any) {
    this.selectedAppointment = appointment;
    this.showVitalSignsModal = true;
  }

  // ❌ Cerrar modal
  closeVitalSignsModal() {
    this.showVitalSignsModal = false;
    this.selectedAppointment = null;
  }

  // 🧮 Calcular IMC
  calculateBMI(weight?: number, height?: number): string {
    if (!weight || !height) return 'N/A';
    const heightMeters = height / 100;
    return (weight / (heightMeters * heightMeters)).toFixed(1);
  }

  // 👉 Atender paciente
  attend(appointmentId: number) {
    this.router.navigate(['/doctor/consultation', appointmentId]);
  }
}
