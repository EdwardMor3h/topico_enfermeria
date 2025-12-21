import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,     // ✅ OBLIGATORIO para *ngIf
    RouterOutlet,
    RouterLink,
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
})
export class LayoutComponent {
  constructor(public auth: AuthService) {}

  logout() {
    localStorage.removeItem('token');
    window.location.href = '/auth';
  }
}
