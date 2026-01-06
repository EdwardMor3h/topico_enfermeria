// ========================================
// 📁 src/app/services/clinical-history.service.ts
// ========================================
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interface para Historia Clínica
export interface ClinicalHistory {
  id: number;
  consultation_id: number;
  patient_id: number;
  doctor_id: number;
  blood_pressure?: string;
  heart_rate?: number;
  respiratory_rate?: number;
  temperature?: number;
  weight?: number;
  oxygen_saturation?: number;
  diagnosis?: string;
  medical_signature?: string;
  created_at: Date;
  updated_at?: Date;
  
  // Relaciones
  patient?: {
    id: number;
    dni: string;
    first_name: string;
    last_name: string;
    age?: number;
    phone?: string;
    address?: string;
    antecedents?: string;
  };
  doctor?: {
    id: number;
    full_name: string;
    email: string;
    signature?: string;
  };
  consultation?: {
    id: number;
    diagnosis: string;
    observations?: string;
    treatment?: string;
    created_at: Date;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ClinicalHistoryService {
  
  private apiUrl = `${environment.apiUrl}/clinical-history`;

  constructor(private http: HttpClient) {}

  /**
   * ✅ Crear historia clínica automáticamente después de crear consulta
   * (Normalmente no se usa directamente, el backend lo hace)
   */
  create(data: {
    consultation_id: number;
    patient_id: number;
    doctor_id: number;
  }): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  /**
   * 📋 Obtener todas las historias clínicas
   */
  getAll(): Observable<{ message: string; count: number; data: ClinicalHistory[] }> {
    return this.http.get<{ message: string; count: number; data: ClinicalHistory[] }>(this.apiUrl);
  }

  /**
   * 🔍 Obtener historia clínica por ID
   */
  getById(id: number): Observable<{ message: string; data: ClinicalHistory }> {
    return this.http.get<{ message: string; data: ClinicalHistory }>(`${this.apiUrl}/${id}`);
  }

  /**
   * 👤 Obtener historias clínicas por paciente
   */
  getByPatient(patientId: number): Observable<ClinicalHistory[]> {
    return this.http.get<ClinicalHistory[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  /**
   * 📄 Obtener historia clínica por consulta
   */
  getByConsultation(consultationId: number): Observable<{ message: string; data: ClinicalHistory }> {
    return this.http.get<{ message: string; data: ClinicalHistory }>(`${this.apiUrl}/consultation/${consultationId}`);
  }

  /**
   * 🖊️ Firmar historia clínica
   * @param id - ID de la historia clínica
   * @param signatureBase64 - Firma en formato base64 (data:image/png;base64,...)
   */
  sign(id: number, signatureBase64: string): Observable<{ message: string; data: ClinicalHistory }> {
    return this.http.post<{ message: string; data: ClinicalHistory }>(`${this.apiUrl}/${id}/sign`, {
      signature: signatureBase64
    });
  }

  /**
   * 📄 Descargar PDF de historia clínica
   * @param id - ID de la historia clínica
   * @returns Observable<Blob> - Archivo PDF para descargar
   */
  downloadPDF(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/../pdf/clinical-history/${id}`, {
      responseType: 'blob'
    });
  }
}