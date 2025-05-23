// src/app/components/appointments-list/appointments-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AppointmentService } from '../../service/appointment.service';
import { RendezVous } from '../../../../models/rendez-vous.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditAppointmentModalComponent } from '../Formulaire/EditAppointmentComponent';
import { DeleteAppointmentModalComponent } from '../Formulaire/delete-appointment';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../service/auth.service';
import { WebSocketService } from '../../service/WebSocketService';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-appointments-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointments-list.component.html',
  styleUrls: ['./appointments-list.component.scss']
})
export class AppointmentsListComponent implements OnInit, OnDestroy {
  appointments: RendezVous[] = [];
  filteredAppointments: RendezVous[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 3;
  totalPages: number = 1;
  searchTerm: string = '';
  statusFilter: string = '';
  private webSocketSubscription?: Subscription;

  constructor(
    private appointmentService: AppointmentService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private authService: AuthService,
    private webSocketService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
    this.setupWebSocket();
  }

  ngOnDestroy(): void {
    this.appointments = [];
    this.filteredAppointments = [];
    this.webSocketSubscription?.unsubscribe();
  }

  private loadAppointments(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.toastr.error('Utilisateur non authentifié');
      return;
    }
    this.appointmentService.getRendezVousByEntrepreneurId(Number(userId)).subscribe({
      next: (appointments) => {
        this.appointments = appointments;
        this.filterAppointments();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des rendez-vous :', err);
        this.toastr.error('Échec du chargement des rendez-vous', 'Erreur');
      }
    });
  }

  private setupWebSocket(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.toastr.error('Utilisateur non authentifié', 'Erreur');
      return;
    }
    // Initialize WebSocket for rendez-vous updates
    this.webSocketService.initialize(null, Number(userId));
    this.webSocketSubscription = this.webSocketService.rendezVousUpdates$.subscribe({
      next: (update) => {
        if (!update) return;
        if (update.action === 'create' && update.rendezVous) {
          this.appointments = [...this.appointments, update.rendezVous];
          this.filterAppointments();
          this.toastr.info('Nouveau rendez-vous créé', 'Nouveau');
        } else if (update.action === 'update' && update.rendezVous) {
          this.appointments = this.appointments.map((app) =>
            app.id === update.rendezVous!.id ? update.rendezVous! : app
          );
          this.filterAppointments();
          this.toastr.info('Rendez-vous mis à jour', 'Mise à jour');
        } else if (update.action === 'delete' && update.id) {
          this.appointments = this.appointments.filter((app) => app.id !== update.id);
          this.filterAppointments();
          this.toastr.info('Rendez-vous supprimé', 'Suppression');
        }
      },
      error: (err) => {
        console.error('WebSocket error:', err);
        this.toastr.error('Erreur WebSocket', 'Erreur');
      }
    });
  }

  filterAppointments(): void {
    let filtered = [...this.appointments];
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter((app) =>
        app.title?.toLowerCase().includes(search) ||
        app.description?.toLowerCase().includes(search)
      );
    }
    if (this.statusFilter) {
      filtered = filtered.filter((app) => app.status === this.statusFilter);
    }
    this.filteredAppointments = filtered;
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage) || 1;
    this.currentPage = Math.min(this.currentPage, this.totalPages);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
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
    const modalRef = this.modalService.open(EditAppointmentModalComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: true
    });
    modalRef.componentInstance.appointment = { ...appointment };
    modalRef.result.then(
      (result: any) => {
        if (result) {
          const updatedAppointment: RendezVous = {
            id: appointment.id,
            title: result.title,
            date: result.date,
            heure: result.heure,
            description: result.description,
            status: appointment.status
          };
          this.appointmentService.updateAppointment(updatedAppointment.id!, updatedAppointment).subscribe({
            next: () => {
              this.toastr.success('Le rendez-vous a été modifié avec succès', 'Succès');
              // Update will be handled via WebSocket
            },
            error: (err) => {
              console.error('Erreur lors de la modification du rendez-vous :', err);
              this.toastr.error('Échec de la modification', 'Erreur');
            }
          });
        }
      },
      () => {}
    );
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
        // Deletion will be handled via WebSocket
      },
      error: (err) => {
        console.error('Erreur lors de la suppression :', err);
        this.toastr.error('Erreur lors de la suppression', 'Erreur');
      }
    });
  }
}