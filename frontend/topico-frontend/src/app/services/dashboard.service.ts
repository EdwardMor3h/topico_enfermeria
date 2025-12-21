// dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private apiUrl = `${environment.apiUrl}/dashboard`; // ✅ Esto genera: http://localhost:3000/api/dashboard

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`, {
      headers: this.getHeaders()
    });
  }

  getAppointmentsMonth(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/appointments/month`, {
      headers: this.getHeaders()
    });
  }

  getConsultationsByDoctor(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/consultations/by-doctor`, {
      headers: this.getHeaders()
    });
  }

  getSalesMonth(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/sales/month`, {
      headers: this.getHeaders()
    });
  }

  getTopSupplies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/supplies/top`, {
      headers: this.getHeaders()
    });
  }

  getLowStock(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/supplies/low-stock`, {
      headers: this.getHeaders()
    });
  }

  getLatestConsultations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/consultations/latest`, {
      headers: this.getHeaders()
    });
  }

  getLatestAudits(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/audit/latest`, {
      headers: this.getHeaders()
    });
  }
}