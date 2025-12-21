// appointment-form.component.ts
import { Component, OnInit, ChangeDetectorRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { AppointmentsService } from '../../services/appointments.service';
import { PatientsService } from '../../services/patients.service';
import { FilterPatientsPipe } from '../../pipes/filter-patients.pipe';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    FilterPatientsPipe
  ],
  templateUrl: './appointment-form.component.html',
})
export class AppointmentFormComponent implements OnInit {

  form!: FormGroup;
  isEdit = false;
  id!: number;

  patients: any[] = [];
  searchPatient = '';

  constructor(
    private fb: FormBuilder,
    private appointmentsService: AppointmentsService,
    private patientsService: PatientsService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      patient_id: ['', Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required],
      reason: ['', Validators.required],
    });

    this.loadPatients();

    this.id = Number(this.route.snapshot.paramMap.get('id'));
    if (this.id) {
      this.isEdit = true;
      this.appointmentsService.getById(this.id).subscribe(a => {
        this.form.patchValue({
          patient_id: a.patient_id,
          date: a.date.split('T')[0],
          time: a.date.split('T')[1]?.substring(0, 5),
          reason: a.reason
        });
      });
    }
  }

  loadPatients() {
    this.patientsService.getAll().subscribe(p => this.patients = p);
  }

  // ✅ NUEVA FUNCIÓN: Obtener nombre del paciente seleccionado
  getSelectedPatientName(): string {
    const patientId = this.form.get('patient_id')?.value;
    if (!patientId) return 'No seleccionado';
    
    const patient = this.patients.find(p => p.id == patientId);
    if (!patient) return 'No seleccionado';
    
    return `${patient.first_name} ${patient.last_name} (DNI: ${patient.dni})`;
  }

  submit() {
    if (this.form.invalid) {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    const { date, time, ...rest } = this.form.value;

    const payload = {
      ...rest,
      date: `${date}T${time}:00`
    };

    const action = this.isEdit
      ? this.appointmentsService.update(this.id, payload)
      : this.appointmentsService.create(payload);

    action.subscribe({
      next: () => {
        const message = this.isEdit 
          ? '✅ Cita actualizada correctamente'
          : '✅ Cita creada correctamente';
        alert(message);
        this.router.navigate(['/appointments']);
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert('❌ Error al guardar la cita');
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }
}