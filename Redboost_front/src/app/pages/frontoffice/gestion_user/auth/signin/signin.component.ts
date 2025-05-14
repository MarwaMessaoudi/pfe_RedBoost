import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AuthService } from '../../../service/auth.service';
import { environment } from '../../../../../../environment';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-signin',
    standalone: true,
    imports: [ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, CommonModule],
    templateUrl: './signin.component.html',
    styleUrls: ['./signin.component.scss']
})
export class SigninComponent {
    email: string = '';
    password: string = '';
    selectedRole: string = '';
    isSubmitted: boolean = false;
    isGoogleSubmitted: boolean = false;
    loginError: string | null = null;
    errorMessage: string | null = null;

    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    onLogin() {
        this.isSubmitted = true;
        this.loginError = null;
        this.errorMessage = null;

        if (!this.email || !this.password) {
            this.errorMessage = 'Email et mot de passe requis';
            return;
        }

        console.log('Attempting login with email:', this.email);
        this.authService.login(this.email, this.password).subscribe({
            next: (response) => {
                console.log('Login successful:', response);
                const accessToken = response.accessToken;
                const refreshToken = response.refreshToken;

                if (accessToken) {
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', refreshToken);
                }

                this.router.navigate(['dashboard']);
            },
            error: (error) => {
                console.error('Login failed:', error);
                let errorMessage = 'Échec de la connexion';
                this.loginError = null;

                if (error.error && typeof error.error === 'object') {
                    this.loginError = error.error.errorCode;
                    switch (error.error.errorCode) {
                        case 'AUTH008': // Incorrect email
                        case 'AUTH010': // Incorrect password
                            errorMessage = 'Coordonnées incorrectes';
                            break;
                        case 'AUTH017':
                            errorMessage = 'Veuillez confirmer votre email avant de vous connecter';
                            break;
                        case 'AUTH009':
                            errorMessage = error.error.message || 'Échec de l’authentification';
                            break;
                        default:
                            errorMessage = 'Une erreur inattendue s’est produite';
                    }
                } else {
                    errorMessage = 'Erreur serveur ou réseau';
                    console.error('Unexpected error format:', error);
                }

                this.errorMessage = errorMessage;
            }
        });
    }

    resendConfirmationEmail() {
        this.authService.resendConfirmationEmail(this.email).subscribe({
            next: () => {
                this.router.navigate(['/confirm-email'], { queryParams: { email: this.email } });
            },
            error: (error) => {
                console.error('Failed to resend confirmation email:', error);
                this.errorMessage = 'Échec de l’envoi de l’email de confirmation';
            }
        });
    }

    async onGoogleLogin() {
        this.isGoogleSubmitted = true;
        this.loginError = null;
        this.errorMessage = null;

        if (!this.selectedRole) {
            this.errorMessage = 'Veuillez sélectionner un rôle';
            return;
        }

        console.log('Firebase initialized with config:', environment.firebaseConfig);

        (await this.authService.googleLogin(this.selectedRole)).subscribe({
            next: (response: any) => {
                console.log('Google login successful:', response);
                const accessToken = response.accessToken;
                const refreshToken = response.refreshToken;

                if (accessToken) {
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', refreshToken);
                }

                this.router.navigate(['dashboard']);
            },
            error: (error: any) => {
                console.error('Google login failed:', error);
                this.errorMessage = 'Échec de la connexion Google';
            }
        });
    }
}
