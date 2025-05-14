import { Component, Input } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-modifier',
  templateUrl: './modifier.component.html',
  styleUrls: ['./modifier.component.scss'],
  providers: [MessageService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToastModule
  ],
  standalone: true
})
export class ModifierComponent {
  @Input() user: any;
  editForm: FormGroup;
  roles: string[] = ['ENTREPRENEUR', 'COACH', 'SUPERADMIN', 'INVESTOR'];
  errorMessage: string = '';

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private http: HttpClient,
    private messageService: MessageService
  ) {
    this.editForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.editForm.patchValue({
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      phoneNumber: this.user.phoneNumber,
      email: this.user.email,
      role: this.user.role
    });
  }

  onSubmit(): void {
    if (this.editForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Veuillez remplir tous les champs correctement.'
      });
      return;
    }

    const updatedUser = {
      firstName: this.editForm.value.firstName,
      lastName: this.editForm.value.lastName,
      phoneNumber: this.editForm.value.phoneNumber,
      email: this.editForm.value.email,
    };

    console.log('Updated User Data:', updatedUser); // Debug log

    // Get the token from localStorage (assuming you're using JWT authentication)
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.patch(`http://localhost:8085/users/update/${this.user.id}`, updatedUser, { headers }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Utilisateur modifié avec succès ! Un email de notification a été envoyé.'
        });
        this.activeModal.close('updated');
      },
      error: (error) => {
        if (error.status === 404) {
          this.errorMessage = 'Utilisateur non trouvé. Il a peut-être été supprimé.';
        } else if (error.status === 403) {
          this.errorMessage = 'Accès refusé. Vous devez être un SuperAdmin pour modifier un utilisateur.';
        } else if (error.status === 400) {
          this.errorMessage = error.error?.message || 'Erreur de validation. Veuillez vérifier vos informations.';
        } else if (error.status === 409) {
          this.errorMessage = error.error?.message || 'Cet email est déjà utilisé par un autre utilisateur ou l\'utilisateur a été modifié par une autre transaction. Veuillez réessayer.';
        } else if (error.status === 500) {
          this.errorMessage = error.error?.error || 'Échec de la modification de l\'utilisateur. Une erreur serveur est survenue.';
        } else {
          this.errorMessage = 'Échec de la modification de l\'utilisateur. Veuillez réessayer.';
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: this.errorMessage
        });
      }
    });
  }

  closeModal(): void {
    this.activeModal.dismiss('cancel');
  }
}