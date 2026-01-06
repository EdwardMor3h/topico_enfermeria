// ========================================
// 📁 services/consultations.service.ts - ACTUALIZADO
// ========================================
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConsultationsService {
  private apiUrl = `${environment.apiUrl}/consultations`;

  constructor(private http: HttpClient) {}

  /**
   * ✅ Crear consulta (ahora crea automáticamente la historia clínica en backend)
   */
  create(data: {
    patient_id: number;
    diagnosis: string;
    observations?: string;
    treatment: string;
  }): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  /**
   * 📋 Listar todas las consultas
   */
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  /**
   * 👤 Obtener consultas por paciente
   */
  getByPatient(patientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  /**
   * 🔍 Obtener consulta por ID
   */
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * ✏️ Actualizar consulta
   */
  update(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  /**
   * 🗑️ Eliminar consulta
   */
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * 🖨️ Descargar receta médica en PDF
   */
  downloadPrescription(consultationId: number): Observable<Blob> {
    return this.http.get(
      `${environment.apiUrl}/pdf/prescription/${consultationId}`,
      { 
        responseType: 'blob'
      }
    );
  }
}