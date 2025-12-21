import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SaleDetail {
  id?: number;
  medicalSupply_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  medicalSupply?: any;
}

export interface Sale {
  id: number;
  patient_id?: number;
  customer_name?: string;
  customer_dni?: string;
  total: number;
  payment: string;
  created_at: Date;
  patient?: any;
  details: SaleDetail[];
}

export interface CreateSaleDTO {
  patient_id?: number;
  customer_name?: string;
  customer_dni?: string;
  payment: string;
  details: {
    medicalSupply_id: number;
    quantity: number;
    unit_price: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private apiUrl = `${environment.apiUrl}/sales`;

  constructor(private http: HttpClient) {}

  /**
   * Crear nueva venta (descuenta stock automáticamente)
   */
  create(data: CreateSaleDTO): Observable<Sale> {
    return this.http.post<Sale>(this.apiUrl, data);
  }

  /**
   * Listar todas las ventas
   */
  getAll(): Observable<Sale[]> {
    return this.http.get<Sale[]>(this.apiUrl);
  }

  /**
   * Obtener venta por IDs
   */
  getById(id: number): Observable<Sale> {
    return this.http.get<Sale>(`${this.apiUrl}/${id}`);
  }

  /**
   * Estadísticas de ventas
   */
  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats/summary`);
  }
}