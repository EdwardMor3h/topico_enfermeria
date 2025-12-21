import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  // Mock manual de AuthService
  const mockAuthService = {
    login: vi.fn().mockReturnValue(of({ token: 'fake-token' }))
  };

  // Mock manual del Router
  const mockRouter = {
    navigate: vi.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('Debe llamar al login del AuthService', () => {
    component.email = 'admin@demo.com';
    component.password = '123456';

    component.login();

    expect(mockAuthService.login).toHaveBeenCalledWith(
      'admin@demo.com',
      '123456'
    );
  });

  it('Debe navegar al dashboard después del login', () => {
    component.email = 'admin@demo.com';
    component.password = '123456';

    component.login();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
