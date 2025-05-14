import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppointmentService } from '../../service/appointment.service';

import { RendezVous } from '../../../../models/rendez-vous.model';
import { catchError, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { trigger, transition, style, animate } from '@angular/animations';
import { Router } from '@angular/router'; // Import Router for navigation
@Component({
    selector: 'app-create-appointment-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
        <div class="modal-container" [@fadeAnimation]>
            <div class="modal-content" [@slideAnimation]>
                <div class="modal-header">
                    <h4 class="modal-title">Créer un rendez-vous</h4>
                    <button class="close-button" (click)="activeModal.dismiss('Cross click')">×</button>
                </div>
                <div class="modal-body">
                    <form [formGroup]="createForm" (ngSubmit)="onSubmit()">
                        <div class="input-group">
                            <label for="title">Titre <span class="required">*</span></label>
                            <input id="title" type="text" class="form-control" formControlName="title" required placeholder="Entrez le titre du rendez-vous" />
                        </div>
                        <div class="input-row">
                            <div class="input-group half">
                                <label for="date">Date <span class="required">*</span></label>
                                <div class="input-with-icon">
                                    <input id="date" type="date" class="form-control" formControlName="date" [min]="minDate" required />
                                </div>
                            </div>
                            <div class="input-group half">
                                <label for="heure">Heure <span class="required">*</span></label>
                                <div class="input-with-icon">
                                    <input id="heure" type="time" class="form-control" formControlName="heure" required />
                                </div>
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="description">Description</label>
                            <textarea id="description" class="form-control" formControlName="description" placeholder="Ajoutez une description (optionnel)" rows="4"></textarea>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn-cancel" (click)="activeModal.dismiss('Cancel')">Annuler</button>
                            <button type="submit" class="btn-submit" [disabled]="createForm.invalid || isSubmitting" [class.loading]="isSubmitting">
                                {{ isSubmitting ? 'Création...' : 'Créer' }}
                            </button>
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
            .btn-submit {
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

            .btn-submit {
                background: #245c67;
                color: white;
                position: relative;
                overflow: hidden;
            }

            .btn-submit:not(:disabled):hover {
                background: #1d4951;
                transform: translateY(-1px);
            }

            .btn-submit:disabled {
                background: #b0c4de;
                cursor: not-allowed;
                opacity: 0.7;
            }

            .btn-submit.loading {
                padding-right: 45px;
            }

            .btn-submit.loading::after {
                content: '';
                position: absolute;
                right: 15px;
                top: 50%;
                transform: translateY(-50%);
                width: 20px;
                height: 20px;
                border: 3px solid #fff;
                border-top-color: transparent;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            }

            @keyframes spin {
                to {
                    transform: translateY(-50%) rotate(360deg);
                }
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
                .btn-submit {
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
export class CreateAppointmentModalComponent implements OnInit {
    @Input() coachId?: number;
    createForm!: FormGroup;
    isSubmitting: boolean = false;
    minDate: string;

    constructor(
        public activeModal: NgbActiveModal,
        private fb: FormBuilder,
        private appointmentService: AppointmentService,
        private toastr: ToastrService,
        private router: Router // Inject Router
    ) {
        const today = new Date();
        this.minDate = today.toISOString().split('T')[0];
    }

    ngOnInit() {
        this.createForm = this.fb.group({
            title: ['', Validators.required],
            date: ['', Validators.required],
            heure: ['', Validators.required],
            description: [''],
            status: ['PENDING']
        });
    }

    onSubmit(): void {
        if (this.createForm.valid && !this.isSubmitting) {
            this.isSubmitting = true;

            const formValues = this.createForm.value;
            const dateStr = formValues.date;
            const timeStr = formValues.heure;

            const newAppointment: RendezVous = {
                ...formValues,
                date: dateStr,
                heure: timeStr,
                email: 'default@email.com' // Valeur par défaut
            };

            if (!this.coachId) {
                this.toastr.error('Aucun coach sélectionné.', 'Erreur');
                this.isSubmitting = false;
                return;
            }

            this.appointmentService
                .createAppointment(newAppointment, this.coachId)
                .pipe(
                    catchError((error) => {
                        if (error.status === 400) {
                            const errorMessage = error.error?.message || "Cette heure n'est pas disponible ou trop proche d'un rendez-vous existant.";
                            this.toastr.error(errorMessage, 'Erreur');
                        } else {
                            this.toastr.error('Échec de la création du rendez-vous : ' + (error.message || 'Erreur inconnue'), 'Erreur');
                        }
                        this.isSubmitting = false;
                        return of(null);
                    })
                )
                .subscribe({
                    next: (response) => {
                        if (response) {
                            this.activeModal.close(response);
                            this.toastr.success('Rendez-vous créé avec succès !', 'Succès');
                            this.router.navigate(['/appointments']);
                        }
                        this.isSubmitting = false;
                    }
                });
        }
    }

    isHourConflict(newAppointmentTime: Date, existingAppointments: RendezVous[]): boolean {
        if (!Array.isArray(existingAppointments)) {
            return false;
        }
        const bufferMinutes = 45;
        const newTime = newAppointmentTime.getHours() * 60 + newAppointmentTime.getMinutes();

        return existingAppointments.some((appointment) => {
            if (!appointment.date || !appointment.heure) return false;

            const [hours, minutes] = appointment.heure.split(':').map(Number);
            const existingTime = hours * 60 + minutes;

            const timeDiff = Math.abs(newTime - existingTime);

            return timeDiff < bufferMinutes || timeDiff === 0;
        });
    }
}
