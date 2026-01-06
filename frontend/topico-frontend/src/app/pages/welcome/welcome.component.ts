// ========================================
// 📁 pages/welcome/welcome.component.ts
// ========================================
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {
  
  currentUser: any = null;
  currentTime: string = '';
  greeting: string = '';
  
  constructor(public auth: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.auth.getCurrentUser();
    this.updateTime();
    this.setGreeting();
    
    // Actualizar hora cada minuto
    setInterval(() => {
      this.updateTime();
    }, 60000);
  }

  updateTime() {
    const now = new Date();
    this.currentTime = now.toLocaleString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  setGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.greeting = 'Buenos días';
    } else if (hour < 19) {
      this.greeting = 'Buenas tardes';
    } else {
      this.greeting = 'Buenas noches';
    }
  }

  getRoleName(): string {
    const role = this.currentUser?.role;
    const roleNames: { [key: string]: string } = {
      'ADMIN': 'Administrador',
      'DOCTOR': 'Doctor',
      'NURSE': 'Enfermera'
    };
    return roleNames[role] || 'Usuario';
  }

  getQuickAccess() {
    const role = this.currentUser?.role;
    
    if (role === 'ADMIN') {
      return [
        { icon: '📊', title: 'Dashboard Completo', description: 'Ver estadísticas generales', link: '/dashboard' },
        { icon: '👥', title: 'Gestionar Pacientes', description: 'Registros de pacientes', link: '/patients' },
        { icon: '📅', title: 'Gestionar Citas', description: 'Administrar citas médicas', link: '/appointments' },
        { icon: '💊', title: 'Inventario', description: 'Control de medicamentos', link: '/inventory' }
      ];
    } else if (role === 'DOCTOR') {
      return [
        { icon: '📅', title: 'Mis Citas del Día', description: 'Ver pacientes pendientes', link: '/doctor/appointments' },
        { icon: '📋', title: 'Historias Clínicas', description: 'Consultar historiales', link: '/patients' },
        { icon: '🩺', title: 'Procedimientos', description: 'Registrar procedimientos', link: '/procedure-records' }
      ];
    } else if (role === 'NURSE') {
      return [
        { icon: '👥', title: 'Pacientes', description: 'Gestionar pacientes', link: '/patients' },
        { icon: '📅', title: 'Citas', description: 'Registrar y gestionar citas', link: '/appointments' },
        { icon: '🩺', title: 'Procedimientos', description: 'Ver procedimientos', link: '/procedure-records' },
        { icon: '💰', title: 'Ventas', description: 'Registrar ventas', link: '/sales' }
      ];
    }
    
    return [];
  }
}