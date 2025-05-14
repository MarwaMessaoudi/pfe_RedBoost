import { Routes } from '@angular/router';
import { ServicesComponent } from './services.component';

export default [
    { path: '', component: ServicesComponent }, 
    { path: '**', redirectTo: '/notfound' }
] as Routes;