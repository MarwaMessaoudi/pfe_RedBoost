import { Routes } from '@angular/router';
import { InvoicesQuotationsComponent } from './invoices-quotations.component';

export default [
    { path: '', component: InvoicesQuotationsComponent }, 
    { path: '**', redirectTo: '/notfound' }
] as Routes;