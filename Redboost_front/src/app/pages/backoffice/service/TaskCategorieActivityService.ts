import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TaskCategoryActivity } from '../../../models/TaskActivity.modal';

@Injectable({
    providedIn: 'root'
})
export class TaskCategoryActivityService {
    private apiUrl = 'http://localhost:8085/api/task-category-activities'; // Updated endpoint

    constructor(private http: HttpClient) {}

    getAllTaskCategoryActivities(): Observable<TaskCategoryActivity[]> {
        // Updated method name
        return this.http.get<TaskCategoryActivity[]>(this.apiUrl);
    }

    createTaskCategoryActivity(categoryActivity: TaskCategoryActivity): Observable<TaskCategoryActivity> {
        // Updated method and parameter name
        return this.http.post<TaskCategoryActivity>(this.apiUrl, categoryActivity);
    }
}
