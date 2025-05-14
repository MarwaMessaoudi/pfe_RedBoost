import { Routes } from '@angular/router';
import { CustomersComponent } from './customers.component';

export default [
    { path: '', component: CustomersComponent }, 
    { path: '**', redirectTo: '/notfound' }
] as Routes;