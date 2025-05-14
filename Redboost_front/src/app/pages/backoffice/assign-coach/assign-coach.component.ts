import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProjetService } from '../../frontoffice/service/projet-service.service';
import { Projet } from '../../../models/Projet';
import { Coach } from '../../../models/Coach.model';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-assign-coach',
    templateUrl: './assign-coach.component.html',
    styleUrls: ['./assign-coach.component.scss'],
    imports: [CommonModule],
    standalone: true
})
export class AssignCoachComponent implements OnInit {
    projects: Projet[] = [];
    selectedProject: Projet | null = null;
    coaches: Coach[] = [];
    selectedCoachId: number | null = null;
    assignedCoaches: Coach[] = [];
    errorMessage: string = '';
    successMessage: string = '';
    loading: boolean = false;
    private apiUrl = 'http://localhost:8085/users'; // Backend API URL for users

    constructor(
        private projetService: ProjetService,
        private http: HttpClient
    ) {}

    ngOnInit(): void {
        this.loadProjects();
        this.loadAllCoaches();
    }

    loadProjects(): void {
        this.loading = true;
        this.errorMessage = '';
        this.projetService.getAllProjects().subscribe({
            next: (projects) => {
                this.projects = projects;
                this.loading = false;
            },
            error: (error) => {
                this.errorMessage = error.message || 'Failed to load projects. Please try again.';
                console.error('Error loading projects:', {
                    status: error.status,
                    message: error.message,
                    details: error
                });
                this.loading = false;
            }
        });
    }

    loadAllCoaches(): void {
        this.loading = true;
        const token = localStorage.getItem('accessToken');
        if (!token) {
            this.errorMessage = 'No auth token found. Please log in.';
            console.error('No auth token found');
            this.loading = false;
            return;
        }

        const headers = {
            Authorization: `Bearer ${token}`
        };

        // Fetch users with role=COACH
        const url = `${this.apiUrl}?role=COACH`;

        this.http.get<any[]>(url, { headers }).subscribe({
            next: (data) => {
                this.coaches = data.map((user) => ({
                    id: user.id,
                    firstName: user.firstName || user.first_name || '',
                    lastName: user.lastName || user.last_name || '',
                    email: user.email || '',
                    phoneNumber: user.phoneNumber || user.phone_number || '',
                    specialization: user.specialization || 'General',
                    experience: user.experience || '',
                    isAvailable: user.isAvailable ?? true,
                    avatar: user.profile_pictureurl || '',
                    availability: user.availability || undefined,
                    name: `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim(),
                    specialty: user.specialization || 'General'
                }));
                console.log('Loaded coaches:', this.coaches);
                this.loading = false;
            },
            error: (error) => {
                this.errorMessage = 'Failed to load coaches. Please try again.';
                console.error('Error loading coaches:', {
                    status: error.status,
                    statusText: error.statusText,
                    message: error.message,
                    error: error.error,
                    url: error.url
                });
                this.loading = false;
            }
        });
    }

    onProjectChange(event: Event): void {
        const target = event.target as HTMLSelectElement;
        const projectId = target && target.value ? parseInt(target.value, 10) : null;
        this.selectedProject = projectId !== null ? this.projects.find((p) => p.id === projectId) || null : null;
        this.selectedCoachId = null; // Reset coach selection when project changes
        this.updateAssignedCoaches();
    }

    onCoachChange(event: Event): void {
        const target = event.target as HTMLSelectElement;
        this.selectedCoachId = target && target.value ? parseInt(target.value, 10) : null;
    }

    assignCoach(): void {
        if (!this.selectedProject || this.selectedCoachId === null) {
            this.errorMessage = 'Please select a project and a coach';
            return;
        }

        this.loading = true;
        this.errorMessage = '';
        this.successMessage = '';

        this.projetService.addCoachToProjet(this.selectedProject.id!, this.selectedCoachId).subscribe({
            next: (updatedProjet: Projet) => {
                this.selectedProject = updatedProjet;
                this.successMessage = `Coach assigned to ${updatedProjet.name}`;
                this.selectedCoachId = null;
                this.updateAssignedCoaches();
                this.loading = false;
            },
            error: (error) => {
                this.errorMessage = error.message || 'Failed to assign coach';
                console.error('Error assigning coach:', {
                    status: error.status,
                    message: error.message,
                    details: error
                });
                this.loading = false;
            }
        });
    }

    updateAssignedCoaches(): void {
        if (this.selectedProject && this.selectedProject.coaches) {
            this.assignedCoaches = this.coaches.filter((coach) => this.selectedProject!.coaches.some((projectCoach: any) => projectCoach.id === coach.id));
        } else {
            this.assignedCoaches = [];
        }
    }
}
