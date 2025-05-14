import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { Projet, Objectives, Statut } from '../../../models/Projet';
import { DashboardStatistics } from '../../../models/statistics';

interface Coach {
    id: number;
    name: string;
    specialty: string;
    avatar: string;
    email: string;
    phoneNumber: string;
    specialization: string;
    status?: string;
    profile_pictureurl?: string;
    firstName?: string;
    lastName?: string;
}

interface User {
    id: number;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
}

interface PendingInvitation {
    projectId: number;
    projectName: string;
    invitorEmail: string;
    invitorName: string;
}

interface ProjectContacts {
    founder: User | null;
    entrepreneurs: User[];
    coaches: User[];
    investors: User[];
}

@Injectable({
    providedIn: 'root'
})
export class ProjetService {
    private apiUrl = 'http://localhost:8085/api/projets';
    private currentUserIdSubject = new BehaviorSubject<number | null>(null);
    currentUserId$ = this.currentUserIdSubject.asObservable();

    constructor(private http: HttpClient) {}

    private getHeaders(includeContentType: boolean = true): HttpHeaders {
        let headers = new HttpHeaders();
        if (includeContentType) {
            headers = headers.set('Content-Type', 'application/json');
        }
        const token = localStorage.getItem('token');
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    }

    fetchCurrentUserId(): Observable<number> {
        return new Observable<number>((observer) => {
            const tokenKey = 'accessToken';
            const checkToken = () => {
                const token = localStorage.getItem(tokenKey);
                if (!token) {
                    return false;
                }
                const decodedToken = this.decodeToken(token);
                if (!decodedToken) {
                    observer.error(new Error('Failed to decode token.'));
                    return true;
                }
                const userId = decodedToken.userId || decodedToken.id || decodedToken.sub;
                if (!userId) {
                    observer.error(new Error('User ID not found in token.'));
                    return true;
                }
                const parsedUserId = parseInt(userId, 10);
                if (isNaN(parsedUserId)) {
                    observer.error(new Error('Invalid user ID in token: ' + userId));
                    return true;
                }
                this.currentUserIdSubject.next(parsedUserId);
                observer.next(parsedUserId);
                observer.complete();
                return true;
            };

            if (checkToken()) return;

            let attempts = 0;
            const maxAttempts = 50;
            const interval = setInterval(() => {
                attempts++;
                if (checkToken() || attempts >= maxAttempts) {
                    clearInterval(interval);
                    if (attempts >= maxAttempts) {
                        observer.error(new Error('Token not found after timeout. Please log in.'));
                    }
                }
            }, 100);

            return () => clearInterval(interval);
        });
    }

    private decodeToken(token: string): any {
        try {
            const payload = token.split('.')[1];
            return JSON.parse(atob(payload));
        } catch (e) {
            console.error('Error decoding token:', e);
            return null;
        }
    }

    getAllProjects(): Observable<Projet[]> {
        return this.http.get<Projet[]>(`${this.apiUrl}/GetAll`, { headers: this.getHeaders() }).pipe(
            tap((projects) => console.log('Fetched all projects:', projects)),
            catchError(this.handleError)
        );
    }

    getUserProjects(): Observable<Projet[]> {
        return this.currentUserId$.pipe(
            tap((userId) => {
                if (!userId) throw new Error('User ID not set');
            }),
            switchMap((userId) =>
                this.http.get<any[]>(`${this.apiUrl}/Getcardfounder/${userId}`).pipe(
                    map((projectCards) =>
                        projectCards.map(
                            (card) =>
                                ({
                                    id: card[7],
                                    name: card[0],
                                    logoUrl: card[1],
                                    sector: card[2],
                                    location: card[3],
                                    creationDate: card[4],
                                    websiteUrl: card[5],
                                    globalScore: card[6],
                                    type: '',
                                    description: '',
                                    objectives: Objectives.COURT_TERME,
                                    status: Statut.EN_DEVELOPPEMENT,
                                    revenue: 0,
                                    numberOfEmployees: 0,
                                    nbFemaleEmployees: 0,
                                    lastUpdated: '',
                                    associatedSectors: '',
                                    technologiesUsed: '',
                                    fundingGoal: 0,
                                    lastEvaluationDate: '',
                                    produits: [],
                                    services: [],
                                    folders: [],
                                    phases: [],
                                    founder: null,
                                    entrepreneurs: [],
                                    coaches: [],
                                    investors: [],
                                    pendingCollaborator: null
                                }) as Projet
                        )
                    ),
                    catchError(this.handleError)
                )
            )
        );
    }

    getProjectCount(): Observable<number> {
        return this.currentUserId$.pipe(
            tap((userId) => {
                if (!userId) throw new Error('User ID not set');
            }),
            switchMap((userId) =>
                this.http.get<any[]>(`${this.apiUrl}/Getcardfounder/${userId}`, { headers: this.getHeaders() }).pipe(
                    map((projectCards) => projectCards.length),
                    catchError(this.handleError)
                )
            )
        );
    }

    createProjet(projet: Projet, logoFile: File | null): Observable<Projet> {
        const url = `${this.apiUrl}/AddProjet`;
        const formData = new FormData();
        const projetToSend = {
            name: projet.name,
            sector: projet.sector,
            type: projet.type || '',
            creationDate: projet.creationDate,
            description: projet.description || '',
            objectives: projet.objectives || 'COURT_TERME',
            status: projet.status || 'EN_DEVELOPPEMENT',
            globalScore: projet.globalScore || 0,
            location: projet.location || '',
            logoUrl: projet.logoUrl || '',
            websiteUrl: projet.websiteUrl || '',
            revenue: projet.revenue || 0,
            numberOfEmployees: projet.numberOfEmployees || 0,
            nbFemaleEmployees: projet.nbFemaleEmployees || 0,
            lastUpdated: projet.lastUpdated || '',
            associatedSectors: projet.associatedSectors || '',
            technologiesUsed: projet.technologiesUsed || '',
            fundingGoal: projet.fundingGoal || 0,
            lastEvaluationDate: projet.lastEvaluationDate || ''
        };
        console.log('Sending projet JSON:', JSON.stringify(projetToSend, null, 2));
        formData.append('projet', JSON.stringify(projetToSend));
        if (logoFile) {
            console.log('Logo file:', logoFile?.name, 'Size:', logoFile?.size, 'Type:', logoFile?.type);
            formData.append('logourl', logoFile);
        } else {
            console.log('No logo file provided');
        }

        return this.http.post(url, formData, { headers: this.getHeaders(false), observe: 'response' }).pipe(
            map((response: HttpResponse<any>) => {
                if (response.status >= 200 && response.status < 300) {
                    return response.body as Projet;
                } else {
                    throw new HttpErrorResponse({
                        status: response.status,
                        statusText: response.statusText,
                        error: response.body
                    });
                }
            }),
            tap((response) => console.log('Create project response:', response)),
            catchError(this.handleError)
        );
    }

    getProjetById(id: number): Observable<Projet> {
        const url = `${this.apiUrl}/GetProjet/${id}`;
        return this.http.get<Projet>(url, { headers: this.getHeaders() }).pipe(catchError(this.handleError));
    }

    getCoachProjects(coachId: number): Observable<Projet[]> {
        const url = `${this.apiUrl}/coach/${coachId}`;
        return this.http.get<any[]>(url, { headers: this.getHeaders() }).pipe(
            map((projects) =>
                projects.map(
                    (project) =>
                        ({
                            id: project.id || 0,
                            name: project.name || '',
                            logoUrl: project.logoUrl || null,
                            sector: project.sector || '',
                            location: project.location || '',
                            creationDate: project.creationDate || '',
                            websiteUrl: project.websiteUrl || null,
                            globalScore: project.globalScore || 0,
                            type: project.type || '',
                            description: project.description || '',
                            objectives: project.objectives || Objectives.COURT_TERME,
                            status: project.status || Statut.EN_DEVELOPPEMENT,
                            revenue: project.revenue || 0,
                            numberOfEmployees: project.numberOfEmployees || 0,
                            nbFemaleEmployees: project.nbFemaleEmployees || 0,
                            lastUpdated: project.lastUpdated || '',
                            associatedSectors: project.associatedSectors || '',
                            technologiesUsed: project.technologiesUsed || '',
                            fundingGoal: project.fundingGoal || 0,
                            lastEvaluationDate: project.lastEvaluationDate || '',
                            produits: project.produits || [],
                            services: project.services || [],
                            folders: project.folders || [],
                            phases: project.phases || [],
                            founder: project.founder || null,
                            entrepreneurs: project.entrepreneurs || [],
                            coaches: project.coaches || [],
                            investors: project.investors || [],
                            pendingCollaborator: project.pendingCollaborator || null
                        }) as Projet
                )
            ),
            catchError(this.handleError)
        );
    }

    updateProjet(id: number, projet: Projet, logoFile: File | null): Observable<Projet> {
        const url = `${this.apiUrl}/UpdateProjet/${id}`;
        const formData = new FormData();
        const projetToSend = { ...projet, founder: undefined };
        formData.append('projet', JSON.stringify(projetToSend));
        if (logoFile) {
            formData.append('logourl', logoFile);
        }
        return this.http.put<Projet>(url, formData, { headers: this.getHeaders(false) }).pipe(catchError(this.handleError));
    }

    deleteProjet(id: number): Observable<string> {
        const url = `${this.apiUrl}/DeleteProjet/${id}`;
        return this.http.delete(url, { headers: this.getHeaders(), responseType: 'text' }).pipe(catchError(this.handleError));
    }

    getPendingInvitations(): Observable<PendingInvitation[]> {
        const url = `${this.apiUrl}/pending-invitations`;
        return this.http.get<PendingInvitation[]>(url, { headers: this.getHeaders() }).pipe(
            tap((response) => console.log('Pending invitations response:', response)),
            catchError(this.handleError)
        );
    }

    inviteCollaborator(projetId: number, userId: number): Observable<Projet> {
        const url = `${this.apiUrl}/${projetId}/invite/${userId}`;
        return this.http.post<Projet>(url, {}, { headers: this.getHeaders() }).pipe(catchError(this.handleError));
    }

    acceptInvitation(projetId: number, userId: number): Observable<Projet> {
        const url = `${this.apiUrl}/${projetId}/accept/${userId}`;
        return this.http.post<Projet>(url, {}, { headers: this.getHeaders() }).pipe(catchError(this.handleError));
    }

    declineInvitation(projetId: number, userId: number): Observable<Projet> {
        const url = `${this.apiUrl}/${projetId}/decline/${userId}`;
        return this.http.post<Projet>(url, {}, { headers: this.getHeaders() }).pipe(catchError(this.handleError));
    }

    getEligibleCollaborators(projetId: number): Observable<User[]> {
        const url = `${this.apiUrl}/${projetId}/eligible-collaborators`;
        return this.http.get<User[]>(url, { headers: this.getHeaders() }).pipe(catchError(this.handleError));
    }

    getProjectContacts(projectId: number): Observable<ProjectContacts> {
        const url = `${this.apiUrl}/${projectId}/contacts`;
        return this.http.get<ProjectContacts>(url, { headers: this.getHeaders() }).pipe(
            tap((response) => console.log(`Project ${projectId} contacts:`, response)),
            catchError(this.handleError)
        );
    }

    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'Une erreur est survenue. Veuillez réessayer plus tard.';
        let status = error.status;

        if (status === 401) {
            errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        } else if (status === 402) {
            if (typeof error.error === 'string') {
                errorMessage = error.error.includes('You have reached the limit') ? 'Veuillez accéder au paiement pour mettre à jour votre compte.' : error.error;
            } else if (error.error instanceof Blob) {
                return new Observable((observer) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const text = reader.result as string;
                        errorMessage = text.includes('You have reached the limit') ? 'Veuillez accéder au paiement pour mettre à jour votre compte.' : text;
                        observer.error({ status, message: errorMessage });
                        observer.complete();
                    };
                    reader.onerror = () => {
                        observer.error({ status, message: errorMessage });
                        observer.complete();
                    };
                    reader.readAsText(error.error);
                });
            } else {
                errorMessage = error.error?.message || 'Veuillez accéder au paiement pour mettre à jour votre compte.';
            }
        } else if (status === 400) {
            errorMessage = typeof error.error === 'string' ? error.error : error.error?.message || 'Requête invalide.';
        } else if (status === 403) {
            errorMessage = 'Accès interdit.';
        } else if (status === 404) {
            errorMessage = 'Ressource non trouvée.';
        } else if (status === 500) {
            errorMessage = 'Erreur serveur interne.';
        }

        console.error('Error details:', error);
        return throwError(() => ({ status, message: errorMessage }));
    }

    getCoachesForEntrepreneur(userId: number): Observable<Coach[]> {
        const url = `http://localhost:8085/api/projets/entrepreneur/${userId}/coaches`;
        const headers = this.getHeaders();
        console.log('Request Headers:', headers);
        return this.http.get<Coach[]>(url, { headers }).pipe(
            tap((response) => console.log(`Coaches for entrepreneur ${userId}:`, response)),
            catchError((error) => this.handleError(error))
        );
    }

    getCoachDashboardStatistics(userId: number): Observable<DashboardStatistics> {
        return this.http.get<DashboardStatistics>(`${this.apiUrl}/coach/${userId}/statistics`);
    }

    addCoachToProjet(projetId: number, userId: number): Observable<Projet> {
        const url = `${this.apiUrl}/${projetId}/coach/${userId}`;
        return this.http.post<Projet>(url, {}, { headers: this.getHeaders() }).pipe(catchError(this.handleError));
    }
}
