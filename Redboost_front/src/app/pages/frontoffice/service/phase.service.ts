import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Phase } from '../../../models/phase';
import { User } from '../../../models/user';

@Injectable({
    providedIn: 'root'
})
export class PhaseService {
    private apiUrl = 'http://localhost:8085/api/phases';

    constructor(private http: HttpClient) {}

    getAllPhases(): Observable<Phase[]> {
        return this.http.get<Phase[]>(this.apiUrl);
    }

    getPhaseById(id: number): Observable<Phase> {
        return this.http.get<Phase>(`${this.apiUrl}/${id}`);
    }

    createPhase(phase: Phase): Observable<Phase> {
        return this.http.post<Phase>(`${this.apiUrl}/`, phase);
    }

    updatePhase(id: number, phase: Phase): Observable<Phase> {
        return this.http.put<Phase>(`${this.apiUrl}/${id}`, phase);
    }

    deletePhase(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    getPhasesByDateRange(startDate: string, endDate: string): Observable<Phase[]> {
        const params = new HttpParams().set('start', startDate).set('end', endDate);
        return this.http.get<Phase[]>(`${this.apiUrl}/date-range`, { params });
    }

    /**
     * Fetches the list of entrepreneurs (users) belonging to a specific project.
     * @param projectId - The ID of the project
     * @returns Observable<User[]> - List of entrepreneurs
     */
    /**
     * Fetches the list of entrepreneurs (users) belonging to a specific project.
     * @param projectId - The ID of the project
     * @returns Observable<User[]> - List of entrepreneurs
     */
    getEntrepreneursByProject(projectId: number): Observable<User[]> {
        return this.http.get<any[]>(`${this.apiUrl}/entrepreneurs/${projectId}`).pipe(
            map((response) => {
                if (response && response.length > 0 && response[0].entrepreneurs_info) {
                    const entrepreneursString: string = response[0].entrepreneurs_info;
                    const entrepreneursArray = entrepreneursString
                        .split('; ')
                        .map((entrepreneur) => {
                            const values = entrepreneur.split('|');
                            if (values.length === 6 || values.length === 7) {
                                // Accept 6 or 7 fields
                                return {
                                    id: parseInt(values[0], 10),
                                    firstName: values[1],
                                    lastName: values[2],
                                    email: values[3],
                                    phoneNumber: values[4],
                                    role: values[5],
                                    profilePictureUrl: values.length === 7 ? values[6] : '' // Default to empty string if missing
                                } as User;
                            } else {
                                console.warn('Invalid entrepreneur data:', entrepreneur);
                                return null;
                            }
                        })
                        .filter((entrepreneur) => entrepreneur !== null) as User[];

                    return entrepreneursArray;
                } else {
                    console.warn('No entrepreneurs_info found in the response:', response);
                    return [];
                }
            })
        );
    }
}
