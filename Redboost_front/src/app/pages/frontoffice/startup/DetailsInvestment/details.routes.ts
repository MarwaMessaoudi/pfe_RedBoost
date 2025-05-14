import { Routes } from '@angular/router';
import { StartupDetailsComponent } from './details';

export default [
    { path: '', component: StartupDetailsComponent }, 
    { path: '**', redirectTo: '/notfound' }
] as Routes;