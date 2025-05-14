import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

// Validateur personnalisé pour vérifier que la date n'est pas antérieure à aujourd'hui
function minDateValidator(): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
        if (!control.value) return null; // Si aucune valeur, laisser les autres validateurs gérer (ex. required)
        const selectedDate = new Date(control.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer uniquement les dates
        return selectedDate >= today ? null : { minDate: true };
    };
}

@Component({
    selector: 'app-edit-appointment-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
        <div class="modal-container" [@fadeAnimation]>
            <div class="modal-content" [@slideAnimation]>
                <div class="modal-header">
                    <h4 class="modal-title">Modifier le rendez-vous</h4>
                    <button class="close-button" (click)="activeModal.dismiss()">×</button>
                </div>
                <div class="modal-body">
                    <form [formGroup]="form" (ngSubmit)="onSave()">
                        <div class="input-group">
                            <label for="title">Titre <span class="required">*</span></label>
                            <input id="title" type="text" class="form-control" formControlName="title" required placeholder="Entrez le titre du rendez-vous" />
                            <div *ngIf="form.get('title')?.hasError('required') && form.get('title')?.touched" class="error-message">Le titre est requis.</div>
                        </div>
                        <div class="input-row">
                            <div class="input-group half">
                                <label for="date">Date <span class="required">*</span></label>
                                <div class="input-with-icon">
                                    <input id="date" type="date" class="form-control" formControlName="date" required [min]="minDate" />
                                    <div *ngIf="form.get('date')?.hasError('required') && form.get('date')?.touched" class="error-message">La date est requise.</div>
                                    <div *ngIf="form.get('date')?.hasError('minDate') && form.get('date')?.touched" class="error-message">La date ne peut pas être antérieure à aujourd'hui.</div>
                                </div>
                            </div>
                            <div class="input-group half">
                                <label for="heure">Heure <span class="required">*</span></label>
                                <div class="input-with-icon">
                                    <input id="heure" type="time" class="form-control" formControlName="heure" required />
                                    <div *ngIf="form.get('heure')?.hasError('required') && form.get('heure')?.touched" class="error-message">L'heure est requise.</div>
                                </div>
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="description">Description</label>
                            <textarea id="description" class="form-control" formControlName="description" placeholder="Ajoutez une description" rows="4"></textarea>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn-cancel" (click)="activeModal.dismiss()">Annuler</button>
                            <button type="submit" class="btn-save" [disabled]="form.invalid">Enregistrer</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            /* Animations */
            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            @keyframes slideIn {
                from {
                    transform: translateY(-20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            /* Container styles */
            .modal-container {
                display: flex;
                align-items: center;
                justify-content: center;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1050;
                animation: fadeIn 0.3s ease-out;
                backdrop-filter: blur(5px);
            }

            .modal-content {
                width: 90%;
                max-width: 600px;
                background: #ffffff;
                border-radius: 15px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                animation: slideIn 0.3s ease-out;
                overflow: hidden;
            }

            /* Header styles */
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 30px;
                background: #f8f9fa;
                border-bottom: 1px solid #eee;
            }

            .modal-title {
                font-size: 1.5rem;
                font-weight: 600;
                color: #245c67;
                margin: 0;
            }

            .close-button {
                background: none;
                border: none;
                font-size: 1.5rem;
                color: #666;
                cursor: pointer;
                padding: 0;
                transition: color 0.3s ease;
            }

            .close-button:hover {
                color: #245c67;
            }

            /* Form styles */
            .modal-body {
                padding: 30px;
            }

            .input-group {
                margin-bottom: 25px;
            }

            .input-row {
                display: flex;
                gap: 20px;
                margin-bottom: 25px;
            }

            .half {
                flex: 1;
            }

            label {
                display: block;
                font-size: 0.95rem;
                color: #444;
                margin-bottom: 8px;
                font-weight: 500;
            }

            .required {
                color: #dc3545;
                margin-left: 3px;
            }

            .input-with-icon {
                position: relative;
            }

            .input-with-icon i {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                color: #666;
                pointer-events: none;
            }

            .form-control {
                width: 100%;
                padding: 12px 15px;
                font-size: 1rem;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                background: #fff;
                transition: all 0.3s ease;
            }

            .form-control:focus {
                outline: none;
                border-color: #245c67;
                box-shadow: 0 0 0 3px rgba(36, 92, 103, 0.1);
            }

            textarea.form-control {
                min-height: 100px;
                resize: vertical;
            }

            .error-message {
                color: #dc3545;
                font-size: 0.85rem;
                margin-top: 5px;
            }

            /* Button styles */
            .modal-footer {
                display: flex;
                justify-content: flex-end;
                gap: 15px;
                padding: 20px 30px;
                background: #f8f9fa;
                border-top: 1px solid #eee;
            }

            .btn-cancel,
            .btn-save {
                padding: 12px 25px;
                font-size: 1rem;
                font-weight: 500;
                border-radius: 8px;
                border: none;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .btn-cancel {
                background: #f8f9fa;
                color: #666;
                border: 2px solid #e0e0e0;
            }

            .btn-cancel:hover {
                background: #e9ecef;
                border-color: #ddd;
            }

            .btn-save {
                background: #245c67;
                color: white;
                position: relative;
                overflow: hidden;
            }

            .btn-save:not(:disabled):hover {
                background: #1d4951;
                transform: translateY(-1px);
            }

            .btn-save:disabled {
                background: #b0c4de;
                cursor: not-allowed;
                opacity: 0.7;
            }

            /* Responsive styles */
            @media (max-width: 576px) {
                .modal-content {
                    width: 95%;
                    margin: 10px;
                }

                .input-row {
                    flex-direction: column;
                    gap: 15px;
                }

                .modal-header,
                .modal-body,
                .modal-footer {
                    padding: 15px;
                }

                .btn-cancel,
                .btn-save {
                    width: 100%;
                }

                .modal-footer {
                    flex-direction: column-reverse;
                }
            }
        `
    ],
    animations: [
        trigger('fadeAnimation', [transition(':enter', [style({ opacity: 0 }), animate('300ms ease-out', style({ opacity: 1 }))]), transition(':leave', [animate('300ms ease-in', style({ opacity: 0 }))])]),
        trigger('slideAnimation', [
            transition(':enter', [style({ transform: 'translateY(-20px)', opacity: 0 }), animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))]),
            transition(':leave', [animate('300ms ease-in', style({ transform: 'translateY(-20px)', opacity: 0 }))])
        ])
    ]
})
export class EditAppointmentModalComponent implements OnInit {
    @Input() form: FormGroup = new FormGroup({});
    minDate: string;

    constructor(
        public activeModal: NgbActiveModal,
        private fb: FormBuilder
    ) {
        // Calculer la date d'aujourd'hui au format YYYY-MM-DD
        const today = new Date();
        this.minDate = today.toISOString().split('T')[0];

        // Si le formulaire n'est pas passé via @Input, initialiser un formulaire par défaut
        if (!this.form.controls['date']) {
            this.form = this.fb.group({
                title: ['', Validators.required],
                date: ['', [Validators.required, minDateValidator()]],
                heure: ['', Validators.required],
                description: ['']
            });
        }
    }

    ngOnInit(): void {
        // Appliquer le validateur minDateValidator si le formulaire est passé via @Input
        const dateControl = this.form.get('date');
        if (dateControl && !dateControl.hasValidator(minDateValidator())) {
            dateControl.setValidators([Validators.required, minDateValidator()]);
            dateControl.updateValueAndValidity();
        }
    }

    onSave() {
        if (this.form.valid) {
            const updatedAppointment = {
                ...this.form.value,
                email: 'default@email.com' // Valeur par défaut pour l'email
            };
            this.activeModal.close(updatedAppointment);
        }
    }
}
