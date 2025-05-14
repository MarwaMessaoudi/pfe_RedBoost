import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task, Attachment, TaskCategory, SubTask, Comment } from '../../../models/task';
import { map } from 'rxjs/operators';

interface Assignee {
    id: number;
    name: string;
    avatar?: string;
}

@Injectable({
    providedIn: 'root'
})
export class TaskService {
    private apiUrl = 'http://localhost:8085/api/tasks';

    constructor(private http: HttpClient) {}

    getAllTasks(): Observable<Task[]> {
        return this.http.get<Task[]>(this.apiUrl).pipe(map((tasks) => this.transformTasks(tasks)));
    }

    getTaskById(id: number): Observable<Task> {
        return this.http.get<Task>(`${this.apiUrl}/${id}`).pipe(map((task) => this.transformTask(task)));
    }

    createTask(task: Task, attachment?: File): Observable<Task> {
        const formData = new FormData();
        const taskJsonPart = {
            title: task.title,
            xpPoint: task.xpPoint,
            description: task.description,
            assigneeId: task.assigneeId,
            startDate: task.startDate,
            endDate: task.endDate,
            priority: task.priority,
            status: task.status,
            phase: task.phase?.phaseId !== undefined ? { phaseId: task.phase.phaseId } : task.phase || null,
            taskCategory: task.taskCategory?.id !== undefined ? { id: task.taskCategory.id } : task.taskCategoryId !== undefined ? { id: task.taskCategoryId } : null,
            subTasks: task.subTasks || [],
            comments: task.comments || [],
            attachment: null
        };

        formData.append('task', new Blob([JSON.stringify(taskJsonPart)], { type: 'application/json' }));
        if (attachment) {
            formData.append('attachment', attachment, attachment.name);
        } else {
            formData.append('attachment', new Blob([], { type: 'application/octet-stream' }), '');
        }

        return this.http.post<Task>(this.apiUrl, formData).pipe(map((task) => this.transformTask(task)));
    }

    updateTask(id: number, task: Task): Observable<Task> {
        console.log('Task being sent to update:', task);
        console.log('Sending PUT to:', `${this.apiUrl}/${id}`);

        const token = localStorage.getItem('accessToken');
        console.log('JWT token for update:', token ? 'Found' : 'Not found');

        if (!token) {
            console.error('No access token found. Please log in again.');
            throw new Error('No access token found');
        }

        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        });

        const taskToSend = {
            taskId: id,
            title: task.title,
            description: task.description || '',
            priority: task.priority,
            status: task.status,
            taskCategoryId: task.taskCategoryId ?? task.taskCategory?.id,
            xpPoint: task.xpPoint || 0,
            startDate: task.startDate || null,
            endDate: task.endDate || null,
            assigneeId: task.assigneeId || null,
            subTasks: task.subTasks || [],
            comments: task.comments || [],
            attachment: task.attachment ? task.attachment.fileId : null
        };

        console.log('Payload being sent:', taskToSend);

        return this.http.put<Task>(`${this.apiUrl}/${id}`, taskToSend, { headers }).pipe(map((updatedTask) => this.transformTask(updatedTask)));
    }

    deleteTask(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    getTasksByPhaseId(phaseId: number): Observable<Task[]> {
        return this.http.get<Task[]>(`${this.apiUrl}/phase/${phaseId}`).pipe(map((tasks) => this.transformTasks(tasks)));
    }

    getTasksByCategoryId(categoryId: number): Observable<Task[]> {
        return this.http.get<Task[]>(`${this.apiUrl}/category/${categoryId}`).pipe(map((tasks) => this.transformTasks(tasks)));
    }

    addCommentToTask(taskId: number, comment: Comment): Observable<Task> {
        return this.http.post<Task>(`${this.apiUrl}/${taskId}/comments`, comment).pipe(map((task) => this.transformTask(task)));
    }

    validateTask(taskId: number): Observable<Task> {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            throw new Error('No access token found');
        }
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        });
        return this.http.post<Task>(`${this.apiUrl}/${taskId}/validate`, {}, { headers }).pipe(map((task) => this.transformTask(task)));
    }

    rejectTask(taskId: number): Observable<Task> {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            throw new Error('No access token found');
        }
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        });
        return this.http.post<Task>(`${this.apiUrl}/${taskId}/reject`, {}, { headers }).pipe(map((task) => this.transformTask(task)));
    }

    downloadAttachment(taskId: number): Observable<Blob> {
        const headers = new HttpHeaders({
            Accept: 'application/octet-stream'
        });
        return this.http.get(`${this.apiUrl}/${taskId}/attachment`, {
            headers: headers,
            responseType: 'blob'
        });
    }

    private transformTask(task: Task): Task {
        let category: TaskCategory | undefined;
        if (task.taskCategory && task.taskCategory.id !== undefined) {
            category = task.taskCategory;
        } else if (task.taskCategoryId !== undefined) {
            category = { id: task.taskCategoryId, name: 'Unknown' };
        } else {
            category = { id: 0, name: 'None' };
        }

        let attachment: Attachment = { name: '', fileId: '' };
        if (task.attachment && typeof (task.attachment as unknown) === 'string') {
            attachment = {
                name: '',
                fileId: task.attachment as unknown as string
            };
        } else if (task.attachment) {
            console.warn('Received non-string attachment from backend:', task.attachment);
        }

        return {
            ...task,
            attachment: attachment,
            taskCategory: category,
            taskCategoryId: category?.id,
            subTasks: task.subTasks || [],
            comments: task.comments || []
        } as Task;
    }

    private transformTasks(tasks: Task[]): Task[] {
        return tasks.map((task) => this.transformTask(task));
    }
}
