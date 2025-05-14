import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { Calendar, CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AppointmentService } from '../../service/appointment.service';
import { RendezVous } from '../../../../models/rendez-vous.model';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../service/auth.service'; // Ajuste le chemin si nécessaire

interface Availability {
    date: string;
    startTime: string;
    endTime: string;
}

@Component({
    selector: 'app-appointments-received',
    standalone: true,
    imports: [CommonModule, FullCalendarModule, ReactiveFormsModule],
    templateUrl: './appointments-received.component.html',
    styleUrls: ['./appointments-received.component.scss']
})
export class AppointmentsReceivedComponent implements OnInit {
    appointments: RendezVous[] = [];
    calendarOptions: CalendarOptions = {
        initialView: 'dayGridMonth',
        plugins: [dayGridPlugin, interactionPlugin],
        height: 'auto',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
        },
        events: [],
        eventClick: this.handleEventClick.bind(this),
        eventContent: this.renderEventContent.bind(this)
    };
    @ViewChild('calendar') calendarComponent: any;
    private calendarApi: Calendar | null = null;
    availabilityForm: FormGroup;
    coachId: number = 1;

    constructor(
        private appointmentService: AppointmentService,
        private fb: FormBuilder,
        private toastr: ToastrService,
        private authService: AuthService // Injection correcte de AuthService// ✅ Injection correcte de ToastrService
    ) {
        this.availabilityForm = this.fb.group({
            startTime: ['', Validators.required],
            endTime: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        this.loadAppointments();
    }

    ngAfterViewInit(): void {
        if (this.calendarComponent) {
            this.calendarApi = this.calendarComponent.getApi();
            console.log('API du calendrier initialisée via @ViewChild :', this.calendarApi);
        } else {
            console.error('Composant FullCalendar non trouvé via @ViewChild');
        }
    }

    loadAppointments(): void {
        this.appointmentService.getAppointmentsByCoach().subscribe({
            next: (appointments) => {
                this.appointments = appointments; // Assigner les données à this.appointments
            }
        });
    }

    updateCalendarEvents(): void {
        const events: EventInput[] = this.appointments
            .filter((appointment) => appointment.status.toUpperCase() === 'ACCEPTED')
            .map((appointment) => {
                console.log('Appointment traité pour FullCalendar :', appointment);
                let startDate = new Date(appointment.date);
                if (isNaN(startDate.getTime())) {
                    startDate = new Date(appointment.date.split('/').reverse().join('-'));
                }

                const heureDisplay = appointment.heure && appointment.heure.trim() !== '' ? appointment.heure : '00:00';

                const startDateTime = new Date(`${appointment.date}T${heureDisplay}`);
                if (isNaN(startDateTime.getTime())) {
                    console.warn(`Date/heure invalide pour appointment ${appointment.id}: ${appointment.date} ${heureDisplay}`);
                }

                return {
                    id: appointment.id?.toString(),
                    title: `${appointment.title} (${heureDisplay})`,
                    start: startDateTime.toISOString(),
                    className: 'event-accepted',
                    extendedProps: {
                        status: appointment.status
                    }
                };
            });
        this.calendarOptions.events = events;
        if (this.calendarApi) {
            this.calendarApi.refetchEvents();
            console.log('Événements rafraîchis dans FullCalendar');
        } else {
            console.error('calendarApi est null, vérifiez l’initialisation de FullCalendar');
        }
    }

    renderEventContent(info: any): any {
        const status = info.event.extendedProps.status || 'UNKNOWN';
        return {
            html: `
        <div class="fc-event-content">
          <span class="event-title">${info.event.title}</span>
          <span class="event-status" style="color: ${status === 'ACCEPTED' ? '#2ecc71' : '#ff6b6b'}">
            (${status})
          </span>
        </div>
      `
        };
    }

    handleEventClick(info: any) {
        const eventId = info.event.id;
        const appointment = this.appointments.find((a) => a.id === parseInt(eventId, 10));
        if (appointment) {
            console.log('Événement cliqué :', appointment);
        }
    }

    approveAppointment(id: number | undefined) {
        if (id === undefined) {
            console.log('ID du rendez-vous non défini');
            this.toastr.error('ID du rendez-vous non défini', 'Erreur');
            return;
        }

        // Token removed; assuming backend doesn't require it
        this.appointmentService.updateAppointmentStatus(id, 'ACCEPTED').subscribe({
            next: (response) => {
                console.log('Rendez-vous approuvé avec succès (réponse backend) :', response);
                if (response.success) {
                    this.toastr.success(
                        'Le rendez-vous a été approuvé avec succès', // Removed Google Calendar reference if not applicable
                        'Succès'
                    );
                    this.loadAppointments();
                } else {
                    this.toastr.error(response.message, 'Erreur');
                }
            },
            error: (err) => {
                console.log('Erreur lors de l’approbation du rendez-vous :', err);
                this.toastr.error(`Échec de l’approbation : ${err.message || 'Erreur inconnue'}`, 'Erreur');
            }
        });
    }

    rejectAppointment(id: number | undefined) {
        if (id === undefined) {
            console.log('ID du rendez-vous non défini');
            this.toastr.error('ID du rendez-vous non défini', 'Erreur');
            return;
        }

        // Token removed; assuming backend doesn't require it
        this.appointmentService.updateAppointmentStatus(id, 'REJECTED').subscribe({
            next: (response) => {
                console.log('Rendez-vous refusé avec succès :', response);
                if (response.success) {
                    this.toastr.info('Le rendez-vous a été refusé.', 'Information');
                    this.loadAppointments();
                    this.appointments = this.appointments.filter((apt) => apt.id !== id);
                    this.updateCalendarEvents();
                } else {
                    this.toastr.error(response.message, 'Erreur');
                }
            },
            error: (err) => {
                console.log('Erreur lors du refus du rendez-vous :', err);
                this.toastr.error(`Échec du refus : ${err.message || 'Erreur inconnue'}`, 'Erreur');
            }
        });
    }

    saveAvailability(date: string, availability: Availability): void {
        console.log('Disponibilités sauvegardées :', { ...availability, coachId: this.coachId });
        this.loadAppointments();
    }
}
