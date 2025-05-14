import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { provideNativeDateAdapter } from '@angular/material/core'; // Import this!
import { MessageService } from 'primeng/api'; // Import MessageService
import { AuthInterceptor } from './app/pages/frontoffice/gestion_user/auth/AuthInterceptor';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth, setPersistence, browserLocalPersistence } from '@angular/fire/auth';
import { environment } from './environment';

console.log('Initializing Firebase with config:', environment.firebaseConfig);

import { ToastrModule } from 'ngx-toastr';

export const appConfig: ApplicationConfig = {
    providers: [
        MessageService, // Provide MessageService
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideFirebaseApp(() => initializeApp(environment.firebaseConfig)), // Initialize Firebase
        provideAuth(() => {
            const auth = getAuth(); // Get the Firebase Auth instance
            setPersistence(auth, browserLocalPersistence) // Set persistence to local
                .then(() => {
                    console.log('Firebase authentication persistence set to local.');
                })
                .catch((error) => {
                    console.error('Error setting Firebase persistence:', error);
                });
            return auth;
        }),
        provideHttpClient(
            withFetch(),
            withInterceptors([AuthInterceptor]) // Add AuthInterceptor
        ),
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: 'aura', options: { darkModeSelector: '.app-dark' } } }),
        provideNativeDateAdapter(), // ✅ Fixed missing comma
        importProvidersFrom(ToastrModule.forRoot()) // ✅ Import ToastrModule properly
    ]
};
