// src/app/components/appointments-received/appointments-received.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../service/appointment.service';
import { RendezVous } from '../../../../models/rendez-vous.model';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../service/auth.service';
import { WebSocketService } from '../../service/WebSocketService';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-appointments-received',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointments-received.component.html',
  styleUrls: ['./appointments-received.component.scss']
})
export class AppointmentsReceivedComponent implements OnInit, OnDestroy {
  appointments: RendezVous[] = [];
  private webSocketSubscription?: Subscription;

  constructor(
    private appointmentService: AppointmentService,
    private toastr: ToastrService,
    private authService: AuthService,
    private webSocketService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
    this.setupWebSocket();
  }

  ngOnDestroy(): void {
    this.webSocketSubscription?.unsubscribe();
  }

  private loadAppointments(): void {
    this.appointmentService.getAppointmentsByCoach().subscribe({
      next: (appointments) => {
        this.appointments = appointments;
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
          this.toastr.info('Nouveau rendez-vous reçu', 'Nouveau');
        } else if (update.action === 'update' && update.rendezVous) {
          this.appointments = this.appointments.map((app) =>
            app.id === update.rendezVous!.id ? update.rendezVous! : app
          );
          this.toastr.info('Rendez-vous mis à jour', 'Mise à jour');
        } else if (update.action === 'delete' && update.id) {
          this.appointments = this.appointments.filter((app) => app.id !== update.id);
          this.toastr.info('Rendez-vous supprimé', 'Suppression');
        }
      },
      error: (err) => {
        console.error('WebSocket error:', err);
        this.toastr.error('Erreur WebSocket', 'Erreur');
      }
    });
  }

  approveAppointment(id: number | undefined): void {
    if (id === undefined) {
      console.log('ID du rendez-vous non défini');
      this.toastr.error('ID du rendez-vous non défini', 'Erreur');
      return;
    }
    this.appointmentService.updateAppointmentStatus(id, 'ACCEPTED').subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success('Le rendez-vous a été approuvé avec succès', 'Succès');
          // Update will be handled via WebSocket
        } else {
          this.toastr.error(response.message, 'Erreur');
        }
      },
      error: (err) => {
        console.error('Erreur lors de l’approbation du rendez-vous :', err);
        this.toastr.error(`Échec de l’approbation : ${err.message || 'Erreur inconnue'}`, 'Erreur');
      }
    });
  }

  rejectAppointment(id: number | undefined): void {
    if (id === undefined) {
      console.log('ID du rendez-vous non défini');
      this.toastr.error('ID du rendez-vous non défini', 'Erreur');
      return;
    }
    this.appointmentService.updateAppointmentStatus(id, 'REJECTED').subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.info('Le rendez-vous a été refusé', 'Information');
          // Update will be handled via WebSocket
        } else {
          this.toastr.error(response.message, 'Erreur');
        }
      },
      error: (err) => {
        console.error('Erreur lors du refus du rendez-vous :', err);
        this.toastr.error(`Échec du refus : ${err.message || 'Erreur inconnue'}`, 'Erreur');
      }
    });
  }
}