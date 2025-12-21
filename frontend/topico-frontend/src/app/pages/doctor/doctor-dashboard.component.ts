import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface DoctorStats {
  todayAppointments: number;
  todayConsultations: number;
  pendingAppointments: number;
  totalPatients: number;
}

interface Appointment {
  id: number;
  date: string;
  reason: string;
  status: string;
  patient: {
    id: number;
    first_name: string;
    last_name: string;
    dni: string;
  };
}

interface RecentConsultation {
  id: number;
  diagnosis: string;
  created_at: string;
  patient: {
    first_name: string;
    last_name: string;
  };
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './doctor-dashboard.component.html'
})
export class DoctorDashboardComponent implements OnInit {

  // Datos del usuario
  doctorName: string = '';
  doctorId: number = 0;

  // Estadísticas
  stats: DoctorStats = {
    todayAppointments: 0,
    todayConsultations: 0,
    pendingAppointments: 0,
    totalPatients: 0
  };

  // Datos
  todayAppointments: Appointment[] = [];
  recentConsultations: RecentConsultation[] = [];

  // Estados
  loading = true;
  loadingAppointments = true;
  loadingConsultations = true;
  errorMsg = '';

  // Fecha actual
  currentDate = new Date();
  currentHour = new Date().getHours();

  constructor(private http: HttpClient,private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadDoctorInfo();
    this.loadDashboardData();
    this.cdr.detectChanges();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  loadDoctorInfo(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.doctorName = user.full_name || 'Doctor';
      this.doctorId = user.id;
    }
  }

  loadDashboardData(): void {
    this.loadStats();
    this.loadTodayAppointments();
    this.loadRecentConsultations();
  }

  loadStats(): void {
    this.loading = true;
    
    this.http.get<DoctorStats>(`${environment.apiUrl}/doctor/stats`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando stats:', err);
        this.loading = false;
        this.errorMsg = 'Error cargando estadísticas';
        this.cdr.detectChanges();
      }
    });
  }

  loadTodayAppointments(): void {
    this.loadingAppointments = true;
    
    this.http.get<Appointment[]>(`${environment.apiUrl}/doctor/appointments/today`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (data) => {
        this.todayAppointments = data;
        this.loadingAppointments = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando citas:', err);
        this.loadingAppointments = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadRecentConsultations(): void {
    this.loadingConsultations = true;
    
    this.http.get<RecentConsultation[]>(`${environment.apiUrl}/doctor/consultations/recent`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (data) => {
        this.recentConsultations = data;
        this.loadingConsultations = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando consultas:', err);
        this.loadingConsultations = false;
        this.cdr.detectChanges();
      }
    });
  }

  getGreeting(): string {
    if (this.currentHour < 12) return 'Buenos días';
    if (this.currentHour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'SCHEDULED': 'bg-blue-100 text-blue-700',
      'ATTENDED': 'bg-green-100 text-green-700',
      'CANCELLED': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  }

  getStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      'SCHEDULED': 'Programada',
      'ATTENDED': 'Atendida',
      'CANCELLED': 'Cancelada'
    };
    return texts[status] || status;
  }

  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  refresh(): void {
    this.loadDashboardData();
  }
}