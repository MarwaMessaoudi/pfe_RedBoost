// task-category.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TaskCategory } from '../../../models/task';

@Injectable({
    providedIn: 'root'
})
export class TaskCategoryService {
    private apiUrl = 'http://localhost:8085/api/task-categories';

    constructor(private http: HttpClient) {}

    getAllTaskCategories(): Observable<TaskCategory[]> {
        return this.http.get<TaskCategory[]>(this.apiUrl);
    }

    createTaskCategory(category: TaskCategory): Observable<TaskCategory> {
        return this.http.post<TaskCategory>(this.apiUrl, category);
    }
}
