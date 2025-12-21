import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SalesService, Sale } from '../../services/sales.service';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './sales-list.component.html',
  styleUrls: ['./sales-list.component.css']
})
export class SalesListComponent implements OnInit {
  sales: Sale[] = [];
  loading = false;
  searchTerm = '';
  filteredSales: Sale[] = [];

  constructor(
    private salesService: SalesService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSales();
  }

  loadSales(): void {
    this.loading = true;
    this.salesService.getAll().subscribe({
      next: (data) => {
        this.sales = data;
        this.filteredSales = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        alert('Error al cargar las ventas');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearchChange(): void {
    if (!this.searchTerm) {
      this.filteredSales = this.sales;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredSales = this.sales.filter(sale =>
      sale.patient?.first_name?.toLowerCase().includes(term) ||
      sale.patient?.last_name?.toLowerCase().includes(term) ||
      sale.customer_name?.toLowerCase().includes(term) ||
      sale.patient?.dni?.includes(term) ||
      sale.customer_dni?.includes(term) ||
      this.getPaymentLabel(sale.payment).toLowerCase().includes(term)
    );
  }

  createSale(): void {
    this.router.navigate(['/sales/new']);
  }

  viewDetails(sale: Sale): void {
    console.log('Ver detalles:', sale);
  }

  getTotalSales(): number {
    return this.filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  }

  getTodaySales(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.sales
      .filter(sale => {
        const saleDate = new Date(sale.created_at);
        saleDate.setHours(0, 0, 0, 0);
        return saleDate.getTime() === today.getTime();
      })
      .reduce((sum, sale) => sum + sale.total, 0);
  }

  formatPrice(price: number): string {
    return `S/ ${price.toFixed(2)}`;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPaymentLabel(payment: string): string {
    const labels: any = {
      'CASH': 'Efectivo',
      'CARD': 'Tarjeta',
      'YAPE': 'Yape',
      'PLIN': 'Plin',
      'TRANSFER': 'Transferencia'
    };
    return labels[payment] || payment;
  }

  getPaymentClass(payment: string): string {
    const classes: any = {
      'CASH': 'payment-cash',
      'CARD': 'payment-card',
      'YAPE': 'payment-yape',
      'PLIN': 'payment-plin',
      'TRANSFER': 'payment-transfer'
    };
    return classes[payment] || 'payment-default';
  }

  getCustomerName(sale: Sale): string {
    if (sale.patient) {
      return `${sale.patient.first_name} ${sale.patient.last_name}`;
    }
    return sale.customer_name || 'Cliente Anónimo';
  }

  getCustomerDni(sale: Sale): string {
    if (sale.patient) {
      return sale.patient.dni;
    }
    return sale.customer_dni || 'N/A';
  }
}