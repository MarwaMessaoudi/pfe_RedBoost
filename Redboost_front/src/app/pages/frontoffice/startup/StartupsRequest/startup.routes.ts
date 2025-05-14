import { Routes } from '@angular/router';
import { StartupInvestmentRequestsComponent } from '../StartupsRequest/startup';

export default [
    { path: '', component: StartupInvestmentRequestsComponent }, 
    { path: '**', redirectTo: '/notfound' }
] as Routes;