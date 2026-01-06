// ========================================
// 📁 pages/clinical-histories/signature.component.ts
// VERSIÓN MEJORADA: Canvas + Subir Imagen
// ========================================
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ClinicalHistoryService, ClinicalHistory } from '../../services/clinical-history.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './signature.component.html',
  styleUrls: ['./signature.component.css']
})
export class SignatureComponent implements OnInit, AfterViewInit {
  
  @ViewChild('signatureCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput', { static: false }) fileInputRef!: ElementRef<HTMLInputElement>;
  
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  
  clinicalHistory: ClinicalHistory | null = null;
  clinicalHistoryId!: number;
  loading = false;
  error = '';
  submitError = '';
  submitting = false;
  signatureDataUrl = '';
  
  // ⭐ NUEVO: Control de método de firma
  signatureMethod: 'draw' | 'upload' = 'upload'; // Por defecto: subir imagen

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clinicalHistoryService: ClinicalHistoryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.clinicalHistoryId = Number(id);
      this.loadClinicalHistory();
    } else {
      this.error = 'No se encontró el ID de la historia clínica';
    }
  }

  ngAfterViewInit(): void {
    // Solo inicializar canvas si el método es 'draw'
    if (this.signatureMethod === 'draw') {
      this.initializeCanvas();
    }
  }

  initializeCanvas() {
    if (!this.canvasRef) return;
    
    this.canvas = this.canvasRef.nativeElement;
    const context = this.canvas.getContext('2d');
    
    if (context) {
      this.ctx = context;
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    }
  }

  loadClinicalHistory() {
    this.loading = true;
    this.error = '';
    
    this.clinicalHistoryService.getById(this.clinicalHistoryId).subscribe({
      next: (response: { message: string; data: ClinicalHistory }) => {
        this.clinicalHistory = response.data;
        
        // Verificar si ya está firmada
        if (this.clinicalHistory.medical_signature) {
          this.error = 'Esta historia clínica ya ha sido firmada';
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }
        
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = 'Error al cargar la historia clínica';
        this.loading = false;
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }

  // ⭐ NUEVO: Cambiar método de firma
  changeSignatureMethod(method: 'draw' | 'upload') {
    this.signatureMethod = method;
    this.signatureDataUrl = ''; // Limpiar firma anterior
    
    // Si cambia a dibujar, inicializar canvas
    if (method === 'draw') {
      setTimeout(() => {
        this.initializeCanvas();
      }, 100);
    }
    
    this.cdr.detectChanges();
  }

  // ⭐ NUEVO: Manejar subida de archivo
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    
    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      this.submitError = 'Solo se permiten archivos JPG o PNG';
      return;
    }

    // Validar tamaño (máximo 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      this.submitError = 'La imagen no debe superar los 2MB';
      return;
    }

    // Leer archivo como base64
    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (e.target?.result) {
        this.signatureDataUrl = e.target.result as string;
        this.submitError = '';
        this.cdr.detectChanges();
      }
    };

    reader.onerror = () => {
      this.submitError = 'Error al leer el archivo';
      this.cdr.detectChanges();
    };

    reader.readAsDataURL(file);
  }

  // ⭐ NUEVO: Abrir selector de archivos
  triggerFileInput() {
    this.fileInputRef.nativeElement.click();
  }

  // ============================================
  // MÉTODOS PARA DIBUJAR (Canvas)
  // ============================================
  
  private getCoordinates(event: MouseEvent | TouchEvent): { x: number; y: number } {
    if (!this.canvas) return { x: 0, y: 0 };
    
    const rect = this.canvas.getBoundingClientRect();
    
    if (event instanceof MouseEvent) {
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    } else {
      const touch = event.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }
  }

  startDrawing(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    this.isDrawing = true;
    
    const coords = this.getCoordinates(event);
    this.ctx.beginPath();
    this.ctx.moveTo(coords.x, coords.y);
  }

  draw(event: MouseEvent | TouchEvent) {
    if (!this.isDrawing) return;
    
    event.preventDefault();
    const coords = this.getCoordinates(event);
    
    this.ctx.lineTo(coords.x, coords.y);
    this.ctx.stroke();
  }

  stopDrawing() {
    if (!this.isDrawing) return;
    
    this.isDrawing = false;
    this.ctx.closePath();
    
    // Capturar la firma como imagen
    this.signatureDataUrl = this.canvas.toDataURL('image/png');
  }

  clearSignature() {
    if (this.signatureMethod === 'draw' && this.canvas && this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.signatureDataUrl = '';
    
    // Limpiar input de archivo si existe
    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  // ============================================
  // GUARDAR FIRMA
  // ============================================
  
  saveSignature() {
    if (!this.signatureDataUrl) {
      this.submitError = 'Por favor, suba una imagen de su firma o dibújela';
      return;
    }

    this.submitting = true;
    this.submitError = '';

    this.clinicalHistoryService.sign(this.clinicalHistoryId, this.signatureDataUrl).subscribe({
      next: (response: { message: string; data: ClinicalHistory }) => {
        alert('✅ Historia clínica firmada exitosamente');
        this.router.navigate(['/clinical-histories', this.clinicalHistory?.patient_id || 1]);
      },
      error: (err: any) => {
        this.submitError = err.error?.error || 'Error al firmar la historia clínica';
        this.submitting = false;
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/clinical-histories', this.clinicalHistory?.patient_id || 1]);
  }
}