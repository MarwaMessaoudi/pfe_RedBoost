import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { AppointmentService } from '../../service/appointment.service';
import { RendezVous } from '../../../../models/rendez-vous.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EditAppointmentModalComponent } from '../Formulaire/EditAppointmentComponent';
import { DeleteAppointmentModalComponent } from '../Formulaire/delete-appointment';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../service/auth.service';

@Component({
    selector: 'app-appointments-list',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './appointments-list.component.html',
    styleUrls: ['./appointments-list.component.scss']
})
export class AppointmentsListComponent implements OnInit, OnDestroy {
    appointments: RendezVous[] = [];
    filteredAppointments: RendezVous[] = [];
    pagedAppointments: RendezVous[] = [];
    editForm!: FormGroup;

    // Pagination
    currentPage: number = 1;
    itemsPerPage: number = 3;
    totalPages: number = 1;

    // Filters
    searchTerm: string = '';
    statusFilter: string = '';

    private paginationInterval: any; // To store the interval for automatic pagination

    constructor(
        private appointmentService: AppointmentService,
        private modalService: NgbModal,
        private fb: FormBuilder,
        private toastr: ToastrService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef // Add ChangeDetectorRef for view updates
    ) {
        this.initializeForm();
    }

    private initializeForm(): void {
        this.editForm = this.fb.group({
            id: [null],
            title: ['', Validators.required],
            date: ['', Validators.required],
            heure: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            description: [''],
            status: ['PENDING']
        });
    }

    ngOnInit(): void {
        this.loadAppointments();
        this.startAutoPagination(); // Start the automatic pagination
    }

    loadAppointments(): void {
        const userId = this.authService.getUserId();
        if (!userId) {
            this.toastr.error('Utilisateur non authentifié');
            return;
        }

        this.appointmentService.getRendezVousByEntrepreneurId(Number(userId)).subscribe({
            next: (appointments) => {
                this.appointments = appointments;
                this.filterAppointments();
            }
        });
    }

    filterAppointments(): void {
        let filtered = [...this.appointments];

        if (this.searchTerm) {
            const search = this.searchTerm.toLowerCase();
            filtered = filtered.filter((app) => app.title?.toLowerCase().includes(search) || app.description?.toLowerCase().includes(search) || app.email?.toLowerCase().includes(search));
        }

        if (this.statusFilter) {
            filtered = filtered.filter((app) => app.status === this.statusFilter);
        }

        this.filteredAppointments = filtered;
        this.totalPages = Math.ceil(filtered.length / this.itemsPerPage) || 1;
        this.currentPage = 1;
        this.updatePagedAppointments();
        this.restartAutoPagination(); // Restart pagination when filtering
    }

    updatePagedAppointments(): void {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        this.pagedAppointments = this.filteredAppointments.slice(startIndex, endIndex);
    }

    changePage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.updatePagedAppointments();
            this.restartAutoPagination(); // Restart the timer on manual interaction
        }
    }

    getPageNumbers(): number[] {
        const pages: number[] = [];
        for (let i = 1; i <= this.totalPages; i++) {
            pages.push(i);
        }
        return pages;
    }

    // Start the automatic pagination (every 2 seconds)
    startAutoPagination(): void {
        this.paginationInterval = setInterval(() => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
            } else {
                this.currentPage = 1; // Loop back to the first page
            }
            this.updatePagedAppointments();
            this.cdr.detectChanges(); // Ensure Angular updates the view
        }, 6000); // 2 seconds interval
    }

    // Restart the automatic pagination (e.g., after manual interaction or filter)
    restartAutoPagination(): void {
        this.clearAutoPagination();
        this.startAutoPagination();
    }

    // Clear the automatic pagination interval
    clearAutoPagination(): void {
        if (this.paginationInterval) {
            clearInterval(this.paginationInterval);
            this.paginationInterval = null;
        }
    }

    getStatusLabel(status: string | undefined): string {
        switch (status) {
            case 'PENDING':
                return 'En attente';
            case 'ACCEPTED':
                return 'Accepté';
            case 'REJECTED':
                return 'Refusé';
            default:
                return '';
        }
    }

    openEditModal(appointment: RendezVous): void {
        this.editForm.patchValue({
            id: appointment.id,
            title: appointment.title,
            date: appointment.date,
            heure: appointment.heure,
            email: appointment.email || '',
            description: appointment.description || ''
        });

        const modalRef = this.modalService.open(EditAppointmentModalComponent, {
            centered: true,
            size: 'md',
            backdrop: 'static',
            keyboard: true
        });

        modalRef.componentInstance.form = this.editForm;

        modalRef.result.then(
            (result: any) => {
                if (result) {
                    const updatedAppointment: RendezVous = {
                        id: appointment.id,
                        title: result.title,
                        date: appointment.date,
                        heure: result.heure,
                        email: result.email,
                        description: result.description,
                        status: result.status
                    };
                    this.updateAppointment(updatedAppointment);
                }
            },
            () => {}
        );
    }

    updateAppointment(appointment: RendezVous): void {
        this.appointmentService.updateAppointment(appointment.id!, appointment).subscribe({
            next: () => {
                this.toastr.success('Le rendez-vous a été modifié avec succès', 'Succès');
                this.loadAppointments();
            },
            error: (err) => {
                console.error('Erreur lors de la modification du rendez-vous :', err);
                this.toastr.error('Échec de la modification', 'Erreur');
            }
        });
    }

    openDeleteModal(appointmentId: number): void {
        const modalRef = this.modalService.open(DeleteAppointmentModalComponent, {
            centered: true,
            size: 'md',
            backdrop: 'static',
            keyboard: true
        });

        modalRef.componentInstance.appointmentId = appointmentId;

        modalRef.result.then(
            (result: string) => {
                if (result === 'confirm') {
                    this.deleteAppointment(appointmentId);
                }
            },
            () => {}
        );
    }

    deleteAppointment(id: number): void {
        this.appointmentService.deleteAppointment(id).subscribe({
            next: () => {
                this.toastr.success('Rendez-vous supprimé avec succès', 'Succès');
                this.loadAppointments();
            },
            error: (err) => {
                console.error('Erreur lors de la suppression :', err);
                this.toastr.error('Erreur lors de la suppression', 'Erreur');
            }
        });
    }

    ngOnDestroy(): void {
        this.clearAutoPagination(); // Clear the interval when the component is destroyed
    }
}
