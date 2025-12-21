import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppointmentsService {
  private apiUrl = 'http://localhost:3000/api/appointments';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getById(id: number): Observable<any> {
    console.log('🔍 Buscando cita ID:', id);
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getMyAppointments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my`);
  }

  getTodayAppointments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/today`);
  }

  create(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // ✅ MÉTODO QUE FALTABA
  updateStatus(id: number, status: string): Observable<any> {
    console.log('🔄 Actualizando estado de cita:', id, 'a', status);
    return this.http.put(`${this.apiUrl}/${id}/status`, { status });
  }

  cancel(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}