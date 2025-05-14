import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { catchError, of } from 'rxjs';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './forgotpassword.component.html',
    styleUrls: ['./forgotpassword.component.scss']
})
export class ForgotPasswordComponent {
    forgotForm: FormGroup;
    isLoading = false;
    successMessage = '';
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        private router: Router
    ) {
        this.forgotForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    onSubmit() {
        if (this.forgotForm.invalid) {
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';

        this.http
            .post<any>('http://localhost:8085/Auth/forgot-password', { email: this.forgotForm.value.email })
            .pipe(
                catchError((error) => {
                    this.isLoading = false;
                    this.errorMessage = error.error?.message || 'An error occurred. Please try again.';
                    return of(null);
                })
            )
            .subscribe((response) => {
                this.isLoading = false;
                if (response) {
                    this.successMessage = 'A password reset link has been sent to your email. Please check your inbox (and spam/junk folder).';
                    this.forgotForm.reset();
                    // Removed the automatic redirect
                }
            });
    }
}
