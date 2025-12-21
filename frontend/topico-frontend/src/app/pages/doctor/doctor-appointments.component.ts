import { Component, OnInit, ChangeDetectorRef  } from '@angular/core';
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
  error: string = ''; // ✅ Para mostrar errores

  constructor(
    private appointmentsService: AppointmentsService,
    private router: Router,
    private cdr: ChangeDetectorRef // ✅ Agregar
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
        this.cdr.detectChanges(); // ✅ AGREGAR

      },
      error: (err) => {
        this.error = 'Error al cargar las citas del día';
        this.loading = false;
        this.cdr.detectChanges(); // ✅ AGREGAR

        console.error('Error:', err);
      }
    });
  }

  attend(appointmentId: number) {
    this.router.navigate(['/doctor/consultation', appointmentId]);
  }
}