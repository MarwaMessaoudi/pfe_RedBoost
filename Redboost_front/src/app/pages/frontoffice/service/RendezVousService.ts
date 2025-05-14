import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RendezVousDTO {
  id: number;
  title: string;
  email: string;
  date: string;
  heure: string;
  description: string;
  meetingLink: string;
  status: string;
  coachId: number;
  entrepreneurId: number;
  canJoinNow: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RendezVousService {
  private apiUrl = 'http://localhost:8085/api/rendezvous';

  constructor(private http: HttpClient) {}

  getJoinableRendezVousForEntrepreneur(entrepreneurId: number): Observable<RendezVousDTO> {
    return this.http.get<RendezVousDTO>(`${this.apiUrl}/joinable/entrepreneur/${entrepreneurId}`);
  }

  getJoinableRendezVousForCoach(coachId: number): Observable<RendezVousDTO> {
    return this.http.get<RendezVousDTO>(`${this.apiUrl}/joinable/coach/${coachId}`);
  }
}