// src/app/services/procedures.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Procedure {
  id: number;
  name: string;
  description?: string;
  cost: number;
  created_at: Date;
}

export interface ProcedureRecord {
  id: number;
  patient_id: number;
  procedure_id: number;
  user_id: number;
  date: Date;
  observations?: string;
  patient?: {
    id: number;
    first_name: string;
    last_name: string;
    dni: string;
  };
  procedure?: Procedure;
  user?: {
    id: number;
    full_name: string;
  };
}

export interface AssignProcedureDto {
  patient_id: number; // ⬅️ SOLO pacientes registrados
  procedure_id: number;
  date: string;
  observations?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProceduresService {
  
  private apiUrl = 'http://localhost:3000/api/procedures'; // ⬅️ Ajusta tu URL

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ==================== PROCEDIMIENTOS ====================

  /**
   * Listar todos los procedimientos disponibles
   */
  getAll(): Observable<Procedure[]> {
    return this.http.get<Procedure[]>(
      this.apiUrl,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Crear nuevo procedimiento (ADMIN)
   */
  create(data: { name: string; description?: string; cost: number }): Observable<Procedure> {
    return this.http.post<Procedure>(
      this.apiUrl,
      data,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Actualizar procedimiento (ADMIN)
   */
  update(id: number, data: { name: string; description?: string; cost: number }): Observable<Procedure> {
    return this.http.put<Procedure>(
      `${this.apiUrl}/${id}`,
      data,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Eliminar procedimiento (ADMIN)
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  // ==================== ASIGNACIÓN DE PROCEDIMIENTOS ====================

  /**
   * Asignar procedimiento a paciente (NURSE/DOCTOR)
   */
  assignToPatient(data: AssignProcedureDto): Observable<ProcedureRecord> {
    return this.http.post<ProcedureRecord>(
      `${this.apiUrl}/assign`,
      data,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener historial de procedimientos de un paciente
   */
  getByPatient(patientId: number): Observable<ProcedureRecord[]> {
    return this.http.get<ProcedureRecord[]>(
      `${this.apiUrl}/patient/${patientId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Listar todos los registros de procedimientos
   */
  getAllRecords(): Observable<ProcedureRecord[]> {
    return this.http.get<ProcedureRecord[]>(
      'http://localhost:3000/api/procedure-records', // ⬅️ Ajusta tu URL
      { headers: this.getHeaders() }
    );
  }
}