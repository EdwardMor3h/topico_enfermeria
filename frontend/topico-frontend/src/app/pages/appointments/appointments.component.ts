// appointments.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppointmentsService } from '../../services/appointments.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './appointments.component.html',
})
export class AppointmentsComponent implements OnInit {
  
  appointments: any[] = [];
  filteredAppointments: any[] = []; // ✅ NUEVO: Para citas filtradas
  searchTerm = ''; // ✅ NUEVO: Término de búsqueda
  loading = false;
  error: string = '';

  constructor(
    private appointmentsService: AppointmentsService,    
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments() {
    this.loading = true;
    this.error = '';
    
    this.appointmentsService.getAll().subscribe({
      next: (data) => {
        this.appointments = data;
        this.filteredAppointments = data; // ✅ NUEVO: Inicializar filtrados
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Error al cargar las citas';
        this.loading = false;
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }

  // ✅ NUEVA FUNCIÓN: Filtrar citas
  onSearch() {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredAppointments = this.appointments;
      return;
    }

    this.filteredAppointments = this.appointments.filter(appointment => {
      const dni = appointment.patient?.dni?.toLowerCase() || '';
      const firstName = appointment.patient?.first_name?.toLowerCase() || '';
      const lastName = appointment.patient?.last_name?.toLowerCase() || '';
      const fullName = `${firstName} ${lastName}`;
      const reason = appointment.reason?.toLowerCase() || '';
      const status = appointment.status?.toLowerCase() || '';

      return dni.includes(term) || 
             fullName.includes(term) || 
             firstName.includes(term) || 
             lastName.includes(term) ||
             reason.includes(term) ||
             status.includes(term);
    });
  }

  // ✅ NUEVA FUNCIÓN: Limpiar búsqueda
  clearSearch() {
    this.searchTerm = '';
    this.filteredAppointments = this.appointments;
  }

  cancel(id: number) {
    if (!confirm('¿Cancelar cita?')) return;
    
    this.appointmentsService.cancel(id).subscribe({
      next: () => {
        this.loadAppointments();
      },
      error: (err) => {
        this.error = 'Error al cancelar la cita';
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }
}