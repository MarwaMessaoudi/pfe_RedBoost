import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-container">
      <div class="modal-content">
        <div class="modal-header">
          <h4 class="modal-title">Créer Un Compte</h4>
          <button class="close-button" (click)="activeModal.dismiss('Cancel')">
            <i class="bi bi-x"></i>
          </button>
        </div>
        <div class="modal-body">
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <!-- First Name -->
            <div class="input-group">
              <label for="firstName">Prénom <span class="required">*</span></label>
              <input
                id="firstName"
                type="text"
                formControlName="firstName"
                placeholder="Entrez votre prénom"
                [ngClass]="{ 'invalid-input': submitted && f['firstName'].errors }"
              />
              <div *ngIf="submitted && f['firstName'].errors" class="error-message">
                Le prénom est requis
              </div>
            </div>

            <!-- Last Name -->
            <div class="input-group">
              <label for="lastName">Nom <span class="required">*</span></label>
              <input
                id="lastName"
                type="text"
                formControlName="lastName"
                placeholder="Entrez votre nom"
                [ngClass]="{ 'invalid-input': submitted && f['lastName'].errors }"
              />
              <div *ngIf="submitted && f['lastName'].errors" class="error-message">
                Le nom est requis
              </div>
            </div>

            <!-- Email -->
            <div class="input-group">
              <label for="email">Email <span class="required">*</span></label>
              <input
                id="email"
                type="email"
                formControlName="email"
                placeholder="Entrez votre email"
                [ngClass]="{ 'invalid-input': submitted && f['email'].errors }"
              />
              <div *ngIf="submitted && f['email'].errors" class="error-message">
                {{ f['email'].errors['required'] ? "L'email est requis" : "Format d'email invalide" }}
              </div>
            </div>

            <!-- Password -->
            <div class="input-group">
              <label for="password">Mot de passe <span class="required">*</span></label>
              <input
                id="password"
                type="password"
                formControlName="password"
                placeholder="Entrez votre mot de passe"
                [ngClass]="{ 'invalid-input': submitted && f['password'].errors }"
              />
              <div *ngIf="submitted && f['password'].errors" class="error-message">
                {{ f['password'].errors['required'] ? 'Le mot de passe est requis' : 'Le mot de passe doit contenir au moins 6 caractères' }}
              </div>
            </div>

            <!-- Phone Number -->
            <div class="input-group">
              <label for="phoneNumber">Numéro de téléphone <span class="required">*</span></label>
              <input
                id="phoneNumber"
                type="text"
                formControlName="phoneNumber"
                placeholder="Entrez votre numéro de téléphone"
                [ngClass]="{ 'invalid-input': submitted && f['phoneNumber'].errors }"
              />
              <div *ngIf="submitted && f['phoneNumber'].errors" class="error-message">
                Le numéro de téléphone est requis
              </div>
            </div>

            <!-- Role Selection -->
            <div class="input-group role-selection">
              <label>C'est Un  <span class="required">*</span></label>
              <div class="radio-group">
                <label>
                  <input type="radio" formControlName="role" value="ENTREPRENEUR" />
                  Entrepreneur
                </label>
                <label>
                  <input type="radio" formControlName="role" value="COACH" />
                  Coach
                </label>
                <label>
                  <input type="radio" formControlName="role" value="INVESTOR" />
                  Investisseur
                </label>

                <label>
                  <input type="radio" formControlName="role" value="ADMIN" />
                  administrateur
                </label>
              </div>
              <div *ngIf="submitted && f['role'].errors" class="error-message">
                Le rôle est requis
              </div>
            </div>

            <!-- Error Message -->
            <div *ngIf="errorMessage" class="error-message global-error">
              {{ errorMessage }}
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancel" (click)="activeModal.dismiss('Cancel')">Annuler</button>
          <button type="submit" class="btn-submit" (click)="onSubmit()" [disabled]="registerForm.invalid">
            S'inscrire
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-container {
      display: flex;
      align-items: center;
      justify-content: center;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.3);
      z-index: 1050 !important;
    }

    .modal-content {
      width: 600px;
      max-width: 90vw;
      max-height: 90vh;
      background: #f5f7fa;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      z-index: 1060 !important;
      color: #333;
      padding: 20px;
      position: relative;
      overflow-y: auto;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .modal-header {
      padding: 20px 30px;
      border-bottom: none;
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1a3c34;
      margin: 0;
    }

    .modal-body {
      padding: 20px 30px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 20px 30px;
      border-top: none;
    }

    .input-group {
      margin-bottom: 20px;
    }

    .input-group label {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 5px;
      display: block;
    }

    .required {
      color: #ff0000;
      font-size: 0.9rem;
    }

    .input-group input,
    .input-group textarea {
      width: 100%;
      padding: 10px 15px;
      font-size: 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 5px;
      background: #fff;
      color: #333;
      transition: border-color 0.3s ease;
    }

    .input-group input:focus,
    .input-group textarea:focus {
      outline: none;
      border-color: #1a73e8;
    }

    .input-group textarea {
      height: 80px;
      resize: vertical;
    }

    .invalid-input {
      border-color: red;
    }

    .error-message {
      color: red;
      font-size: 0.9em;
    }

    .global-error {
      margin-top: 10px;
      text-align: center;
      background-color: rgba(255, 0, 0, 0.1);
      border: 1px solid #ff0000;
      color: #ff0000;
      padding: 10px;
      border-radius: 5px;
      font-size: 0.9rem;
    }

    .close-button {
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
    }

    .close-button:hover {
      color: #333;
    }

    .btn-cancel,
    .btn-submit {
      padding: 10px 20px;
      font-size: 1rem;
      border-radius: 5px;
      border: none;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .btn-cancel {
      background: transparent;
      color: #666;
      border: 1px solid #e0e0e0;
    }

    .btn-cancel:hover {
      background: #e0e0e0;
    }

    .btn-submit {
      background: #1a73e8;
      color: #fff;
    }

    .btn-submit:hover {
      background: #1557b0;
    }

    .btn-submit:disabled {
      background: #b0c4de;
      cursor: not-allowed;
    }

    .radio-group {
      display: flex;
      gap: 15px;
      margin-top: 5px;
    }

    .radio-group label {
      display: flex;
      align-items: center;
      font-size: 0.9rem;
      color: #333;
    }

    .radio-group input {
      margin-right: 5px;
    }
  `]
})
export class SignupModalComponent implements OnInit {
  registerForm: FormGroup;
  submitted = false;
  errorMessage = '';

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private http: HttpClient,
    private messageService: MessageService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phoneNumber: ['', Validators.required],
      role: ['', Validators.required],
    });
  }

  ngOnInit(): void {}

  get f() {
    return this.registerForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    if (this.registerForm.invalid) {
      return;
    }
  
    // Envoi de la requête HTTP pour l'enregistrement
    this.http.post('http://localhost:8085/users/adduser', this.registerForm.value).subscribe({
      next: (response: any) => {
        // Afficher un message de succès
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Utilisateur enregistré avec succès !'
        });
  
        // Fermer la modale et indiquer que la création a réussi
        this.activeModal.close({ success: true, newUser: response });
        
      },
      error: (error) => {
        // Gérer les erreurs spécifiques
        if (error.status === 409) {
          this.errorMessage = 'Cet email est déjà utilisé. Veuillez en choisir un autre.';
        } else if (error.status === 400) {
          this.errorMessage = 'Erreur de validation. Veuillez vérifier vos informations.';
        } else {
          this.errorMessage = 'Échec de l\'inscription. Veuillez réessayer.';
        }
  
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: this.errorMessage
        });
      }
    });
  }
}