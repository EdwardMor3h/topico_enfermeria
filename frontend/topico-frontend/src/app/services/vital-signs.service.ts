// src/app/services/vital-signs.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VitalSigns, VitalSignsCreateDto, VitalSignsUpdateDto } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class VitalSignsService {
  
  private apiUrl = 'http://localhost:3000/api/vital-signs'; // ⬅️ Ajusta tu URL

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Crear signos vitales para una cita
   */
  create(data: VitalSignsCreateDto): Observable<{ message: string; data: VitalSigns }> {
    return this.http.post<{ message: string; data: VitalSigns }>(
      this.apiUrl,
      data,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener signos vitales de una cita específica
   */
  getByAppointment(appointmentId: number): Observable<{ message: string; data: VitalSigns }> {
    return this.http.get<{ message: string; data: VitalSigns }>(
      `${this.apiUrl}/appointment/${appointmentId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener historial de signos vitales de un paciente
   */
  getByPatient(patientId: number, limit: number = 10): Observable<{ message: string; count: number; data: VitalSigns[] }> {
    return this.http.get<{ message: string; count: number; data: VitalSigns[] }>(
      `${this.apiUrl}/patient/${patientId}?limit=${limit}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Actualizar signos vitales
   */
  update(id: number, data: VitalSignsUpdateDto): Observable<{ message: string; data: VitalSigns }> {
    return this.http.put<{ message: string; data: VitalSigns }>(
      `${this.apiUrl}/${id}`,
      data,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Eliminar signos vitales (solo ADMIN)
   */
  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Listar todos los signos vitales (solo ADMIN)
   */
  getAll(): Observable<{ message: string; count: number; data: VitalSigns[] }> {
    return this.http.get<{ message: string; count: number; data: VitalSigns[] }>(
      this.apiUrl,
      { headers: this.getHeaders() }
    );
  }
}