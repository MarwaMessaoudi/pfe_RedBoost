import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class CoachService {
    private apiUrl = 'http://localhost:8085/api/rendezvous/api/coachlist'; // URL de ton backend

    constructor(private http: HttpClient) {}

    private token: string | null = localStorage.getItem('accessToken');
    private headers = new HttpHeaders({
        Authorization: `Bearer ${this.token}`
    });

    getCoaches(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
    }
}
