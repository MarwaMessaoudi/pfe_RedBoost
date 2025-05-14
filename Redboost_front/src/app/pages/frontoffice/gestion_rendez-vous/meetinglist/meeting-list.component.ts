import { Component, OnInit } from '@angular/core';
import { RendezVous } from '../../../../models/rendez-vous.model';
import { AppointmentService } from '../../service/appointment.service';
import { AuthService } from '../../service/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RescheduleAppointmentModalComponent } from '../reschedule-appointment-modal/RescheduleAppointmentModal.component';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-meeting-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="meeting-list-container" @fadeInOut>
            <!-- Dropdown Filter -->
            <div class="filter-container">
                <label for="status-filter" class="filter-label">Filter by Status:</label>
                <select id="status-filter" [(ngModel)]="selectedStatus" (change)="filterByStatus(selectedStatus)" class="filter-select">
                    <option value="TOTAL">Total</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="PENDING">Pending</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            <!-- Rendezvous Cards -->
            <div class="rendezvous-cards">
                <div class="rendezvous-card" *ngFor="let rendezvous of rendezvousList">
                    <!-- Status Marker -->
                    <i
                        class="status-marker fas"
                        [ngClass]="{
                            'fa-times status-rejected': rendezvous.status === 'REJECTED',
                            'fa-check status-accepted': rendezvous.status === 'ACCEPTED',
                            'fa-clock status-pending': rendezvous.status === 'PENDING'
                        }"
                    ></i>

                    <div class="card-header">
                        <img [src]="rendezvous.coach?.profilePictureUrl || 'https://via.placeholder.com/50'" alt="Coach Image" class="coach-image" />
                        <div class="coach-info">
                            <h3>{{ rendezvous.coach?.firstName || 'Unknown' }} {{ rendezvous.coach?.lastName || 'Coach' }}</h3>
                            <p class="coach-email">{{ rendezvous.coach?.email || 'unknown@example.com' }}</p>
                            <p class="rendezvous-title"><strong>Title:</strong> {{ rendezvous.title }}</p>
                            <p class="rendezvous-date"><strong>Date:</strong> {{ formatDate(rendezvous.date) }}</p>
                            <p class="rendezvous-status">
                                <strong>Status:</strong>
                                <span
                                    [ngClass]="{
                                        'status-pending': rendezvous.status === 'PENDING',
                                        'status-accepted': rendezvous.status === 'ACCEPTED',
                                        'status-rejected': rendezvous.status === 'REJECTED'
                                    }"
                                    class="status-label"
                                    >{{ rendezvous.status }}</span
                                >
                            </p>
                            <div class="action-buttons">
                                <button class="reschedule-btn" (click)="rescheduleRendezvous(rendezvous); $event.stopPropagation()">Replanifier</button>
                                <button class="cancel-btn" (click)="cancelRendezvous(rendezvous); $event.stopPropagation()">Supprimer</button>
                            </div>
                        </div>
                    </div>
                </div>
                <p *ngIf="rendezvousList.length === 0" class="no-rendezvous">No rendezvous available.</p>
            </div>
        </div>
    `,
    styles: [
        `
            .meeting-list-container {
                padding: 20px;
                max-width: 1400px;
                margin: 0 auto;
                background: linear-gradient(135deg, #e6f0fa 0%, #fceff4 100%);
            }

            /* Filter Dropdown Styles */
            .filter-container {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 30px;
                justify-content: flex-end;
            }

            .filter-label {
                font-size: 1rem;
                color: #333;
                font-family: 'Poppins', sans-serif;
            }

            .filter-select {
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 5px;
                font-size: 1rem;
                font-family: 'Poppins', sans-serif;
                background: #fff;
                cursor: pointer;
                transition: border-color 0.3s ease;
            }

            .filter-select:focus {
                outline: none;
                border-color: #568086;
            }

            /* Rendezvous Cards Styles */
            .rendezvous-cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                padding: 0 10px;
            }

            .rendezvous-card {
                position: relative;
                background: #fff;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                padding: 15px;
                transition:
                    transform 0.3s ease,
                    box-shadow 0.3s ease;
                cursor: pointer;
            }

            .rendezvous-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
            }

            /* Status Marker Styles */
            .status-marker {
                position: absolute;
                top: 10px;
                right: 10px;
                font-size: 1.2rem;
            }

            .status-pending {
                color: #ff9800;
            }

            .status-accepted {
                color: #28a745;
            }

            .status-rejected {
                color: #dc3545;
            }

            .card-header {
                display: flex;
                align-items: flex-start;
                gap: 15px;
                margin-bottom: 15px;
            }

            .coach-image {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                object-fit: cover;
            }

            .coach-info {
                flex: 1;
            }

            .coach-info h3 {
                margin: 0;
                font-size: 1.2rem;
                color: #0a4955;
                font-family: 'Poppins', sans-serif;
            }

            .coach-email,
            .rendezvous-title,
            .rendezvous-date,
            .rendezvous-status {
                margin: 5px 0 0 0;
                font-size: 0.9rem;
                color: #333;
            }

            /* Common styles for status labels */
            .status-label {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 5px;
                font-weight: bold;
                text-transform: uppercase;
                font-size: 0.8rem;
            }

            .status-pending {
                color: #ff9800;
                background-color: #fff3e0;
            }

            .status-accepted {
                color: #28a745;
                background-color: #e8f5e9;
            }

            .status-rejected {
                color: #dc3545;
                background-color: #ffebee;
            }

            .action-buttons {
                margin-top: 10px;
                display: flex;
                gap: 10px;
            }

            .reschedule-btn,
            .cancel-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 5px;
                font-size: 0.9rem;
                font-family: 'Poppins', sans-serif;
                cursor: pointer;
                transition: background 0.3s ease;
            }

            .reschedule-btn {
                background: #568086;
                color: #fff;
            }

            .reschedule-btn:hover {
                background: #0a4955;
            }

            .cancel-btn {
                background: #ccc;
                color: #333;
            }

            .cancel-btn:hover {
                background: #bbb;
            }

            .no-rendezvous {
                text-align: center;
                color: #555;
                font-style: italic;
                font-size: 1.1rem;
                margin-top: 20px;
            }
        `
    ]
})
export class MeetingListComponent implements OnInit {
    rendezvousList: RendezVous[] = [];
    selectedStatus: 'TOTAL' | 'PENDING' | 'ACCEPTED' | 'REJECTED' = 'TOTAL';
    selectedMeeting: RendezVous | null = null;
    isModalOpen: boolean = false;
    showModal = false;

    constructor(
        private appointmentService: AppointmentService,
        private authService: AuthService,
        private modalService: NgbModal,
        private toastr: ToastrService
    ) {}

    ngOnInit(): void {
        this.loadRendezVous();
    }

    loadRendezVous(): void {
        this.authService.getCurrentUser().subscribe((user) => {
            if (user?.id) {
                this.appointmentService.getUserAppointmentHistory().subscribe({
                    next: (rendezvous) => {
                        this.rendezvousList = rendezvous;
                        this.filterByStatus(this.selectedStatus);
                    },
                    error: (error) => {
                        console.error('Erreur lors du chargement des rendez-vous:', error);
                        this.toastr.error('Erreur lors du chargement des rendez-vous.', 'Erreur');
                    }
                });
            }
        });
    }

    formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleString();
    }

    closeModal(): void {
        this.isModalOpen = false;
        this.selectedMeeting = null;
    }

    filterByStatus(status: string): void {
        this.selectedStatus = status as 'TOTAL' | 'PENDING' | 'ACCEPTED' | 'REJECTED';

        this.authService.getCurrentUser().subscribe((user) => {
            if (user?.id) {
                this.appointmentService.getUserAppointmentHistory().subscribe({
                    next: (rendezvous) => {
                        if (status === 'TOTAL') {
                            this.rendezvousList = rendezvous;
                        } else {
                            this.rendezvousList = rendezvous.filter((r) => r.status === status);
                        }
                    },
                    error: (error) => {
                        console.error('Erreur lors du filtrage des rendez-vous:', error);
                        this.toastr.error('Erreur lors du filtrage des rendez-vous.', 'Erreur');
                    }
                });
            }
        });
    }

    rescheduleRendezvous(rendezvous: RendezVous): void {
        const modalRef = this.modalService.open(RescheduleAppointmentModalComponent, {
            centered: true,
            size: 'lg'
        });

        // Pass the coachId and the appointment to the modal
        modalRef.componentInstance.coachId = rendezvous.coach?.id;
        modalRef.componentInstance.appointment = rendezvous;

        // Handle the result after the modal is closed
        modalRef.result.then(
            (result) => {
                if (result) {
                    // Update the local list with the modified appointment
                    const index = this.rendezvousList.findIndex((r) => r.id === result.id);
                    if (index !== -1) {
                        this.rendezvousList[index] = result;
                    }
                }
            },
            (reason) => {
                // Handle dismissal (e.g., user clicked "Cancel")
                console.log('Modal dismissed:', reason);
            }
        );
    }

    cancelRendezvous(rendezvous: RendezVous): void {
        if (rendezvous.id) {
            this.appointmentService.deleteAppointment(rendezvous.id).subscribe({
                next: () => {
                    // Supprimer le rendez-vous de la liste locale
                    this.rendezvousList = this.rendezvousList.filter((r) => r.id !== rendezvous.id);
                    this.toastr.success('Rendez-vous supprimer avec succès !', 'Succès');
                },
                error: (error) => {
                    console.error("Erreur lors de l'annulation du rendez-vous:", error);
                    this.toastr.error("Échec de l'annulation du rendez-vous : " + (error.message || 'Erreur inconnue'), 'Erreur');
                }
            });
        } else {
            this.toastr.error('ID du rendez-vous manquant.', 'Erreur');
        }
    }
}
