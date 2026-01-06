// consultation-form.component.ts - ACTUALIZADO CON RECETA
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  
  // ⬅️ NUEVO: Para manejar la receta
  savedConsultationId: number | null = null;
  showPrintButton = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private consultationsService: ConsultationsService,
    private appointmentsService: AppointmentsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      diagnosis: ['', Validators.required],
      observations: [''],
      treatment: ['', Validators.required],
    });

    const id = this.route.snapshot.paramMap.get('appointmentId');
    
    if (id) {
      this.appointmentId = Number(id);
      this.loadAppointment();
    } else {
      this.error = 'No se encontró el ID de la cita';
      this.loadingAppointment = false;
      this.cdr.detectChanges();
    }
  }

  loadAppointment() {
    this.loadingAppointment = true;
    this.error = '';

    this.appointmentsService.getById(this.appointmentId).subscribe({
      next: (data) => {
        this.appointment = data;
        this.loadingAppointment = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Error al cargar datos de la cita';
        this.loadingAppointment = false;
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }

  submit() {
    if (this.form.invalid) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    this.submitting = true;
    this.error = '';

    const payload = {
      patient_id: this.appointment.patient_id,
      diagnosis: this.form.value.diagnosis,
      observations: this.form.value.observations,
      treatment: this.form.value.treatment,
    };

    console.log('📦 Payload a enviar:', payload);

    this.consultationsService.create(payload).subscribe({
      next: (response) => {
        console.log('✅ Respuesta completa del backend:', response);
        
        // ⬅️ CORREGIDO: El ID está en response.consultation.id
        this.savedConsultationId = response.consultation?.id || response.id;
        console.log('💾 ID de consulta guardado:', this.savedConsultationId);
        
        // Verificar que existe clinicalHistory
        if (!response || !response.clinicalHistory || !response.clinicalHistory.id) {
          console.error('❌ ERROR: No se recibió clinicalHistory en la respuesta:', response);
          alert('⚠️ Consulta guardada pero hubo un error con la historia clínica');
          this.router.navigate(['/doctor/appointments']);
          return;
        }

        const clinicalHistoryId = response.clinicalHistory.id;
        console.log('🆔 ID de Historia Clínica obtenido:', clinicalHistoryId);
        
        // Actualizar estado de la cita
        this.appointmentsService.updateStatus(this.appointmentId, 'ATTENDED').subscribe({
          next: () => {
            console.log('✅ Estado de cita actualizado');
            
            // ⬅️ MODIFICADO: Preguntar si quiere imprimir receta ANTES de firmar
            const wantToPrint = confirm(
              '✅ Consulta registrada exitosamente.\n\n' +
              '¿Desea imprimir la receta para el paciente AHORA?\n' +
              '(Después deberá firmar la historia clínica)'
            );
            
            if (wantToPrint) {
              // Imprimir receta
              this.printPrescription();
              
              // Esperar un momento y luego ir a firmar
              setTimeout(() => {
                alert('Ahora debe firmar la historia clínica (OBLIGATORIO)');
                this.router.navigate(['/clinical-histories', clinicalHistoryId, 'sign']);
              }, 1500);
            } else {
              // Ir directo a firmar
              alert('Ahora debe firmar la historia clínica (OBLIGATORIO)');
              this.router.navigate(['/clinical-histories', clinicalHistoryId, 'sign']);
            }
          },
          error: (err) => {
            console.error('⚠️ Error actualizando estado:', err);
            // Aún así navegar a la firma (es obligatorio)
            alert('⚠️ Hubo un error pero debe firmar la historia clínica');
            this.router.navigate(['/clinical-histories', clinicalHistoryId, 'sign']);
          }
        });
      },
      error: (err) => {
        console.error('❌ Error creando consulta:', err);
        this.error = err.error?.error || 'Error al guardar la consulta';
        this.submitting = false;
        this.cdr.detectChanges();
        alert('❌ ' + this.error);
      }
    });
  }

  /**
   * 🖨️ Imprimir receta médica
   */
  printPrescription() {
    if (!this.savedConsultationId) {
      alert('❌ No hay consulta guardada');
      return;
    }
    
    console.log('📄 Descargando receta para consulta:', this.savedConsultationId);
    
    this.consultationsService.downloadPrescription(this.savedConsultationId).subscribe({
      next: (blob) => {
        // Crear URL del blob
        const url = window.URL.createObjectURL(blob);
        
        // Crear link temporal para descargar
        const link = document.createElement('a');
        link.href = url;
        link.download = `Receta_Paciente_${this.appointment.patient.dni}_${Date.now()}.pdf`;
        
        // Agregar al DOM, hacer clic y remover
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpiar URL
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Receta descargada exitosamente');
      },
      error: (err) => {
        console.error('❌ Error descargando receta:', err);
        alert('❌ Error al descargar la receta. Intente nuevamente.');
      }
    });
  }
}