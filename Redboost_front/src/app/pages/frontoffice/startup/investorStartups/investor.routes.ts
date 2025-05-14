import { Routes } from '@angular/router';
import { InvestorStartupsComponent } from './investorStartups';

export default [
    { path: '', component: InvestorStartupsComponent }, 
    { path: '**', redirectTo: '/notfound' }
] as Routes;
