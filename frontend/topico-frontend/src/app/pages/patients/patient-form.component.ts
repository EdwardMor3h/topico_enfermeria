// patient-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PatientsService } from '../../services/patients.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-form.component.html',
})
export class PatientFormComponent implements OnInit {

  form!: FormGroup;
  isEdit = false;
  patientId?: number;
  loading = false; // ✅ NUEVO: Estado de carga
  errorMessage = ''; // ✅ NUEVO: Mensajes de error

  constructor(
    private fb: FormBuilder,
    private patientsService: PatientsService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      dni: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(8)]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      age: ['', [Validators.required, Validators.min(0), Validators.max(120)]],
      phone: ['', [Validators.minLength(9), Validators.maxLength(9)]]
    });

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isEdit = true;
      this.patientId = Number(id);
      this.loadPatient();
    }
  }

  // ✅ NUEVA FUNCIÓN: Cargar paciente
  loadPatient(): void {
    if (!this.patientId) return;

    this.loading = true;
    this.patientsService.getById(this.patientId).subscribe({
      next: (p: any) => {
        this.form.patchValue({
          dni: p.dni,
          firstName: p.first_name,
          lastName: p.last_name,
          age: p.age,
          phone: p.phone
        });
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Error al cargar el paciente';
        this.loading = false;
      }
    });
  }

  // ✅ NUEVA FUNCIÓN: Validar campo individual
  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  submit() {
    if (this.form.invalid) {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      this.errorMessage = 'Por favor complete todos los campos obligatorios correctamente';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const raw = this.form.value;

    const payload = {
      dni: raw.dni,
      first_name: raw.firstName,
      last_name: raw.lastName,
      age: raw.age,
      phone: raw.phone
    };

    const request = this.isEdit
      ? this.patientsService.update(this.patientId!, payload)
      : this.patientsService.create(payload);

    request.subscribe({
      next: () => {
        const message = this.isEdit 
          ? '✅ Paciente actualizado correctamente'
          : '✅ Paciente registrado correctamente';
        alert(message);
        this.router.navigate(['/patients']);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err.error?.error || 'Error al guardar el paciente';
        this.loading = false;
      }
    });
  }

  // ✅ NUEVA FUNCIÓN: Volver atrás
  goBack(): void {
    this.router.navigate(['/patients']);
  }
}