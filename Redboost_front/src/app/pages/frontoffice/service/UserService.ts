import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private userSubject = new BehaviorSubject<any>(null);
    user$ = this.userSubject.asObservable();
    private userCache = new Map<number, any>(); // Cache for user profiles

    constructor(private http: HttpClient) {}

    // Set user data
    setUser(user: any): void {
        this.userSubject.next(user);
        if (user?.id) {
            this.userCache.set(user.id, user); // Cache current user
        }
    }

    // Fetch all coach requests
    getAllCoachRequests(): Observable<any[]> {
        const headers = new HttpHeaders({
            Authorization: `Bearer ${localStorage.getItem('token')}` // Include if auth required
        });
        return this.http.get<any[]>(`http://localhost:8085/api/coach/requests`, { headers }).pipe(
            catchError((error) => {
                console.error('Error fetching coach requests:', error);
                return of([]);
            })
        );
    }

    // Get user data
    getUser(): any {
        return this.userSubject.value;
    }

    // Fetch user by ID with caching
    getUserById(userId: number): Observable<any> {
        if (this.userCache.has(userId)) {
            return of(this.userCache.get(userId));
        }
        const headers = new HttpHeaders({
            Authorization: `Bearer ${localStorage.getItem('token')}` // Adjust based on your auth mechanism
        });
        return this.http.get(`http://localhost:8085/users/${userId}`, { headers }).pipe(
            tap((user) => {
                this.userCache.set(userId, user);
            }),
            catchError((error) => {
                console.error(`Error fetching user with ID ${userId}:`, error);
                return of(null);
            })
        );
    }

    submitCoachRequest(formData: FormData): Observable<any> {
        return this.http.post(`http://localhost:8085/api/coach/submit`, formData);
    }

    submitBinomeCoachRequest(formData: FormData): Observable<any> {
        return this.http.post(`http://localhost:8085/api/coach/binome`, formData);
    }

    getUsers(): Observable<any[]> {
        return this.http.get<any[]>(`http://localhost:8085/users/ByRoles`);
    }


approveCoachRequest(requestId: number): Observable<any> {
    const headers = new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('token')}`
    });
    return this.http.post(`http://localhost:8085/api/coach/approve/${requestId}`, {}, { headers }).pipe(
        catchError((error) => {
            console.error(`Error approving coach request ${requestId}:`, error);
            throw error;
        })
    );
}

rejectCoachRequest(requestId: number): Observable<any> {
    const headers = new HttpHeaders({
        Authorization: `Bearer ${localStorage.getItem('token')}`
    });
    return this.http.post(`http://localhost:8085}/api/coach/reject/${requestId}`, {}, { headers }).pipe(
        catchError((error) => {
            console.error(`Error rejecting coach request ${requestId}:`, error);
            throw error;
        })
    );
}
}
