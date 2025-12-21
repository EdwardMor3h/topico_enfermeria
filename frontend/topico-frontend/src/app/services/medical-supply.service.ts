import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MedicalSupply {
  id: number;
  name: string;
  description?: string;
  stock: number;
  unit_price: number;
  expiration?: Date;
  supplier?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSupplyDTO {
  name: string;
  description?: string;
  stock: number;
  unit_price: number;
  expiration?: string;
  supplier?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MedicalSupplyService {
  private apiUrl = `${environment.apiUrl}/medical-supplies`;

  constructor(private http: HttpClient) {
    console.log('🔗 API URL:', this.apiUrl); // ✅ Para debug
  }

  /**
   * Listar todos los suministros
   */
  getAll(): Observable<MedicalSupply[]> {
    console.log('📡 Llamando a:', `${this.apiUrl}`);
    return this.http.get<MedicalSupply[]>(this.apiUrl);
  }

  /**
   * Obtener un suministro por ID
   */
  getById(id: number): Observable<MedicalSupply> {
    return this.http.get<MedicalSupply>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear nuevo suministro
   */
  create(data: CreateSupplyDTO): Observable<MedicalSupply> {
    console.log('📤 Enviando datos:', data);
    return this.http.post<MedicalSupply>(this.apiUrl, data);
  }

  /**
   * Actualizar suministro
   */
  update(id: number, data: Partial<CreateSupplyDTO>): Observable<MedicalSupply> {
    return this.http.put<MedicalSupply>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Eliminar suministro
   */
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener suministros con stock bajo (menos de 10)
   */
  getLowStock(): Observable<MedicalSupply[]> {
    return this.http.get<MedicalSupply[]>(`${this.apiUrl}/low-stock`);
  }
}