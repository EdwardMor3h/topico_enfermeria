import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {

  // KPIs principales
  stats: any = null;

  // Gráficos y datos adicionales
  appointmentsMonth: any[] = [];
  consultationsByDoctor: any[] = [];
  salesMonth: any[] = [];
  topSupplies: any[] = [];
  lowStockItems: any[] = [];
  latestConsultations: any[] = [];
  latestAudits: any[] = [];

  // Estados de carga
  loadingStats = true;
  loadingCharts = true;
  loadingTables = true;
  errorMsg = '';

  // Fecha actual
  currentDate = new Date();

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!localStorage.getItem('token')) {
      return;
    }
    this.loadAllData();
  }

  loadAllData() {
    this.loadStats();
    this.loadCharts();
    this.loadTables();
  }

  loadStats() {
    this.loadingStats = true;
    this.errorMsg = '';

    this.dashboardService.getStats().subscribe({
      next: (data) => {
        console.log('📊 STATS:', data);
        this.stats = data;
        this.loadingStats = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error stats:', err);
        this.errorMsg = 'Error cargando métricas principales';
        this.loadingStats = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadCharts() {
    this.loadingCharts = true;

    // Citas del mes
    this.dashboardService.getAppointmentsMonth().subscribe({
      next: (data) => {
        console.log('📅 Citas del mes:', data);
        this.appointmentsMonth = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error citas mes:', err)
    });

    // Consultas por doctor
    this.dashboardService.getConsultationsByDoctor().subscribe({
      next: (data) => {
        console.log('👨‍⚕️ Consultas por doctor:', data);
        this.consultationsByDoctor = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error consultas doctor:', err)
    });

    // Ventas del mes
    this.dashboardService.getSalesMonth().subscribe({
      next: (data) => {
        console.log('💰 Ventas mes:', data);
        this.salesMonth = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error ventas mes:', err)
    });

    // Top medicamentos
    this.dashboardService.getTopSupplies().subscribe({
      next: (data) => {
        console.log('🏆 Top medicamentos:', data);
        this.topSupplies = data;
        this.loadingCharts = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error top medicamentos:', err);
        this.loadingCharts = false;
      }
    });
  }

  loadTables() {
    this.loadingTables = true;

    // Stock bajo
    this.dashboardService.getLowStock().subscribe({
      next: (data) => {
        console.log('📦 Stock bajo:', data);
        this.lowStockItems = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error stock bajo:', err)
    });

    // Últimas consultas
    this.dashboardService.getLatestConsultations().subscribe({
      next: (data) => {
        console.log('🩺 Últimas consultas:', data);
        this.latestConsultations = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error últimas consultas:', err)
    });

    // Últimas auditorías
    this.dashboardService.getLatestAudits().subscribe({
      next: (data) => {
        console.log('📋 Auditorías:', data);
        this.latestAudits = data;
        this.loadingTables = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error auditorías:', err);
        this.loadingTables = false;
      }
    });
  }

  refreshDashboard() {
    this.loadAllData();
  }

  // Calcular porcentaje para barras visuales
  getPercentage(value: number, max: number): number {
    return max > 0 ? (value / max) * 100 : 0;
  }

  // Obtener color según stock
  getStockColor(stock: number): string {
    if (stock <= 5) return 'bg-red-500';
    if (stock <= 20) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  // Formatear fecha corta
  formatDate(date: any): string {
    return new Date(date).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short'
    });
  }

  // Obtener máximo valor para gráficos
  getMaxValue(arr: any[], key: string): number {
    if (!arr || arr.length === 0) return 0;
    return Math.max(...arr.map(item => Number(item[key]) || 0));
  }
}