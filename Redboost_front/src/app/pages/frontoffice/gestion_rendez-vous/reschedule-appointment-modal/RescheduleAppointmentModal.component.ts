import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppointmentService } from '../../service/appointment.service';
import { RendezVous } from '../../../../models/rendez-vous.model';
import { catchError, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

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
    selector: 'app-reschedule-appointment-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
        <div class="modal-container">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title">Replanifier un rendez-vous</h4>
                </div>
                <div class="modal-body">
                    <form [formGroup]="rescheduleForm" (ngSubmit)="onSubmit()">
                        <div class="input-group">
                            <label for="title">Titre <span class="required">*</span></label>
                            <input id="title" type="text" class="form-control" formControlName="title" required />
                            <div *ngIf="rescheduleForm.get('title')?.hasError('required') && rescheduleForm.get('title')?.touched" class="error-message">Le titre est requis.</div>
                        </div>
                        <div class="input-row">
                            <div class="input-group half">
                                <label for="date">Date <span class="required">*</span></label>
                                <div class="input-with-icon">
                                    <input id="date" type="date" class="form-control" formControlName="date" required [min]="minDate" (change)="checkAvailability()" />
                                    <div *ngIf="rescheduleForm.get('date')?.hasError('required') && rescheduleForm.get('date')?.touched" class="error-message">La date est requise.</div>
                                    <div *ngIf="rescheduleForm.get('date')?.hasError('minDate') && rescheduleForm.get('date')?.touched" class="error-message">La date ne peut pas être antérieure à aujourd'hui.</div>
                                </div>
                            </div>
                            <div class="input-group half">
                                <label for="heure">Heure <span class="required">*</span></label>
                                <div class="input-with-icon">
                                    <input id="heure" type="time" class="form-control" formControlName="heure" (change)="checkAvailability()" required />
                                    <div *ngIf="rescheduleForm.get('heure')?.hasError('required') && rescheduleForm.get('heure')?.touched" class="error-message">L'heure est requise.</div>
                                </div>
                            </div>
                        </div>

                        <div class="input-group">
                            <label for="description">Description</label>
                            <textarea id="description" class="form-control" formControlName="description"></textarea>
                        </div>
                        <div *ngIf="isHourUnavailable" class="alert alert-danger">Cette heure n’est pas disponible ou trop proche d’un rendez-vous existant.</div>
                        <div class="modal-footer">
                            <button type="button" class="btn-cancel" (click)="activeModal.dismiss('Cancel')">Annuler</button>
                            <button type="submit" class="btn-submit" [disabled]="rescheduleForm.invalid || isHourUnavailable || isSubmitting">Mettre à jour</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .modal-container {
                display: flex;
                align-items: center;
                justify-content: center;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.3);
                z-index: 1050 !important;
            }

            .modal-content {
                width: 600px;
                background: #f5f7fa;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                z-index: 1060 !important;
                color: #333;
            }

            .modal-header {
                padding: 20px 30px;
                border-bottom: none;
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

            .input-group {
                margin-bottom: 20px;
            }

            .input-row {
                display: flex;
                gap: 20px;
                margin-bottom: 20px;
            }

            .half {
                flex: 1;
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

            .input-with-icon {
                position: relative;
            }

            .input-with-icon input {
                padding-right: 40px;
            }

            .calendar-icon {
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                color: #666;
                font-size: 1.2rem;
            }

            .calendar-icon svg {
                display: block;
            }

            .alert-danger {
                margin-top: 10px;
                background-color: rgba(255, 0, 0, 0.1);
                border: 1px solid #ff0000;
                color: #ff0000;
                padding: 10px;
                border-radius: 5px;
                font-size: 0.9rem;
            }

            .error-message {
                color: #ff0000;
                font-size: 0.85rem;
                margin-top: 5px;
            }

            .modal-footer {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                padding: 20px 30px;
                border-top: none;
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
        `
    ]
})
export class RescheduleAppointmentModalComponent implements OnInit {
    @Input() coachId!: number;
    @Input() appointment!: RendezVous;
    rescheduleForm!: FormGroup;
    isHourUnavailable: boolean = false;
    acceptedAppointments: RendezVous[] = [];
    isSubmitting: boolean = false;
    minDate: string;

    constructor(
        public activeModal: NgbActiveModal,
        private fb: FormBuilder,
        private appointmentService: AppointmentService,
        private toastr: ToastrService
    ) {
        // Calculer la date d'aujourd'hui au format YYYY-MM-DD
        const today = new Date();
        this.minDate = today.toISOString().split('T')[0];
    }

    ngOnInit() {
        this.rescheduleForm = this.fb.group({
            title: ['', Validators.required],
            date: ['', [Validators.required, minDateValidator()]],
            heure: ['', Validators.required],

            description: [''],
            status: ['PENDING']
        });

        // Pre-fill the form with the existing appointment data
        if (this.appointment) {
            this.rescheduleForm.patchValue({
                title: this.appointment.title,
                date: this.appointment.date,
                heure: this.appointment.heure,

                description: this.appointment.description,
                status: 'PENDING'
            });
        }
    }

    checkAvailability(): void {
        const date = this.rescheduleForm.get('date')?.value;
        const heure = this.rescheduleForm.get('heure')?.value;

        if (date && heure) {
            const fullDateTime = new Date(`${date}T${heure}:00`);
            this.appointmentService.getAcceptedAppointmentsByDate(date).subscribe({
                next: (appointments) => {
                    this.acceptedAppointments = appointments || [];
                    // Exclude the current appointment when checking availability
                    const otherAppointments = this.appointment?.id ? this.acceptedAppointments.filter((app) => app.id !== this.appointment.id) : this.acceptedAppointments;
                    this.isHourUnavailable = this.isHourConflict(fullDateTime, otherAppointments);
                },
                error: (error) => {
                    this.toastr.error('Impossible de vérifier les disponibilités. Veuillez réessayer.', 'Erreur');
                    this.isHourUnavailable = true;
                    this.acceptedAppointments = [];
                }
            });
        }
    }

    isHourConflict(newAppointmentTime: Date, existingAppointments: RendezVous[]): boolean {
        if (!Array.isArray(existingAppointments)) {
            return false;
        }
        const bufferMinutes = 45;
        return existingAppointments.some((appointment) => {
            if (!appointment.date || !appointment.heure) return false;
            const existingTime = new Date(`${appointment.date}T${appointment.heure}:00`);
            const timeDiff = Math.abs(newAppointmentTime.getTime() - existingTime.getTime()) / 60000;
            return timeDiff < bufferMinutes || timeDiff === 0;
        });
    }

    onSubmit(): void {
        if (this.rescheduleForm.valid && !this.isHourUnavailable && !this.isSubmitting) {
            this.isSubmitting = true;
            const updatedAppointment: RendezVous = {
                ...this.rescheduleForm.value,
                id: this.appointment.id
            };

            // Pass the appointment ID and the updated appointment data, as updateAppointment expects 2 arguments
            this.appointmentService
                .updateAppointment(this.appointment.id!, updatedAppointment)
                .pipe(
                    catchError((error) => {
                        if (error.status === 400) {
                            this.toastr.error('Cette heure n’est pas disponible ou trop proche d’un rendez-vous existant.', 'Erreur');
                        } else {
                            this.toastr.error('Échec de la mise à jour du rendez-vous : ' + (error.message || 'Erreur inconnue'), 'Erreur');
                        }
                        this.isSubmitting = false;
                        return of(null);
                    })
                )
                .subscribe({
                    next: (response) => {
                        if (response) {
                            this.activeModal.close(response);
                            this.toastr.success('Rendez-vous mis à jour avec succès !', 'Succès');
                        }
                        this.isSubmitting = false;
                    }
                });
        }
    }
}
