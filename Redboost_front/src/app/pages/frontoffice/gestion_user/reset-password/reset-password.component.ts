import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { catchError, of } from 'rxjs';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
    resetForm: FormGroup;
    isLoading = false;
    errorMessage = '';
    successMessage = '';
    token = '';

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.resetForm = this.fb.group(
            {
                newPassword: ['', [Validators.required, Validators.minLength(8)]],
                confirmPassword: ['', Validators.required]
            },
            { validator: this.passwordMatchValidator }
        );
    }

    ngOnInit() {
        this.token = this.route.snapshot.queryParamMap.get('token') || '';
        if (!this.token) {
            this.errorMessage = 'No reset token provided. Please request a new password reset link.';
            this.router.navigate(['/forgot-password']);
        }
    }

    passwordMatchValidator(form: FormGroup) {
        return form.get('newPassword')?.value === form.get('confirmPassword')?.value ? null : { mismatch: true };
    }

    onSubmit() {
        if (this.resetForm.invalid) {
            return;
        }
        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';

        this.http
            .post<any>('http://localhost:8085/Auth/reset-password', {
                token: this.token,
                newPassword: this.resetForm.value.newPassword
            })
            .pipe(
                catchError((error) => {
                    this.isLoading = false;
                    this.errorMessage = error.error?.message || 'Failed to reset password. The link may be invalid or expired.';
                    return of(null);
                })
            )
            .subscribe((response) => {
                this.isLoading = false;
                if (response) {
                    this.successMessage = 'Password reset successfully! You can now login with your new password.';
                    this.resetForm.reset();
                }
            });
    }
}
