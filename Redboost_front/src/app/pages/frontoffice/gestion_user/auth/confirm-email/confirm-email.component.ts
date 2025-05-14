import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './confirm-email.component.html',
  styleUrls: ['./confirm-email.css'],
})
export class ConfirmEmailComponent {
  confirmForm: FormGroup;
  email: string = '';
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.confirmForm = this.fb.group({
      code: ['', Validators.required],
    });

    // Get email and code from query parameters
    this.route.queryParams.subscribe((params) => {
      this.email = params['email'] || '';
      const code = params['code'] || '';
      if (code) {
        this.confirmForm.patchValue({ code }); // Prefill the code input
      }
    });
  }

  onSubmit() {
    if (this.confirmForm.invalid) {
      return;
    }

    const confirmationRequest = {
      email: this.email,
      code: this.confirmForm.value.code,
    };

    this.errorMessage = null;

    this.http.post('http://localhost:8085/Auth/confirm-email', confirmationRequest).subscribe(
      () => {
        this.router.navigate(['/signin']);
      },
      (error) => {
        this.errorMessage = 'code de confirmation incorrect';
      }
    );
  }
}