import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login() {
    this.authService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        localStorage.setItem('token', response.token);

        // ✅ SIEMPRE AL ROOT
        this.router.navigateByUrl('/');
      },
      error: (err: any) => {
        this.errorMessage = err.error?.error || 'Credenciales incorrectas';
      },
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
