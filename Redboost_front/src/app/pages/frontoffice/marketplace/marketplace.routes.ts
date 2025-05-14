import { Routes } from '@angular/router';
import { MarketplaceComponent } from './marketplace';

export default [
    { path: '', component: MarketplaceComponent },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
