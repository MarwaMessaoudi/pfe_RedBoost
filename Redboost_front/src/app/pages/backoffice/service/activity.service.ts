import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Activity } from '../../../models/activity.modal';

@Injectable({
    providedIn: 'root'
})
export class ActivityService {
    private baseUrl = 'http://localhost:8085/api/activities';

    constructor(private http: HttpClient) {}

    /**
     * Liste des activités par programme
     */
    getActivitiesByProgram(programId: number): Observable<Activity[]> {
        return this.http.get<Activity[]>(`${this.baseUrl}/a/program/${programId}`);
    }

    /**
     * Créer une activité associée à un programme
     */
    createActivity(activityData: Activity, programId: number): Observable<Activity> {
        return this.http.post<Activity>(`${this.baseUrl}/program/${programId}`, activityData);
    }

    /**
     * Charger une activité par son ID
     */
    getActivityById(activityId: number): Observable<Activity> {
        return this.http.get<Activity>(`${this.baseUrl}/${activityId}`);
    }

    /**
     * Mettre à jour une activité (optionnel)
     */
    updateActivity(activityId: number, updatedActivity: Activity): Observable<Activity> {
        return this.http.put<Activity>(`${this.baseUrl}/${activityId}`, updatedActivity);
    }

    /**
     * Supprimer une activité (optionnel)
     */
    deleteActivity(activityId: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${activityId}`);
    }
}
