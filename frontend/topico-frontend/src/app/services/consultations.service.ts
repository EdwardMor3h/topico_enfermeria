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

  // Crear consulta
  create(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // Listar todas
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Por paciente
  getByPatient(patientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  // Obtener una consulta por ID
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // ✅ Método alternativo si usabas este nombre
  createFromAppointment(appointmentId: number, data: any): Observable<any> {
    // Este método puede simplemente llamar a create() si no necesitas lógica especial
    return this.create(data);
  }
}