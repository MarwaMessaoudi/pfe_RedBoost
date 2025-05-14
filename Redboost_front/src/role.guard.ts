import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './app/pages/frontoffice/service/auth.service';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {
    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
        // Get allowed roles from route data (support both 'roles' and 'expectedRole')
        const allowedRoles = route.data['roles'] || (route.data['expectedRole'] ? [route.data['expectedRole']] : []);

        // If no roles are specified, allow access (e.g., for DashboardRedirectComponent)
        if (allowedRoles.length === 0) {
            console.warn(`No roles specified for route ${state.url}, allowing access`);
            return true;
        }

        return this.authService.getCurrentUser().pipe(
            take(1),
            map(user => {
                if (!user) {
                    console.warn('No user logged in, redirecting to landing');
                    this.router.navigate(['/landing']);
                    return false;
                }

                const userRole = user.role;
                console.log(`Checking access for route: ${state.url}, userRole: ${userRole}, allowedRoles: ${allowedRoles}`);

                if (!allowedRoles.includes(userRole)) {
                    console.warn(`Access denied. User role ${userRole} not in allowed roles: ${allowedRoles}`);
                    this.router.navigate(['/notfound']);
                    return false;
                }

                console.log(`Access granted for user role ${userRole} to route ${state.url}`);
                return true;
            })
        );
    }
}