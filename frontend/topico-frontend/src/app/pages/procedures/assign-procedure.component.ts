// assign-procedure.component.ts - SIMPLIFICADO (Solo pacientes registrados)
import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProceduresService, Procedure } from '../../services/procedures.service';
import { PatientsService } from '../../services/patients.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './assign-procedure.component.html',
})
export class AssignProcedureComponent implements OnInit {
  
  procedureForm: FormGroup;
  patients: any[] = [];
  procedures: Procedure[] = [];
  selectedProcedure: Procedure | null = null;
  selectedPatient: any = null;
  
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private proceduresService: ProceduresService,
    private patientsService: PatientsService,
    private cdr: ChangeDetectorRef
  ) {
    this.procedureForm = this.fb.group({
      patient_id: ['', Validators.required],
      procedure_id: ['', Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required],
      observations: ['']
    });
  }

  ngOnInit(): void {
    this.loadPatients();
    this.loadProcedures();
    this.setDefaultDateTime();
    
    // Escuchar cambios en patient_id
    this.procedureForm.get('patient_id')?.valueChanges.subscribe(patientId => {
      this.selectedPatient = this.patients.find(p => p.id === Number(patientId));
    });
  }

  setDefaultDateTime() {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0, 5);
    
    this.procedureForm.patchValue({
      date: date,
      time: time
    });
  }

  loadPatients() {
    this.patientsService.getAll().subscribe({
      next: (data) => {
        this.patients = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando pacientes:', err);
      }
    });
  }

  loadProcedures() {
    this.proceduresService.getAll().subscribe({
      next: (data) => {
        this.procedures = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando procedimientos:', err);
        this.errorMessage = 'Error al cargar procedimientos';
      }
    });
  }

  onProcedureChange() {
    const procedureId = this.procedureForm.get('procedure_id')?.value;
    
    if (procedureId) {
      this.selectedProcedure = this.procedures.find(p => p.id === Number(procedureId)) || null;
    } else {
      this.selectedProcedure = null;
    }
  }

  onSubmit() {
    if (this.procedureForm.invalid) {
      this.errorMessage = 'Por favor completa todos los campos obligatorios';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.procedureForm.value;
    
    // Combinar fecha y hora
    const dateTime = `${formValue.date}T${formValue.time}:00`;

    const data = {
      patient_id: Number(formValue.patient_id),
      procedure_id: Number(formValue.procedure_id),
      date: dateTime,
      observations: formValue.observations || undefined
    };

    this.proceduresService.assignToPatient(data).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = '✅ Procedimiento asignado exitosamente';
        
        // Limpiar formulario después de 2 segundos y navegar
        setTimeout(() => {
          this.router.navigate(['/procedure-records']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Error al asignar procedimiento';
        console.error('Error:', err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/procedure-records']);
  }
}