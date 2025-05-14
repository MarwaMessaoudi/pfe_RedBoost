import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../frontoffice/service/auth.service';
@Component({
    selector: 'app-dashboard-redirect',
    template: '<div>Redirecting to your dashboard...</div>'
})
export class DashboardRedirectComponent {
    constructor(
        private authService: AuthService,
        private router: Router
    ) {
        const userRole = this.authService.getUserRole();

        switch (userRole) {
            case 'COACH':
                this.router.navigate(['/Dash']);
                break;
            case 'ENTREPRENEUR':
                this.router.navigate(['/entrepreneur-dashboard']);
                break;
            case 'INVESTOR':
                this.router.navigate(['/investor-dashboard']);
                break;
            default:
                this.router.navigate(['/notfound']);
        }
    }
}
