// procedures.component.ts
import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProceduresService, Procedure } from '../../services/procedures.service';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './procedures.component.html',
})
export class ProceduresComponent implements OnInit {
  
  procedures: Procedure[] = [];
  loading = false;
  error = '';
  
  // Modal
  showModal = false;
  selectedProcedure: Procedure | null = null;
  saving = false;
  modalError = '';
  
  procedureForm = {
    name: '',
    description: '',
    cost: 0
  };

  // Permisos
  isAdmin = false;

  constructor(
    private proceduresService: ProceduresService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole(['ADMIN']);
    this.loadProcedures();
    this.cdr.detectChanges();
  }

  loadProcedures() {
    this.loading = true;
    this.error = '';


    this.proceduresService.getAll().subscribe({
      next: (data) => {
        this.procedures = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Error al cargar procedimientos';
        this.loading = false;
        console.error('Error:', err);
        this.cdr.detectChanges();
      }
    });
  }

  openModal(procedure?: Procedure) {
    if (procedure) {
      // Editar
      this.selectedProcedure = procedure;
      this.procedureForm = {
        name: procedure.name,
        description: procedure.description || '',
        cost: procedure.cost
      };
    } else {
      // Nuevo
      this.selectedProcedure = null;
      this.procedureForm = {
        name: '',
        description: '',
        cost: 0
      };
    }
    
    this.modalError = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedProcedure = null;
    this.modalError = '';
  }

  saveProcedure() {
    // Validación
    if (!this.procedureForm.name || this.procedureForm.cost <= 0) {
      this.modalError = 'Completa todos los campos obligatorios';
      return;
    }

    this.saving = true;
    this.modalError = '';

    const data = {
      name: this.procedureForm.name,
      description: this.procedureForm.description || undefined,
      cost: this.procedureForm.cost
    };

    const request = this.selectedProcedure
      ? this.proceduresService.update(this.selectedProcedure.id, data)
      : this.proceduresService.create(data);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadProcedures();
        alert(this.selectedProcedure ? 'Procedimiento actualizado' : 'Procedimiento creado');
      },
      error: (err) => {
        this.saving = false;
        this.modalError = err.error?.error || 'Error al guardar';
        console.error('Error:', err);
      }
    });
  }

  deleteProcedure(id: number) {
    if (!confirm('¿Eliminar este procedimiento?')) return;

    this.proceduresService.delete(id).subscribe({
      next: () => {
        this.loadProcedures();
        alert('Procedimiento eliminado');
      },
      error: (err) => {
        alert('Error al eliminar el procedimiento');
        console.error('Error:', err);
      }
    });
  }
}