import { Routes } from '@angular/router';
import { StartupDetailsComponent } from './Startup';

export default [
    { path: '', component: StartupDetailsComponent },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
