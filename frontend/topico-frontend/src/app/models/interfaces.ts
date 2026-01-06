// src/app/models/interfaces.ts

export interface Patient {
  id: number;
  dni: string;
  first_name: string;
  last_name: string;
  age?: number;
  phone?: string;
  address?: string;
  antecedents?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Appointment {
  id: number;
  patient_id: number;
  date: Date;
  status: AppointmentStatus;
  reason?: string;
  created_at: Date;
  updated_at: Date;
  patient?: Patient;
  vitalSigns?: VitalSigns; // ⬅️ NUEVO
}

export type AppointmentStatus = 'SCHEDULED' | 'ATTENDED' | 'CANCELLED';

// ⬅️ NUEVA INTERFACE
export interface VitalSigns {
  id: number;
  appointment_id: number;
  patient_id: number;
  nurse_id: number;
  blood_pressure?: string;      // Ej: "120/80"
  heart_rate?: number;           // Latidos por minuto
  respiratory_rate?: number;     // Respiraciones por minuto
  temperature?: number;          // Grados Celsius
  weight?: number;               // Kilogramos
  height?: number;               // Centímetros
  oxygen_saturation?: number;    // SO2 en porcentaje
  observations?: string;
  created_at: Date;
  updated_at: Date;
  appointment?: Appointment;
  patient?: Patient;
  nurse?: {
    id: number;
    full_name: string;
  };
}

// ⬅️ DTO para crear/actualizar signos vitales
export interface VitalSignsCreateDto {
  appointment_id: number;
  patient_id: number;
  blood_pressure?: string;
  heart_rate?: number;
  respiratory_rate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  oxygen_saturation?: number;
  observations?: string;
}

export interface VitalSignsUpdateDto {
  blood_pressure?: string;
  heart_rate?: number;
  respiratory_rate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  oxygen_saturation?: number;
  observations?: string;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: 'ADMIN' | 'DOCTOR' | 'NURSE';
  signature?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Consultation {
  id: number;
  patient_id: number;
  doctor_id: number;
  diagnosis: string;
  observations?: string;
  treatment?: string;
  created_at: Date;
  updated_at: Date;
  patient?: Patient;
  doctor?: User;
}