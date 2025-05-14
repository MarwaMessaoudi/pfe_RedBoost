import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { AuthService } from './app/pages/frontoffice/service/auth.service';
import { UserService } from './app/pages/frontoffice/service/UserService';
import { HttpClient } from '@angular/common/http';
import { ToastModule } from 'primeng/toast';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterModule, RouterOutlet, ToastModule],
    template: ` <router-outlet></router-outlet> <p-toast></p-toast> `,
    styleUrls: ['./app.component.scss'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent implements OnInit {
    private publicRoutes = ['/signin', '/signup', '/forgot-password', '/reset-password', '/confirm-email', '/coach-request','binome-coach-request', '/'];

    constructor(
        private authService: AuthService,
        private router: Router,
        private userService: UserService,
        private http: HttpClient
    ) {}

    ngOnInit() {
        // Log initial router URL for debugging
        console.log('Initial router.url:', this.router.url);

        // Subscribe to NavigationEnd to get the correct URL after routing
        this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
            // Get the URL path without query parameters
            const currentUrl = event.urlAfterRedirects.split('?')[0];
            console.log('NavigationEnd URL:', currentUrl);

            // Check if the current route is public
            const isPublicRoute = this.publicRoutes.includes(currentUrl);
            console.log('Is public route:', isPublicRoute, 'Public routes:', this.publicRoutes);

            // Skip authentication check for public routes
            if (isPublicRoute) {
                console.log('Public route detected, skipping auth check');
                return;
            }

            // Perform authentication check for non-public routes
            this.checkAuthentication();
        });
    }

    private checkAuthentication() {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        // If no tokens are present, handle unauthenticated state
        if (!accessToken && !refreshToken) {
            console.log('No tokens found, redirecting to landing page');
            this.handleAuthFailure();
            return;
        }

        // If both tokens are present, verify the access token
        if (accessToken && refreshToken) {
            this.authService.verifyToken().subscribe({
                next: (response) => {
                    console.log('Token verification successful:', response);
                    this.fetchUserProfile();
                },
                error: (error) => {
                    console.error('Token verification failed:', error);
                    this.attemptTokenRefresh();
                }
            });
        } else {
            this.attemptTokenRefresh();
        }
    }

    private attemptTokenRefresh() {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            console.log('No refresh token available, handling auth failure');
            this.handleAuthFailure();
            return;
        }

        this.authService.refreshToken().subscribe({
            next: (response: any) => {
                console.log('Token refresh successful:', response);
                localStorage.setItem('accessToken', response.accessToken);
                localStorage.setItem('refreshToken', response.refreshToken);
                this.fetchUserProfile();
            },
            error: (error) => {
                console.error('Token refresh failed:', error);
                this.handleAuthFailure();
            }
        });
    }

    private handleAuthFailure() {
        this.clearTokens();
        this.userService.setUser(null);
        this.router.navigate(['/']); // Redirect to landing page for protected routes
    }

    private fetchUserProfile() {
        this.http
            .get('http://localhost:8085/users/profile', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`
                }
            })
            .subscribe({
                next: (response: any) => {
                    console.log('User profile fetched successfully:', response);
                    this.userService.setUser(response);
                },
                error: (error) => {
                    console.error('Failed to fetch user profile:', error);
                    this.userService.setUser(null);
                }
            });
    }

    private clearTokens() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }
}
