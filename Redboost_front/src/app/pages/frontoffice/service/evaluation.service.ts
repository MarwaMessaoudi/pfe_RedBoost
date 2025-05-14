// src/app/service/evaluation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EvaluationForm } from '../../../models/evaluation.model';

@Injectable({
    providedIn: 'root'
})
export class EvaluationService {
    // Make sure the URL matches your backend controller mapping
    private apiUrl = 'http://localhost:8085/api/evaluations';

    constructor(private http: HttpClient) {}

    /**
     * Submits the evaluation form data.
     * @param formData The form data object formatted according to EvaluationForm interface.
     * @returns Observable resolving with the backend response.
     */
    submitEvaluation(formData: EvaluationForm): Observable<any> {
        // Angular HttpClient serializes the formData object to JSON.
        // Make sure the properties and nested objects match backend expectations.
        return this.http.post<any>(this.apiUrl, formData);
    }

    /**
     * Checks for completed phases associated with the user's projects
     * for which the user has not yet submitted an evaluation.
     * @param userId The ID of the currently logged-in entrepreneur user.
     * @returns Observable emitting an array of phase IDs that need evaluation.
     */
    getPendingEvaluationPhaseIds(userId: number): Observable<number[]> {
        // **SECURITY NOTE:** In a production app with backend authentication,
        // the backend endpoint should get the userId from the authenticated user context,
        // NOT trust a userId passed in the URL path like this for security critical data.
        // For development/demonstration, this might work.
        return this.http.get<number[]>(`${this.apiUrl}/pending-for-user/${userId}`);
    }

    // Optional: Method to get a single phase's details by ID if needed by the form,
    // although passing data via MAT_DIALOG_DATA is better.
    // getPhaseDetails(phaseId: number): Observable<Phase> {
    //    return this.http.get<Phase>(`your_backend_phase_api_url/${phaseId}`);
    // }
}
