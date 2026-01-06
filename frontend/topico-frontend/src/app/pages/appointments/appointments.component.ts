// appointments.component.ts - ACTUALIZADO
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppointmentsService } from '../../services/appointments.service';
import { VitalSignsService } from '../../services/vital-signs.service';
import { Appointment, VitalSignsCreateDto, VitalSignsUpdateDto } from '../../models/interfaces';

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
  
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  searchTerm = '';
  loading = false;
  error: string = '';

  // ⬅️ NUEVO: Modal de signos vitales
  showVitalSignsModal = false;
  selectedAppointment: Appointment | null = null;
  savingVitalSigns = false;
  vitalSignsError = '';
  
  vitalSignsForm: any = {
    blood_pressure: '',
    heart_rate: null,
    respiratory_rate: null,
    temperature: null,
    weight: null,
    height: null,
    oxygen_saturation: null,
    observations: ''
  };

  constructor(
    private appointmentsService: AppointmentsService,
    private vitalSignsService: VitalSignsService,
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

      // 🔥 ORDENAR: fecha más reciente primero
      const sorted = data.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      this.appointments = sorted;
      this.filteredAppointments = sorted;

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

  // ⬅️ NUEVO: Abrir modal de signos vitales
  openVitalSignsModal(appointment: Appointment) {
    this.selectedAppointment = appointment;
    this.vitalSignsError = '';
    
    // Si ya tiene signos vitales, cargar los datos
    if (appointment.vitalSigns) {
      this.vitalSignsForm = {
        blood_pressure: appointment.vitalSigns.blood_pressure || '',
        heart_rate: appointment.vitalSigns.heart_rate || null,
        respiratory_rate: appointment.vitalSigns.respiratory_rate || null,
        temperature: appointment.vitalSigns.temperature || null,
        weight: appointment.vitalSigns.weight || null,
        height: appointment.vitalSigns.height || null,
        oxygen_saturation: appointment.vitalSigns.oxygen_saturation || null,
        observations: appointment.vitalSigns.observations || ''
      };
    } else {
      // Limpiar formulario para nuevo registro
      this.vitalSignsForm = {
        blood_pressure: '',
        heart_rate: null,
        respiratory_rate: null,
        temperature: null,
        weight: null,
        height: null,
        oxygen_saturation: null,
        observations: ''
      };
    }
    
    this.showVitalSignsModal = true;
  }

  // ⬅️ NUEVO: Cerrar modal
  closeVitalSignsModal() {
    this.showVitalSignsModal = false;
    this.selectedAppointment = null;
    this.vitalSignsError = '';
  }

  // ⬅️ NUEVO: Guardar signos vitales
  saveVitalSigns() {
    if (!this.selectedAppointment) return;

    this.savingVitalSigns = true;
    this.vitalSignsError = '';

    // Si ya existen signos vitales, actualizar
    if (this.selectedAppointment.vitalSigns) {
      const updateData: VitalSignsUpdateDto = {
        blood_pressure: this.vitalSignsForm.blood_pressure || undefined,
        heart_rate: this.vitalSignsForm.heart_rate || undefined,
        respiratory_rate: this.vitalSignsForm.respiratory_rate || undefined,
        temperature: this.vitalSignsForm.temperature || undefined,
        weight: this.vitalSignsForm.weight || undefined,
        height: this.vitalSignsForm.height || undefined,
        oxygen_saturation: this.vitalSignsForm.oxygen_saturation || undefined,
        observations: this.vitalSignsForm.observations || undefined
      };

      this.vitalSignsService.update(this.selectedAppointment.vitalSigns.id, updateData).subscribe({
        next: (response) => {
          this.savingVitalSigns = false;
          this.closeVitalSignsModal();
          this.loadAppointments(); // Recargar para mostrar los datos actualizados
          alert('Signos vitales actualizados exitosamente');
        },
        error: (err) => {
          this.savingVitalSigns = false;
          this.vitalSignsError = err.error?.error || 'Error al actualizar signos vitales';
          this.cdr.detectChanges();
          console.error(err);
        }
      });
    } else {
      // Crear nuevos signos vitales
      const createData: VitalSignsCreateDto = {
        appointment_id: this.selectedAppointment.id,
        patient_id: this.selectedAppointment.patient_id,
        blood_pressure: this.vitalSignsForm.blood_pressure || undefined,
        heart_rate: this.vitalSignsForm.heart_rate || undefined,
        respiratory_rate: this.vitalSignsForm.respiratory_rate || undefined,
        temperature: this.vitalSignsForm.temperature || undefined,
        weight: this.vitalSignsForm.weight || undefined,
        height: this.vitalSignsForm.height || undefined,
        oxygen_saturation: this.vitalSignsForm.oxygen_saturation || undefined,
        observations: this.vitalSignsForm.observations || undefined
      };

      this.vitalSignsService.create(createData).subscribe({
        next: (response) => {
          this.savingVitalSigns = false;
          this.closeVitalSignsModal();
          this.loadAppointments(); // Recargar para mostrar los datos actualizados
          alert('Signos vitales registrados exitosamente');
        },
        error: (err) => {
          this.savingVitalSigns = false;
          this.vitalSignsError = err.error?.error || 'Error al registrar signos vitales';
          this.cdr.detectChanges();
          console.error(err);
        }
      });
    }
  }
}