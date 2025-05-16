import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { catchError, Observable, of, tap, throwError, timer, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Auth, signInWithPopup, GoogleAuthProvider } from '@angular/fire/auth';
import { jwtDecode } from 'jwt-decode';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly API_URL = 'http://localhost:8085/Auth';
    isRefreshing = false;
    private refreshInterval = 24 * 60 * 60 * 1000; // trigger refreshing /24 hours
    private refreshSubscription: Subscription | null = null;

    constructor(
        private http: HttpClient,
        private router: Router,
        private messageService: MessageService,
        private auth: Auth
    ) {}

    login(email: string, password: string): Observable<any> {
        return this.http
            .post(
                `${this.API_URL}/login`,
                { email, password },
                { withCredentials: true }
            )
            .pipe(
                tap((response: any) => {
                    localStorage.setItem('accessToken', response.accessToken);
                    localStorage.setItem('refreshToken', response.refreshToken);
                    this.startTokenRefresh();
                })
            );
    }

    refreshToken(): Observable<any> {
        return this.http
            .post(
                `${this.API_URL}/refresh`,
                {},
                { withCredentials: true }
            )
            .pipe(
                tap((response: any) => {
                    localStorage.setItem('accessToken', response.accessToken);
                    if (response.refreshToken) {
                        localStorage.setItem('refreshToken', response.refreshToken);
                    }
                })
            );
    }

    resendConfirmationEmail(email: string): Observable<any> {
        return this.http.post(`${this.API_URL}/resend-confirmation`, { email });
    }

    async googleLogin(selectedRole: string): Promise<Observable<any>> {
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });

            const result = await signInWithPopup(this.auth, provider);
            const idToken = await result.user?.getIdToken();


            const loginPayload = { idToken, role: selectedRole };

            return this.http
                .post(`${this.API_URL}/firebase`, loginPayload, { withCredentials: true })
                .pipe(
                    tap((response: any) => {
                        localStorage.setItem('accessToken', response.accessToken);
                        localStorage.setItem('refreshToken', response.refreshToken);
                        this.startTokenRefresh();
                    })
                );
        } catch (error) {
            console.error('Google login error:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Google Error',
                detail: 'Login failed'
            });
            throw error;
        }
    }

    getUserRole(): string | null {
        const token = this.getToken();
        if (!token) {
            return null;
        }
        try {
            const decodedToken: any = jwtDecode(token);
            return decodedToken.role;
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    verifyToken(): Observable<any> {
        const accessToken = localStorage.getItem('accessToken');

        if (!accessToken) {
            return throwError(() => new Error('No access token found'));
        }

        return this.http.get(`${this.API_URL}/verifyToken`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
    }

    getToken(): string | null {
        return localStorage.getItem('accessToken');
    }

    getUserId(): string | null {
        const token = this.getToken();
        if (!token) {
            return null;
        }
        try {
            const decodedToken: any = jwtDecode(token);
            return decodedToken.userId;
        } catch (error) {
            console.error('Erreur lors du décodage du token:', error);
            return null;
        }
    }

    logout(): Observable<any> {
        this.stopTokenRefresh();
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return this.http.post(`${this.API_URL}/logout`, {}, { withCredentials: true }).pipe(
            catchError((error) => {
                console.error('Logout failed:', error);
                return throwError(error);
            })
        );
    }

    getCurrentUser(): Observable<{ id: number; role: string } | null> {
        const token = this.getToken();
        console.log('Token récupéré:', token);
        if (!token) {
            console.log('Aucun token trouvé dans localStorage');
            return of(null);
        }

        try {
            const decodedToken: any = jwtDecode(token);
            console.log('Token décodé:', decodedToken);
            const userId = decodedToken.userId;
            const role = decodedToken.role;

            if (!userId || !role) {
                console.log('userId ou role manquant dans le token');
                return of(null);
            }

            return of({ id: parseInt(userId, 10), role });
        } catch (error) {
            console.error('Erreur lors du décodage du token:', error);
            return of(null);
        }
    }
         //a commenter 
         // 
    private startTokenRefresh() {
        this.stopTokenRefresh(); // Prevent duplicate timers

        this.refreshSubscription = timer(0, this.refreshInterval)
            .pipe(
                switchMap(() => {
                    if (!this.isRefreshing && localStorage.getItem('accessToken')) {
                        console.log('Proactively refreshing token');
                        return this.refreshToken();
                    }
                    console.log('Skipping refresh: no token or already refreshing');
                    return of(null);
                }),
                catchError((error) => {
                    console.error('Proactive refresh failed:', error);
                    if (error.status === 401 || error.status === 403) {
                        this.stopTokenRefresh();
                        this.logout().subscribe({
                            next: () => {
                                this.messageService.add({
                                    severity: 'error',
                                    summary: 'Session expirée',
                                    detail: 'Votre session a expirée. Veuillez vous reconnecter.'
                                });
                                this.router.navigate(['/landing']);
                            }
                        });
                    }
                    return of(null);
                })
            )
            .subscribe();
    }


    private stopTokenRefresh() {
        if (this.refreshSubscription) {
            this.refreshSubscription.unsubscribe();
            this.refreshSubscription = null;
            console.log('Stopped token refresh');
        }
    }
}