import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { StatutReclamation } from '../../../models/statut-reclamation.model';
import { CategorieReclamation } from '../../../models/categorie-reclamation.model';
import { jwtDecode } from 'jwt-decode';

export interface Fichier {
    id?: number;
    nom?: string;
    chemin?: string;
    url?: string;
}

export interface ReponseReclamation {
    id: number;
    contenu: string;
    dateCreation: Date;
    userId?: number;
    reclamation?: Reclamation;
    roleEnvoyeur?: 'USER' | 'ADMIN' | 'INVESTOR' | 'ENTREPRENEUR' | 'COACH';
}

export interface Reclamation {
    idReclamation: number;
    sujet: string;
    date: Date;
    statut: StatutReclamation;
    description: string;
    categorie: CategorieReclamation;
    fichierReclamation?: string; // Add this to match backend
    fichiers?: Fichier[]; // Keep for compatibility, but may not be needed
    userId?: number;
    email?: string;
    reponses?: ReponseReclamation[];
}

export type Role = 'USER' | 'ADMIN' | 'INVESTOR' | 'ENTREPRENEUR' | 'COACH';

@Injectable({
    providedIn: 'root'
})
export class ReclamationService {
    private apiUrl = 'http://localhost:8085/api/reclamations';

    constructor(private http: HttpClient) {}

    private getAccessToken(): string | null {
        return localStorage.getItem('accessToken');
    }

    private getHeaders(): HttpHeaders {
        const token = this.getAccessToken();
        let headers = new HttpHeaders();
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        } else {
            console.warn('No access token found in localStorage!');
        }
        return headers;
    }

    createReclamation(reclamation: any, file?: File): Observable<Reclamation> {
        const formData = new FormData();
        formData.append('reclamation', new Blob([JSON.stringify(reclamation)], { type: 'application/json' }));
        if (file) {
            formData.append('file', file);
        }

        return this.http
            .post<Reclamation>(`${this.apiUrl}/add`, formData, {
                headers: this.getHeaders()
            })
            .pipe(
                catchError(this.handleError)
            );
    }

    getAllReclamations(): Observable<Reclamation[]> {
        return this.http.get<Reclamation[]>(`${this.apiUrl}/all`, {
            headers: this.getHeaders()
        });
    }

    getReclamationsUtilisateur(): Observable<Reclamation[]> {
        const token = this.getAccessToken();
        if (!token) {
            console.warn('No token found. Cannot retrieve reclamations.');
            return of([]);
        }
        try {
            const decodedToken: any = jwtDecode(token);
            const userId = decodedToken.userId;
            if (!userId) {
                console.warn('No user ID found in token. Cannot retrieve reclamations.');
                return of([]);
            }

            let params = new HttpParams().set('userId', userId.toString());
            return this.http
                .get<Reclamation[]>(`${this.apiUrl}/user`, {
                    headers: this.getHeaders(),
                    params: params
                })
                .pipe(
                    catchError((error: HttpErrorResponse) => {
                        console.error('Error retrieving reclamations.', error);
                        return of([]);
                    })
                );
        } catch (error) {
            console.error('Error decoding JWT token:', error);
            return of([]);
        }
    }

    getReponses(idReclamation: number): Observable<ReponseReclamation[]> {
        return this.http.get<ReponseReclamation[]>(`${this.apiUrl}/${idReclamation}/responses`, {
            headers: this.getHeaders()
        });
    }

    createReponse(idReclamation: number, contenu: string, roleEnvoyeur: Role): Observable<ReponseReclamation> {
        const url = `${this.apiUrl}/${idReclamation}/responses`;
        const body = { contenu };
        return this.http
            .post<ReponseReclamation>(url, body, {
                headers: this.getHeaders().set('Content-Type', 'application/json')
            })
            .pipe(
                tap((response) => console.log('Réponse du serveur:', response)),
                catchError(this.handleError)
            );
    }

    updateReclamationStatut(idReclamation: number, statut: StatutReclamation): Observable<any> {
        const url = `${this.apiUrl}/${idReclamation}/statut`;
        return this.http.patch<any>(url, { statut }, {
            headers: this.getHeaders()
        }).pipe(
            tap((response) => console.log('Réponse du serveur:', response)),
            catchError(this.handleError)
        );
    }

    getCurrentRole(): Role | null {
        const token = this.getAccessToken();
        if (!token) {
            console.warn('No token found. Cannot retrieve role.');
            return null;
        }
        try {
            const decodedToken: any = jwtDecode(token);
            const role = decodedToken.role;
            if (!role) {
                console.warn('No role found in token.');
                return null;
            }
            return role as Role;
        } catch (error) {
            console.error('Error decoding JWT token:', error);
            return null;
        }
    }

    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = '';
        if (error.error instanceof ErrorEvent) {
            errorMessage = `Erreur: ${error.error.message}`;
        } else {
            errorMessage = `Code d'erreur: ${error.status}\nMessage: ${error.message}`;
            if (error.error) {
                console.error("Corps de la réponse d'erreur:", error.error);
            }
        }
        console.error(errorMessage);
        return throwError(() => new Error(errorMessage));
    }
}