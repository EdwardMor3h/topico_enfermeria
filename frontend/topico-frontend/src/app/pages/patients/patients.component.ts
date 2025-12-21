// patients.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ AGREGAR
import { Router } from '@angular/router';
import { PatientsService } from '../../services/patients.service';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule], // ✅ AGREGAR FormsModule
  templateUrl: './patients.component.html',
})
export class PatientsComponent implements OnInit {

  patients: any[] = [];
  filteredPatients: any[] = []; // ✅ NUEVO: Para pacientes filtrados
  searchTerm = ''; // ✅ NUEVO: Término de búsqueda
  loading = true;
  error = '';

  constructor(
    private patientsService: PatientsService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients() {
    this.loading = true;
    this.patientsService.getAll().subscribe({
      next: (data) => {
        this.patients = data;
        this.filteredPatients = data; // ✅ NUEVO: Inicializar filtrados
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error cargando pacientes';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ✅ NUEVA FUNCIÓN: Filtrar pacientes
  onSearch() {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredPatients = this.patients;
      return;
    }

    this.filteredPatients = this.patients.filter(patient => {
      const dni = patient.dni?.toLowerCase() || '';
      const firstName = patient.first_name?.toLowerCase() || '';
      const lastName = patient.last_name?.toLowerCase() || '';
      const phone = patient.phone?.toLowerCase() || '';
      const fullName = `${firstName} ${lastName}`;

      return dni.includes(term) || 
             fullName.includes(term) || 
             firstName.includes(term) || 
             lastName.includes(term) ||
             phone.includes(term);
    });
  }

  // ✅ NUEVA FUNCIÓN: Limpiar búsqueda
  clearSearch() {
    this.searchTerm = '';
    this.filteredPatients = this.patients;
  }

  goNew() {
    this.router.navigate(['/patients/new']);
  }

  edit(id: number) {
    this.router.navigate(['/patients/edit', id]);
  }

  delete(id: number) {
    if (!confirm('¿Eliminar paciente?')) return;

    this.patientsService.delete(id).subscribe(() => {
      this.loadPatients();
    });
  }
}