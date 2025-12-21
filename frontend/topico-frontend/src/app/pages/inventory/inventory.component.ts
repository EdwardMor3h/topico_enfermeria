import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // ✅ AGREGAR
import { CommonModule } from '@angular/common'; // ✅ AGREGAR
import { MedicalSupplyService, MedicalSupply } from '../../services/medical-supply.service';

@Component({
  selector: 'app-inventory',
  standalone: true,  // ✅ IMPORTANTE
  imports: [CommonModule, FormsModule], // ✅ AGREGAR FormsModule
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryComponent implements OnInit {
  supplies: MedicalSupply[] = [];
  filteredSupplies: MedicalSupply[] = [];
  loading = false;
  searchTerm = '';
  filterOption = 'all'; // all | low-stock | expired | expiring-soon

  constructor(
    private supplyService: MedicalSupplyService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSupplies();
  }

  loadSupplies(): void {
    this.loading = true;
    this.supplyService.getAll().subscribe({
      next: (data) => {
        this.supplies = data;
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges(); // ✅ Forzar detección
      },
      error: (err) => {
        console.error(err);
        alert('Error al cargar el inventario');
        this.loading = false;
        this.cdr.detectChanges(); // ✅ Forzar detección
      }
    });
  }

  applyFilters(): void {
    let result = [...this.supplies];

    // Filtro por búsqueda
    if (this.searchTerm) {
      result = result.filter(s => 
        s.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        s.description?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        s.supplier?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Filtro por categoría
    switch (this.filterOption) {
      case 'low-stock':
        result = result.filter(s => s.stock < 10);
        break;
      case 'expired':
        result = result.filter(s => {
          if (!s.expiration) return false;
          return new Date(s.expiration) < new Date();
        });
        break;
      case 'expiring-soon':
        result = result.filter(s => {
          if (!s.expiration) return false;
          const expirationDate = new Date(s.expiration);
          const today = new Date();
          const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiration > 0 && daysUntilExpiration <= 30;
        });
        break;
    }

    this.filteredSupplies = result;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  createSupply(): void {
    this.router.navigate(['/inventory/new']);
  }

  editSupply(id: number): void {
    this.router.navigate(['/inventory/edit', id]);
  }

  deleteSupply(supply: MedicalSupply): void {
    if (!confirm(`¿Estás seguro de eliminar "${supply.name}"?`)) {
      return;
    }

    this.supplyService.delete(supply.id).subscribe({
      next: () => {
        alert('✅ Suministro eliminado correctamente');
        this.loadSupplies();
      },
      error: (err) => {
        console.error(err);
        alert('Error al eliminar el suministro');
      }
    });
  }

  getStockClass(stock: number): string {
    if (stock === 0) return 'stock-critical';
    if (stock < 5) return 'stock-very-low';
    if (stock < 10) return 'stock-low';
    return 'stock-normal';
  }

  getStockLabel(stock: number): string {
    if (stock === 0) return 'SIN STOCK';
    if (stock < 5) return 'MUY BAJO';
    if (stock < 10) return 'BAJO';
    return 'NORMAL';
  }

  isExpired(expiration?: Date): boolean {
    if (!expiration) return false;
    return new Date(expiration) < new Date();
  }

  isExpiringSoon(expiration?: Date): boolean {
    if (!expiration) return false;
    const expirationDate = new Date(expiration);
    const today = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiration > 0 && daysUntilExpiration <= 30;
  }

  getDaysUntilExpiration(expiration?: Date): number {
    if (!expiration) return 0;
    const expirationDate = new Date(expiration);
    const today = new Date();
    return Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  formatPrice(price: number): string {
    return `S/ ${price.toFixed(2)}`;
  }

  getTotalValue(): number {
    return this.filteredSupplies.reduce((sum, s) => sum + (s.stock * s.unit_price), 0);
  }

  getLowStockCount(): number {
    return this.supplies.filter(s => s.stock < 10).length;
  }

  getExpiredCount(): number {
    return this.supplies.filter(s => this.isExpired(s.expiration)).length;
  }

  getExpiringSoonCount(): number {
    return this.supplies.filter(s => this.isExpiringSoon(s.expiration)).length;
  }
}