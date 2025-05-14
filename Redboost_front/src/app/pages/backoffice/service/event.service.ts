// src/app/pages/service/event.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EventService {
  private baseUrl = 'http://localhost:8085/api/events'; // ⚠️ adapte le chemin si besoin

  constructor(private http: HttpClient) {}

  createEvent(event: any, programId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}?programId=${programId}`, event);
  }

  getEventsByProgram(programId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/program/${programId}`);
  }
}
