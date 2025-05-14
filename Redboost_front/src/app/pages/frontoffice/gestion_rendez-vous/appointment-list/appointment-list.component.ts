import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoachService } from '../coach.service';
import { AppointmentsListComponent } from '../appointments-list/appointments-list.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateAppointmentModalComponent } from '../Formulaire/simple-appointment-modal.component';
import { AppointmentService } from '../../service/appointment.service';
import { RendezVous } from '../../../../models/rendez-vous.model';
import { ToastrService } from 'ngx-toastr';
import { catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { UserService } from '../../service/UserService';
import { HttpErrorResponse } from '@angular/common/http';

interface Coach {
    id: number;
    name: string;
    specialty: string;
    email: string;
    phoneNumber: string;
    specialization: string;
    status?: string;
    profile_pictureurl?: string;
    firstName?: string;
    lastName?: string;
}

@Component({
    selector: 'app-appointments-appointment-list',
    standalone: true,
    imports: [CommonModule, FormsModule, AppointmentsListComponent, NgxPaginationModule],
    templateUrl: './appointment-list.component.html',
    styleUrls: ['./appointment-list.component.scss']
})
export class AppointmentListComponent implements OnInit, OnDestroy {
    coaches: Coach[] = [];
    filteredCoaches: Coach[] = [];
    searchTerm: string = '';
    selectedSpecialization: string = '';
    specializations: string[] = [];
    selectedMonth = new Date();
    private isSubmitting: boolean = false;

    page: number = 1;
    itemsPerPage: number = 4;
    totalPages: number = 0;

    private paginationInterval: any;

    constructor(
        private coachService: CoachService,
        private modalService: NgbModal,
        private appointmentService: AppointmentService,
        private toastr: ToastrService,
        private router: Router,
        private userService: UserService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.loadCoaches();
        this.startAutoPagination();
    }

    loadCoaches() {
        this.coachService.getCoaches().subscribe({
            next: (data) => {
                Promise.all(data.map((coach) => this.fetchCoachWithAvatar(coach))).then((coaches) => {
                    this.coaches = coaches;
                    this.filteredCoaches = [...this.coaches];
                    this.specializations = [...new Set(this.coaches.map((coach) => coach.specialization))];
                    this.calculateTotalPages();
                    this.cdr.detectChanges();
                });
            }
        });
    }

    private async fetchCoachWithAvatar(coach: any): Promise<Coach> {
        return new Promise((resolve) => {
            this.userService.getUserById(coach.id).subscribe({
                next: (user) => {
                    const coachData: Coach = {
                        id: coach.id,
                        name: `${coach.firstName} ${coach.lastName}`,
                        firstName: coach.firstName,
                        lastName: coach.lastName,
                        specialty: coach.specialization || 'Non spécifié',
                        specialization: coach.specialization || 'Non spécifié',
                        email: coach.email,
                        phoneNumber: coach.phoneNumber,
                        status: coach.status || 'active',
                        profile_pictureurl: user?.profile_pictureurl
                    };
                    resolve(coachData);
                },
                error: (err) => {
                    const coachData: Coach = {
                        id: coach.id,
                        name: `${coach.firstName} ${coach.lastName}`,
                        firstName: coach.firstName,
                        lastName: coach.lastName,
                        specialty: coach.specialization || 'Non spécifié',
                        specialization: coach.specialization || 'Non spécifié',
                        email: coach.email,
                        phoneNumber: coach.phoneNumber,
                        status: coach.status || 'active',
                        profile_pictureurl: undefined
                    };
                    resolve(coachData);
                }
            });
        });
    }

    getFirstLetter(name: string): string {
        return name && name.length > 0 ? name.charAt(0).toUpperCase() : 'N/A';
    }

    handleImageError(coach: Coach): void {
        coach.profile_pictureurl = undefined; // Clear the URL to trigger the text avatar
    }

    isCoachActive(coach: Coach): boolean {
        return coach.status === 'active';
    }

    filterCoaches() {
        let tempCoaches = [...this.coaches];

        if (this.selectedSpecialization) {
            tempCoaches = tempCoaches.filter((coach) => coach.specialization.toLowerCase() === this.selectedSpecialization.toLowerCase());
        }

        if (this.searchTerm) {
            const searchTermLower = this.searchTerm.toLowerCase();
            tempCoaches = tempCoaches.filter((coach) => (coach.name || '').toLowerCase().includes(searchTermLower) || (coach.specialization || '').toLowerCase().includes(searchTermLower));
        }

        this.filteredCoaches = tempCoaches;
        this.calculateTotalPages();
        this.page = 1;
        this.restartAutoPagination();
    }

    calculateTotalPages() {
        this.totalPages = Math.ceil(this.filteredCoaches.length / this.itemsPerPage);
    }

    startAutoPagination() {
        this.paginationInterval = setInterval(() => {
            if (this.page < this.totalPages) {
                this.page++;
            } else {
                this.page = 1;
            }
            this.cdr.detectChanges();
        }, 5000);
    }

    restartAutoPagination() {
        this.clearAutoPagination();
        this.startAutoPagination();
    }

    clearAutoPagination() {
        if (this.paginationInterval) {
            clearInterval(this.paginationInterval);
            this.paginationInterval = null;
        }
    }

    prevPage() {
        if (this.page > 1) {
            this.page--;
            this.restartAutoPagination();
        }
    }

    nextPage() {
        if (this.page < this.totalPages) {
            this.page++;
            this.restartAutoPagination();
        }
    }

    goToPage(pageNumber: number) {
        if (pageNumber >= 1 && pageNumber <= this.totalPages) {
            this.page = pageNumber;
            this.restartAutoPagination();
        }
    }

    getPageNumbers(): number[] {
        const pageNumbers: number[] = [];
        for (let i = 1; i <= this.totalPages; i++) {
            pageNumbers.push(i);
        }
        return pageNumbers;
    }

    discoverCoach(coach: Coach) {
        if (this.isSubmitting) return;
        this.router.navigate(['/profile', coach.id]);
    }

    reserveCoach(coach: Coach) {
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        const modalRef = this.modalService.open(CreateAppointmentModalComponent, {
            centered: true,
            size: 'sm',
            backdrop: true,
            keyboard: true
        });

        modalRef.componentInstance.coachId = coach.id;
        modalRef.componentInstance.coachName = `${coach.firstName} ${coach.lastName}`;
        modalRef.componentInstance.coachSpecialization = coach.specialization;

        modalRef.closed.subscribe(() => {
            this.isSubmitting = false;
        });

        modalRef.dismissed.subscribe(() => {
            this.isSubmitting = false;
        });
    }

    addAppointmentToBackendOnly(selectedDate: string, rendezVous: RendezVous) {
        if (!rendezVous.heure) {
            this.toastr.error('Le champ Heure est requis.', 'Erreur');
            return;
        }

        const appointmentData: RendezVous = {
            title: rendezVous.title,
            heure: rendezVous.heure,
            description: rendezVous.description,
            email: rendezVous.email || 'user@example.com',
            date: selectedDate,
            status: 'PENDING'
        };

        this.appointmentService
            .createAppointment(appointmentData, this.getSelectedCoachId())
            .pipe(
                catchError((error) => {
                    this.toastr.error('Échec de la création du rendez-vous : ' + (error.message || 'Erreur inconnue'), 'Erreur');
                    return of(null);
                })
            )
            .subscribe({
                next: (response) => {
                    if (response) {
                        this.toastr.success('Rendez-vous créé avec succès !', 'Succès');
                    }
                },
                error: (error) => console.error('AppointmentList - Erreur inattendue :', error)
            });
    }

    private getSelectedCoachId(): number | undefined {
        return this.coaches.length > 0 ? this.coaches[0].id : undefined;
    }

    ngOnDestroy() {
        this.coaches = [];
        this.filteredCoaches = [];
        this.isSubmitting = false;
        this.clearAutoPagination();
    }
}
