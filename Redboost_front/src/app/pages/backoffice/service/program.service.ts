import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { Program } from '../../../models/program.modal';

@Injectable({
    providedIn: 'root'
})
export class ProgramService {
    private apiUrl = 'http://localhost:8085/api/programs'; // URL de l'API backend

    constructor(private http: HttpClient) {}

    // Méthode pour récupérer tous les programmes
    getPrograms(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
    }

    // Méthode pour ajouter un programme
    addProgram(programData: FormData): Observable<any> {
        return this.http.post<any>(this.apiUrl, programData);
    }

    // ✅ 🔥 Récupérer un programme par ID
    getProgramById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }
    updateProgram(id: number, programData: FormData): Observable<Program> {
        return this.http.put<Program>(`${this.apiUrl}/${id}`, programData).pipe(catchError(this.handleError));
    }

    /**
     * Supprime un programme par son ID
     * @param id ID du programme à supprimer
     */
    deleteProgram(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
    }

    /**
     * Change le statut d'un programme
     * @param id ID du programme
     * @param status Nouveau statut ('active', 'pending', 'completed')
     */
    updateProgramStatus(id: number, status: 'active' | 'Enattente' | 'Termine'): Observable<Program> {
        return this.http.patch<Program>(`${this.apiUrl}/${id}/status`, { status }).pipe(catchError(this.handleError));
    }

    /**
     * Gestion des erreurs HTTP
     * @param error Erreur HTTP
     */
    private handleError(error: HttpErrorResponse) {
        let errorMessage = 'Une erreur est survenue lors de la communication avec le serveur.';

        if (error.error instanceof ErrorEvent) {
            // Erreur côté client
            errorMessage = `Erreur: ${error.error.message}`;
        } else {
            // Erreur renvoyée par le backend
            if (error.status === 0) {
                errorMessage = 'Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet.';
            } else if (error.status === 404) {
                errorMessage = 'Ressource non trouvée.';
            } else if (error.status === 403) {
                errorMessage = "Vous n'avez pas les permissions nécessaires pour cette action.";
            } else if (error.status === 400 && error.error?.message) {
                errorMessage = error.error.message;
            } else if (error.status === 500) {
                errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
            }
        }

        console.error(errorMessage, error);
        return throwError(() => new Error(errorMessage));
    }
}
