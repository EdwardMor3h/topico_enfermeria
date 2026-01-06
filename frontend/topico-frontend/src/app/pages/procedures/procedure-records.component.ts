// procedure-records.component.ts
import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProceduresService, ProcedureRecord } from '../../services/procedures.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './procedure-records.component.html',
})
export class ProcedureRecordsComponent implements OnInit {
  
  records: ProcedureRecord[] = [];
  filteredRecords: ProcedureRecord[] = [];
  searchTerm = '';
  loading = false;
  error = '';
  
  // Modal
  showDetailModal = false;
  selectedRecord: ProcedureRecord | null = null;

  constructor(
    private proceduresService: ProceduresService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRecords();
  }

  loadRecords() {
    this.loading = true;
    this.error = '';

    this.proceduresService.getAllRecords().subscribe({
      next: (data) => {
        this.records = data;
        this.filteredRecords = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Error al cargar procedimientos realizados';
        this.loading = false;
        console.error('Error:', err);
        this.cdr.detectChanges();
      }
    });
  }

  onSearch() {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredRecords = this.records;
      return;
    }

    this.filteredRecords = this.records.filter(record => {
      const patientName = `${record.patient?.first_name || ''} ${record.patient?.last_name || ''}`.toLowerCase();
      const patientDni = record.patient?.dni?.toLowerCase() || '';
      const procedureName = record.procedure?.name?.toLowerCase() || '';
      const userName = record.user?.full_name?.toLowerCase() || '';
      const date = new Date(record.date).toLocaleDateString();

      return patientName.includes(term) || 
             patientDni.includes(term) || 
             procedureName.includes(term) ||
             userName.includes(term) ||
             date.includes(term);
    });
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredRecords = this.records;
  }

  viewDetails(record: ProcedureRecord) {
    this.selectedRecord = record;
    this.showDetailModal = true;
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedRecord = null;
  }

  goToAssign() {
    this.router.navigate(['/procedures/assign']);
  }
}