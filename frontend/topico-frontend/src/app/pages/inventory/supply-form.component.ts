// supply-form.component.ts
import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common'; // ✅ AGREGAR
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'; // ✅ AGREGAR ReactiveFormsModule
import { ActivatedRoute, Router } from '@angular/router';
import { MedicalSupplyService } from '../../services/medical-supply.service';

@Component({
  selector: 'app-supply-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // ✅ AGREGAR imports
  templateUrl: './supply-form.component.html',
  styleUrls: ['./supply-form.component.css']
})
export class SupplyFormComponent implements OnInit {
  supplyForm: FormGroup;
  isEditMode = false;
  supplyId?: number;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private supplyService: MedicalSupplyService,
    private cdr: ChangeDetectorRef
  ) {
    this.supplyForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      stock: [0, [Validators.required, Validators.min(0)]],
      unit_price: [0, [Validators.required, Validators.min(0.01)]],
      expiration: [''],
      supplier: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.isEditMode = true;
      this.supplyId = Number(id);
      this.loadSupply();
    }
  }

  loadSupply(): void {
    if (!this.supplyId) return;

    this.loading = true;
    this.supplyService.getById(this.supplyId).subscribe({
      next: (data) => {
        this.supplyForm.patchValue({
          name: data.name,
          description: data.description,
          stock: data.stock,
          unit_price: data.unit_price,
          expiration: data.expiration ? this.formatDateForInput(data.expiration) : '',
          supplier: data.supplier
        });
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Error al cargar el suministro';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSubmit(): void {
    if (this.supplyForm.invalid) {
      this.markFormGroupTouched(this.supplyForm);
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const formData = { ...this.supplyForm.value };

    const request = this.isEditMode
      ? this.supplyService.update(this.supplyId!, formData)
      : this.supplyService.create(formData);

    request.subscribe({
      next: () => {
        const message = this.isEditMode 
          ? '✅ Suministro actualizado correctamente'
          : '✅ Suministro creado correctamente';
        
        alert(message);
        this.router.navigate(['/inventory']);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err.error?.error || 'Error al guardar el suministro';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.supplyForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.supplyForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (field?.hasError('minlength')) {
      return 'Debe tener al menos 3 caracteres';
    }
    if (field?.hasError('min')) {
      return 'El valor debe ser mayor a 0';
    }
    
    return '';
  }

  goBack(): void {
    this.router.navigate(['/inventory']);
  }

  calculateTotalValue(): number {
    const stock = this.supplyForm.get('stock')?.value || 0;
    const price = this.supplyForm.get('unit_price')?.value || 0;
    return stock * price;
  }
}