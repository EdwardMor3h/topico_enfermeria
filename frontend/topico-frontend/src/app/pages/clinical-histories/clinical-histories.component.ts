// clinical-histories.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ClinicalHistoryService, ClinicalHistory } from '../../services/clinical-history.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clinical-histories.component.html',
})
export class ClinicalHistoriesComponent implements OnInit {
  
  patientId: number = 0;
  patient: any = null;
  histories: ClinicalHistory[] = [];
  loading = false;
  error = '';
  
  // Modal
  showDetailModal = false;
  selectedHistory: ClinicalHistory | null = null;
  
  // Control de descargas
  downloadingPDF: { [key: number]: boolean } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clinicalHistoryService: ClinicalHistoryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Obtener ID del paciente desde la ruta
    this.route.params.subscribe(params => {
      this.patientId = +params['id'];
      if (this.patientId) {
        this.loadHistories();
        this.cdr.detectChanges();
      }
    });
  }

  loadHistories() {
    this.loading = true;
    this.error = '';

    this.clinicalHistoryService.getByPatient(this.patientId).subscribe({
      next: (data) => {
        this.histories = data;
        
        // Obtener info del paciente del primer registro
        if (data.length > 0 && data[0].patient) {
          this.patient = data[0].patient;
        }
        
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Error al cargar las historias clínicas';
        this.loading = false;
        console.error('Error:', err);
        this.cdr.detectChanges();
      }
    });
  }

  viewDetails(history: ClinicalHistory) {
    this.selectedHistory = history;
    this.showDetailModal = true;
  }

  closeDetailModal() {
    this.showDetailModal = false;
    this.selectedHistory = null;
  }

  downloadPDF(historyId: number) {
    this.downloadingPDF[historyId] = true;

    this.clinicalHistoryService.downloadPDF(historyId).subscribe({
      next: (blob) => {
        // Crear un objeto URL del blob
        const url = window.URL.createObjectURL(blob);
        
        // Crear un enlace temporal
        const link = document.createElement('a');
        link.href = url;
        link.download = `historia_clinica_${historyId}.pdf`;
        
        // Hacer clic programáticamente
        document.body.appendChild(link);
        link.click();
        
        // Limpiar
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.downloadingPDF[historyId] = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al descargar PDF:', err);
        alert('Error al descargar el PDF. Inténtalo de nuevo.');
        this.downloadingPDF[historyId] = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack() {
    this.router.navigate(['/patients']); // Ajusta según tu ruta de pacientes
  }
}