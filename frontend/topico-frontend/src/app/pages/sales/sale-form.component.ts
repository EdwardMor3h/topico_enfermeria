import { Component, OnInit, ChangeDetectorRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ← AGREGAR ESTO
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SalesService } from '../../services/sales.service';
import { MedicalSupplyService, MedicalSupply } from '../../services/medical-supply.service';
import { PatientsService } from '../../services/patients.service';

@Component({
  selector: 'app-sale-form',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,           // ← AGREGAR ESTO para ngModel
    ReactiveFormsModule
  ],
  templateUrl: './sale-form.component.html',
  styleUrls: ['./sale-form.component.css']
})
export class SaleFormComponent implements OnInit {
  saleForm: FormGroup;
  supplies: MedicalSupply[] = [];
  patients: any[] = [];
  loading = false;
  errorMessage = '';
  customerType: 'patient' | 'anonymous' = 'anonymous';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private salesService: SalesService,
    private supplyService: MedicalSupplyService,
    private patientService: PatientsService,
    private cdr: ChangeDetectorRef
  ) {
    this.saleForm = this.fb.group({
      patient_id: [''],
      customer_name: [''],
      customer_dni: [''],
      payment: ['CASH', Validators.required],
      details: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadSupplies();
    this.loadPatients();
    this.addDetail();
    this.updateValidators();
  }

  get details(): FormArray {
    return this.saleForm.get('details') as FormArray;
  }

  onCustomerTypeChange(): void {
    this.updateValidators();
  }

  updateValidators(): void {
    const patientControl = this.saleForm.get('patient_id');
    const nameControl = this.saleForm.get('customer_name');

    if (this.customerType === 'patient') {
      patientControl?.setValidators([Validators.required]);
      nameControl?.clearValidators();
      nameControl?.setValue('');
    } else {
      nameControl?.setValidators([Validators.required, Validators.minLength(3)]);
      patientControl?.clearValidators();
      patientControl?.setValue('');
    }

    patientControl?.updateValueAndValidity();
    nameControl?.updateValueAndValidity();
  }

  loadSupplies(): void {
    this.supplyService.getAll().subscribe({
      next: (data) => {
        this.supplies = data.filter(s => s.stock > 0);
      },
      error: (err) => console.error(err)
    });
  }

  loadPatients(): void {
    this.patientService.getAll().subscribe({
      next: (data) => {
        this.patients = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    
    });
  }

  createDetail(): FormGroup {
    return this.fb.group({
      medicalSupply_id: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit_price: [{ value: 0, disabled: true }],
      subtotal: [{ value: 0, disabled: true }],
      stock_available: [0]
    });
  }

  addDetail(): void {
    this.details.push(this.createDetail());
  }

  removeDetail(index: number): void {
    if (this.details.length > 1) {
      this.details.removeAt(index);
    }
  }

  onSupplyChange(index: number): void {
    const detail = this.details.at(index);
    const supplyId = detail.get('medicalSupply_id')?.value;
    
    if (supplyId) {
      const supply = this.supplies.find(s => s.id === Number(supplyId));
      
      if (supply) {
        detail.patchValue({
          unit_price: supply.unit_price,
          stock_available: supply.stock,
          quantity: 1
        });
        
        this.calculateSubtotal(index);
      }
    }
  }

  onQuantityChange(index: number): void {
    const detail = this.details.at(index);
    const quantity = detail.get('quantity')?.value;
    const stockAvailable = detail.get('stock_available')?.value;

    if (quantity > stockAvailable) {
      detail.patchValue({ quantity: stockAvailable });
      alert(`Stock insuficiente. Solo hay ${stockAvailable} unidades disponibles.`);
    }

    this.calculateSubtotal(index);
  }

  calculateSubtotal(index: number): void {
    const detail = this.details.at(index);
    const quantity = detail.get('quantity')?.value || 0;
    const unitPrice = detail.get('unit_price')?.value || 0;
    const subtotal = quantity * unitPrice;
    
    detail.patchValue({ subtotal });
  }

  calculateTotal(): number {
    let total = 0;
    this.details.controls.forEach(detail => {
      total += detail.get('subtotal')?.value || 0;
    });
    return total;
  }

  onSubmit(): void {
    if (this.saleForm.invalid || this.details.length === 0) {
      alert('Por favor completa todos los campos');
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const formData: any = {
      payment: this.saleForm.get('payment')?.value,
      details: this.details.controls.map(detail => ({
        medicalSupply_id: Number(detail.get('medicalSupply_id')?.value),
        quantity: Number(detail.get('quantity')?.value),
        unit_price: Number(detail.get('unit_price')?.value)
      }))
    };

    if (this.customerType === 'patient') {
      formData.patient_id = Number(this.saleForm.get('patient_id')?.value);
    } else {
      formData.customer_name = this.saleForm.get('customer_name')?.value;
      formData.customer_dni = this.saleForm.get('customer_dni')?.value || null;
    }

    this.salesService.create(formData).subscribe({
      next: () => {
        alert('✅ Venta registrada correctamente. Stock actualizado.');
        this.router.navigate(['/sales']);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err.error?.error || 'Error al registrar la venta';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/sales']);
  }
}