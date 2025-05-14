import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjetService } from '../../service/projet-service.service';
import { CreateAppointmentModalComponent } from './simple-appointment-modal.component';
import { Projet } from '../../../../models/Projet';
import { catchError, of } from 'rxjs';

interface Coach {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    specialization: string;
    experience?: number;
    isAvailable?: boolean;
    isActive?: boolean;
    profilePictureUrl?: string;
    name?: string;
    status?: string;
    projectName?: string;
    projectId?: number;
}

@Component({
    selector: 'app-coach-list',
    standalone: true,
    imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './coach-list.component.html',
    styleUrls: ['./coach-list.component.scss']
})
export class CoachListComponent implements OnInit, OnDestroy {
    @Input() projects: Projet[] = [];
    coaches: Coach[] = [];
    filteredCoaches: Coach[] = [];
    page: number = 1;
    itemsPerPage: number = 2;
    totalPages: number = 0;
    searchTerm: string = '';
    selectedSpecialization: string = '';
    selectedProjectName: string = '';
    specializations: string[] = [];
    projectNames: string[] = [];
    isLoading: boolean = false;
    errorMessage: string = '';
    currentUserId: number | null = null;

    private isSubmitting: boolean = false;
    private autoPaginationInterval: any;
    autoPaginationEnabled: boolean = true;

    constructor(
        private projetService: ProjetService,
        private router: Router,
        private modalService: NgbModal
    ) {}

    ngOnInit(): void {
        this.loadCurrentUserIdAndCoaches();
    }

    async loadCurrentUserIdAndCoaches(): Promise<void> {
        try {
            await this.loadCurrentUserId();
            if (this.currentUserId !== null) {
                this.loadCoaches();
            } else {
                this.errorMessage = "Impossible de charger l'ID de l'utilisateur connecté.";
                this.isLoading = false;
            }
        } catch (error) {
            console.error('Error loading user ID:', error);
            this.errorMessage = "Erreur lors du chargement de l'ID de l'utilisateur connecté.";
            this.isLoading = false;
        }
    }

    private loadCurrentUserId(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.projetService
                .fetchCurrentUserId()
                .pipe(
                    catchError((error) => {
                        console.error('Failed to fetch current user ID:', error);
                        reject(error);
                        return of(null);
                    })
                )
                .subscribe({
                    next: (userId) => {
                        this.currentUserId = userId;
                        console.log('Current User ID:', this.currentUserId);
                        resolve();
                    },
                    error: (error) => {
                        reject(error);
                    }
                });
        });
    }

    loadCoaches(): void {
        if (this.currentUserId === null) {
            console.error('Current User ID is not set.');
            this.errorMessage = 'Utilisateur non connecté.';
            this.isLoading = false;
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        this.projetService.getCoachesForEntrepreneur(this.currentUserId).subscribe({
            next: (coaches: any[]) => {
                console.log('API Response (Coaches):', coaches);
                if (!coaches || coaches.length === 0) {
                    this.errorMessage = 'Aucun coach trouvé pour cet utilisateur.';
                    this.coaches = [];
                    this.filteredCoaches = [];
                    this.isLoading = false;
                    return;
                }

                this.coaches = coaches.map((coach) => {
                    const project = this.projects.find((p) => p.id === coach.projectId);
                    return {
                        id: coach.id ?? 0,
                        firstName: coach.firstName || 'N/A',
                        lastName: coach.lastName || 'N/A',
                        email: coach.email || '',
                        phoneNumber: coach.phoneNumber || '',
                        specialization: coach.specialization || 'Non spécifié',
                        experience: coach.experience || 0,
                        isAvailable: coach.isAvailable ?? true,
                        isActive: coach.isActive ?? true,
                        profilePictureUrl: coach.profilePictureUrl,
                        name: `${coach.firstName || 'N/A'} ${coach.lastName || 'N/A'}`,
                        status: coach.isActive ? 'Active' : 'Inactive',
                        projectName: project ? project.name : 'Projet non assigné',
                        projectId: coach.projectId ?? null
                    };
                });

                console.log('Mapped Coaches:', this.coaches);
                this.filteredCoaches = [...this.coaches];
                this.calculateTotalPages();
                this.extractSpecializations();
                this.extractProjectNames();
                this.isLoading = false;
                this.startAutoPagination();
            },
            error: (error) => {
                console.error('Error loading coaches:', error);
                if (error.status === 404) {
                    this.errorMessage = 'Aucun coach trouvé pour cet utilisateur (ressource non trouvée).';
                } else {
                    this.errorMessage = `Erreur lors du chargement des coaches : ${error.message || 'Erreur inconnue'}`;
                }
                this.coaches = [];
                this.filteredCoaches = [];
                this.isLoading = false;
            }
        });
    }

    extractSpecializations(): void {
        this.specializations = Array.from(new Set(this.coaches.map((coach) => coach.specialization).filter((spec) => spec && spec !== 'Non spécifié') as string[]));
        console.log('Extracted Specializations:', this.specializations);
    }

    extractProjectNames(): void {
        this.projectNames = Array.from(new Set(this.coaches.map((coach) => coach.projectName).filter((project) => project && project !== 'Projet non assigné') as string[]));
        console.log('Extracted Project Names:', this.projectNames);
    }

    filterCoaches(): void {
        let tempCoaches = [...this.coaches];

        if (this.selectedSpecialization) {
            tempCoaches = tempCoaches.filter((coach) => coach.specialization.toLowerCase() === this.selectedSpecialization.toLowerCase());
        }

        if (this.selectedProjectName) {
            tempCoaches = tempCoaches.filter((coach) => coach.projectName?.toLowerCase() === this.selectedProjectName.toLowerCase());
        }

        if (this.searchTerm) {
            const searchTermLower = this.searchTerm.toLowerCase();
            tempCoaches = tempCoaches.filter(
                (coach) => (coach.firstName || '').toLowerCase().includes(searchTermLower) || (coach.lastName || '').toLowerCase().includes(searchTermLower) || (coach.specialization || '').toLowerCase().includes(searchTermLower)
            );
        }

        this.filteredCoaches = tempCoaches;
        this.calculateTotalPages();
        this.page = 1;
        this.startAutoPagination();
    }

    calculateTotalPages(): void {
        this.totalPages = Math.ceil(this.filteredCoaches.length / this.itemsPerPage);
        console.log('Total Pages:', this.totalPages);
    }

    getPageNumbers(): number[] {
        return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    prevPage(): void {
        if (this.page > 1) {
            this.page--;
            this.autoPaginationEnabled = false;
            clearInterval(this.autoPaginationInterval);
        }
    }

    nextPage(): void {
        if (this.page < this.totalPages) {
            this.page++;
        } else {
            this.page = 1;
        }
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.page = page;
            this.autoPaginationEnabled = false;
            clearInterval(this.autoPaginationInterval);
        }
    }

    startAutoPagination(): void {
        if (this.autoPaginationInterval) {
            clearInterval(this.autoPaginationInterval);
        }
        if (this.autoPaginationEnabled && this.totalPages > 1) {
            this.autoPaginationInterval = setInterval(() => {
                this.nextPage();
            }, 4000);
        }
    }

    ngOnDestroy(): void {
        if (this.autoPaginationInterval) {
            clearInterval(this.autoPaginationInterval);
        }
    }

    getFirstLetter(name: string): string {
        return name && name.length > 0 ? name.charAt(0).toUpperCase() : 'N/A';
    }

    handleImageError(coach: Coach): void {
        coach.profilePictureUrl = undefined; // Clear the URL to trigger the text avatar
    }

    isCoachActive(coach: Coach): boolean {
        return coach.isActive ?? false;
    }

    discoverCoach(coach: Coach): void {
        this.router.navigate(['/coach-profile', coach.id]);
    }

    reserveCoach(coach: Coach): void {
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

        modalRef.result.then(
            () => {
                this.isSubmitting = false;
            },
            () => {
                this.isSubmitting = false;
            }
        );
    }
}
