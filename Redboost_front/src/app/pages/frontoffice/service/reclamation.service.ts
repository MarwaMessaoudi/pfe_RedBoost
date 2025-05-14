import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { StatutReclamation } from '../../../models/statut-reclamation.model';
import { CategorieReclamation } from '../../../models/categorie-reclamation.model';

import { jwtDecode } from 'jwt-decode'; // Correct import

export interface ReponseReclamation {
    id: number;
    contenu: string;
    dateCreation: Date;
    userId?: number;
    reclamation?: Reclamation;
    fichiers?: Fichier[];
    roleEnvoyeur?: 'USER' | 'ADMIN' | 'INVESTOR' | 'ENTREPRENEUR' | 'COACH'; // Optional because the frontend doesn't necessarily need to know it until the data arrives
}

export interface Message {
    id: number;
    contenu: string;
    date: Date;
    expediteur: 'utilisateur' | 'admin';
    fichiers?: any[];
}

export interface Fichier {
    id?: number;
    nom?: string;
    chemin?: string;
    url?: string;
}

export interface Reclamation {
    categorie: CategorieReclamation;
    idReclamation: number;
    sujet: string;
    description: string;
    date: Date;
    statut: StatutReclamation;
    reponses?: ReponseReclamation[];
    fichiers?: Fichier[];
}

// Define Role
export type Role = 'USER' | 'ADMIN' | 'INVESTOR' | 'ENTREPRENEUR' | 'COACH'; // Update for your actual role types

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

    getAllReclamations(): Observable<Reclamation[]> {
        return this.http.get<Reclamation[]>(`${this.apiUrl}/all`, {
            headers: this.getHeaders()
        });
    }

    getReclamationsUtilisateur(): Observable<Reclamation[]> {
        const token = this.getAccessToken(); // Get the access token

        if (!token) {
            console.warn('No token found. Cannot retrieve reclamations.');
            return of([]); // Handle error
        }
        try {
            const decodedToken: any = jwtDecode(token); // Change from JwtPayload because we do not know what the function is

            const userId = decodedToken.userId; //Access the data from data decodedToken (use any)

            if (!userId) {
                console.warn('No user ID found in token. Cannot retrieve reclamations.');
                return of([]); // Handle error
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
        return this.http.get<ReponseReclamation[]>(`${this.apiUrl}/${idReclamation}/responses`, { headers: this.getHeaders() });
    }

    createReponse(idReclamation: number, contenu: string, roleEnvoyeur: Role): Observable<ReponseReclamation> {
        const url = `${this.apiUrl}/${idReclamation}/responses`;
        const body = { contenu };

        console.log('URL de la requête:', url);
        console.log('Corps de la requête:', body);
        console.log('Headers:', this.getHeaders().keys());

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

        return this.http.patch<any>(url, { statut }, { headers: this.getHeaders() }).pipe(
            tap((response) => console.log('Réponse du serveur:', response)),
            catchError(this.handleError)
        );
    }
    getCurrentRole(): Role | null {
        //Or whatever data type your role is
        const token = this.getAccessToken(); // Use getAccessToken since you already have this

        if (!token) {
            console.warn('No token found. Cannot retrieve reclamations.');
            return null; // Handle error
        }
        try {
            const decodedToken: any = jwtDecode(token); // Change from JwtPayload because we do not know what the function is
            const role = decodedToken.role; // Assuming it's userId in the claim
            if (!role) {
                console.warn('No user role found in token.');
                return null; // Handle error
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
