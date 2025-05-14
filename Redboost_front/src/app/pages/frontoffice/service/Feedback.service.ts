import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class FeedbackService {
    private apiUrl = 'http://localhost:8085/api/feedback'; // Hardcoded URL

    constructor(private http: HttpClient) {}

    submitFeedback(rating: number): Observable<any> {
        return this.http.post(this.apiUrl, { rating }).pipe(
            tap({
                next: () => console.log('Feedback submitted successfully'),
                error: (err: any) => console.error('Error submitting feedback:', err)
            })
        );
    }
}
