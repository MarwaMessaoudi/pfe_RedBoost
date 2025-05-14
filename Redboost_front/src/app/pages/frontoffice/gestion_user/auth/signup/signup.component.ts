import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../service/auth.service';
import { MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../../environment';
import { DialogModule } from 'primeng/dialog';

@Component({
    selector: 'app-signup',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, DialogModule, RouterModule],
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.scss']
})
export class SignUpComponent {
    registerForm: FormGroup;
    submitted = signal(false);
    errorMessage = signal('');
    selectedRole: string = '';
    displayDialog: boolean = false;
    showRoleError = signal(false);
    passwordStrength = signal<string>(''); // Signal for password strength feedback
    showPassword: boolean = false; // Toggle for password visibility
    showConfirmPassword: boolean = false;

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        private router: Router,
        private authService: AuthService,
        private messageService: MessageService
    ) {
        this.registerForm = this.fb.group(
            {
                firstName: ['', Validators.required],
                lastName: ['', Validators.required],
                email: ['', [Validators.required, Validators.email]],
                password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!])[\w@#$%^&+=!]{8,}$/)]],
                confirmPassword: ['', Validators.required],
                phoneNumber: ['', Validators.required]
            },
            { validators: this.passwordMatchValidator }
        );
    }

    // Getter for form controls
    get f() {
        return this.registerForm.controls;
    }

    // Custom validator to check if password and confirmPassword match
    passwordMatchValidator(form: FormGroup) {
        const password = form.get('password')?.value;
        const confirmPassword = form.get('confirmPassword')?.value;
        return password === confirmPassword ? null : { mismatch: true };
    }

    // Password strength validation helper function
    checkPasswordStrength(password: string): boolean {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!])[\w@#$%^&+=!]{8,}$/;
        return passwordRegex.test(password);
    }

    // Real-time password strength checker
    onPasswordInput() {
        const password = this.registerForm.get('password')?.value;
        if (password) {
            this.passwordStrength.set(this.checkPasswordStrength(password) ? 'Strong' : 'Weak');
        } else {
            this.passwordStrength.set('');
        }
    }

    onRoleChange() {
        if (this.selectedRole) {
            this.showRoleError.set(false);
        }
    }

    onSubmit() {
        this.submitted.set(true);

        if (this.registerForm.invalid || !this.selectedRole) {
            if (!this.selectedRole) {
                this.showRoleError.set(true);
                this.errorMessage.set('Veuillez sélectionner un rôle.');
            }
            return;
        }

        const formValue = {
            firstName: this.registerForm.value.firstName,
            lastName: this.registerForm.value.lastName,
            email: this.registerForm.value.email,
            password: this.registerForm.value.password,
            phoneNumber: this.registerForm.value.phoneNumber,
            role: this.selectedRole
        };

        this.http.post('http://localhost:8085/Auth/register', formValue).subscribe(
            (response: any) => {
                this.router.navigate(['/confirm-email'], { queryParams: { email: this.registerForm.value.email } });
            },
            (error: HttpErrorResponse) => {
                if (error.status === 409 && error.error?.errorCode === 'AUTH011') {
                    this.errorMessage.set("L'utilisateur existe déjà !");
                } else {
                    this.errorMessage.set("L'inscription a échoué. Veuillez réessayer.");
                }
            }
        );
    }

    async onGoogleLogin() {
        if (!this.selectedRole) {
            this.showRoleError.set(true);
            return;
        }

        this.showRoleError.set(false);
        console.log('Firebase initialized with config:', environment.firebaseConfig);

        (await this.authService.googleLogin(this.selectedRole)).subscribe({
            next: (response: any) => {
                const accessToken = response.accessToken;
                const refreshToken = response.refreshToken;

                console.log('Connexion Google réussie:', response);
                if (accessToken) {
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', refreshToken);
                }

                this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Connexion Google réussie' });
                this.router.navigate(['profile']);
            },
            error: (error: any) => {
                console.error('Échec de la connexion Google:', error);
                this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la connexion Google' });
            }
        });
    }

    showDialog() {
        if (!this.selectedRole) {
            this.showRoleError.set(true);
            return;
        }
        this.showRoleError.set(false);
        this.displayDialog = true;
    }
}
