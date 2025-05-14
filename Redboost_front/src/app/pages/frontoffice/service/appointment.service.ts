import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { RendezVous } from '../../../models/rendez-vous.model';
import { AuthService } from './auth.service'; // Ajuste le chemin si nécessaire

@Injectable({
    providedIn: 'root'
})
export class AppointmentService {
    private apiUrl = 'http://localhost:8085/api/rendezvous';

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) {}

    getAllAppointments(): Observable<RendezVous[]> {
        return this.http.get<RendezVous[]>(`${this.apiUrl}/all`);
    }

    getAppointmentById(ID?: number): Observable<RendezVous> {
        const userId = ID ?? this.authService.getUserId(); // Utilise l'ID fourni ou récupère celui de l'utilisateur connecté
        return this.http.get<RendezVous>(`${this.apiUrl}/${userId}`);
    }

    getRendezVousByEntrepreneurId(id?: number): Observable<RendezVous[]> {
        if (!id) {
            return throwError(() => new Error("ID de l'entrepreneur est requis"));
        }

        return this.http.get<RendezVous[]>(`${this.apiUrl}/entrepreneur/${id}`);
    }

    getAppointmentsByCoach(): Observable<RendezVous[]> {
        const CoachId = this.authService.getUserId();
        return this.http.get<RendezVous[]>(`${this.apiUrl}/coach/${CoachId}`);
    }

    createAppointment(appointment: RendezVous, coachId?: number): Observable<RendezVous> {
        const entrepreneurId = this.authService.getUserId();
        if (!entrepreneurId) {
            return throwError(() => new Error('Utilisateur non connecté ou entrepreneurId non disponible'));
        }

        if (!coachId) {
            console.error('AppointmentService - Erreur: coachId non défini', appointment);
            return throwError(() => new Error('CoachId non disponible dans les données de rendez-vous'));
        }

        const backendData = {
            title: appointment.title,
            heure: appointment.heure,
            email: appointment.email,
            description: appointment.description,
            date: appointment.date,
            status: appointment.status || 'PENDING'
        };

        console.log('AppointmentService - Coach ID utilisé :', coachId);
        console.log('Creating appointment with URL:', `${this.apiUrl}/add?coachId=${coachId}&entrepreneurId=${entrepreneurId}`);
        console.log('Appointment data:', backendData);

        return this.http.post<RendezVous>(`${this.apiUrl}/add?coachId=${coachId}&entrepreneurId=${entrepreneurId}`, backendData);
    }

    // Commenté : Méthode pour ajouter à Google Calendar (non utilisée actuellement)
    /*
  addToGoogleCalendar(appointment: RendezVous): Observable<any> {
    return this.http.post(`${this.apiUrl}/add-to-google-calendar`, appointment);
  }
  */

    updateAppointment(id: number, appointment: RendezVous): Observable<RendezVous> {
        const backendData = {
            ...appointment,
            coach: appointment.coach, // Valeur par défaut ou existante
            entrepreneur: appointment.entrepreneur // Valeur par défaut ou existante
        };
        return this.http.put<RendezVous>(`${this.apiUrl}/update/${id}`, backendData);
    }

    deleteAppointment(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
    }

    updateAppointmentStatus(id: number, status: 'PENDING' | 'ACCEPTED' | 'REJECTED', token?: string): Observable<{ message: string; success: boolean }> {
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        });
        return this.http.patch<{ message: string; success: boolean }>(`${this.apiUrl}/update-status/${id}`, JSON.stringify(status), { headers });
    }

    getAcceptedAppointmentsByDate(date: string): Observable<RendezVous[]> {
        return this.http.get<RendezVous[]>(`${this.apiUrl}/accepted?date=${date}&status=ACCEPTED`);
    }

    getUserAppointmentHistory(): Observable<RendezVous[]> {
        const currentUser = this.authService.getCurrentUser();

        return new Observable((observer) => {
            currentUser.subscribe((user) => {
                if (user?.id) {
                    this.http.get<RendezVous[]>(`${this.apiUrl}/history/${user.id}`).subscribe({
                        next: (appointments) => observer.next(appointments),
                        error: (err) => observer.error(err)
                    });
                } else {
                    observer.error('Utilisateur non connecté');
                }
            });
        });
    }
    getStats(userId: number): Observable<{ [key: string]: number }> {
        return this.http.get<{ [key: string]: number }>(`${this.apiUrl}/stats/${userId}`);
    }
}
