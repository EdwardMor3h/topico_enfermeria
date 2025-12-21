import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // ✅ Importa ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConsultationsService } from '../../services/consultations.service';
import { AppointmentsService } from '../../services/appointments.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './consultation-form.component.html',
})
export class ConsultationFormComponent implements OnInit {
  
  form!: FormGroup;
  appointment: any = null;
  appointmentId!: number;
  loadingAppointment = true;
  error = '';
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private consultationsService: ConsultationsService,
    private appointmentsService: AppointmentsService,
    private cdr: ChangeDetectorRef // ✅ Inyecta ChangeDetectorRef
  ) {
    console.log('🏗️ ConsultationFormComponent constructor');
  }

  ngOnInit(): void {
    console.log('🔄 ngOnInit ejecutado');
    
    this.form = this.fb.group({
      diagnosis: ['', Validators.required],
      observations: [''],
      treatment: ['', Validators.required],
    });

    const id = this.route.snapshot.paramMap.get('appointmentId');
    console.log('📍 Parámetro appointmentId:', id);

    if (id) {
      this.appointmentId = Number(id);
      console.log('✅ appointmentId convertido a número:', this.appointmentId);
      this.loadAppointment();
    } else {
      console.error('❌ No se encontró appointmentId en la URL');
      this.error = 'No se encontró el ID de la cita';
      this.loadingAppointment = false;
      this.cdr.detectChanges(); // ✅ Forzar detección
    }
  }

  loadAppointment() {
    console.log('📥 Cargando cita con ID:', this.appointmentId);
    this.loadingAppointment = true;
    this.error = '';

    this.appointmentsService.getById(this.appointmentId).subscribe({
      next: (data) => {
        console.log('✅ Cita cargada exitosamente:', data);
        this.appointment = data;
        this.loadingAppointment = false;
        this.cdr.detectChanges(); // ✅ ESTO ES CLAVE - Forzar actualización de la vista
      },
      error: (err) => {
        console.error('❌ Error al cargar cita:', err);
        this.error = 'Error al cargar datos de la cita';
        this.loadingAppointment = false;
        this.cdr.detectChanges(); // ✅ Forzar detección
      }
    });
  }

  submit() {
    console.log('📤 Intentando enviar formulario');
    console.log('📋 Estado del formulario:', this.form.value);
    console.log('✔️ Formulario válido:', this.form.valid);

    if (this.form.invalid) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    this.submitting = true;
    this.error = '';
    this.cdr.detectChanges(); // ✅ Forzar detección

    const payload = {
      patient_id: this.appointment.patient_id,
      diagnosis: this.form.value.diagnosis,
      observations: this.form.value.observations,
      treatment: this.form.value.treatment,
    };

    console.log('📦 Payload a enviar:', payload);

    this.consultationsService.create(payload).subscribe({
      next: (response) => {
        console.log('✅ Consulta creada:', response);
        
        this.appointmentsService.updateStatus(this.appointmentId, 'ATTENDED').subscribe({
          next: () => {
            console.log('✅ Estado actualizado a ATTENDED');
            alert('✅ Consulta registrada exitosamente');
            this.router.navigate(['/doctor/appointments']);
          },
          error: (err) => {
            console.error('⚠️ Error actualizando estado:', err);
            alert('⚠️ Consulta guardada, pero no se pudo actualizar el estado');
            this.router.navigate(['/doctor/appointments']);
          }
        });
      },
      error: (err) => {
        console.error('❌ Error guardando consulta:', err);
        this.error = 'Error al guardar la consulta';
        this.submitting = false;
        this.cdr.detectChanges(); // ✅ Forzar detección
        alert('❌ Error al guardar la consulta');
      }
    });
  }
}