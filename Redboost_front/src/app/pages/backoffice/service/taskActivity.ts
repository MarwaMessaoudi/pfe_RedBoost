import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AttachmentActivity, CommentActivity, TaskActivity, TaskCategoryActivity } from '../../../models/TaskActivity.modal';

interface Assignee {
    id: number;
    name: string;
    avatar?: string;
}

@Injectable({
    providedIn: 'root'
})
export class TaskActivityService {
    private apiUrl = 'http://localhost:8085/api/task-activities'; // Updated endpoint

    constructor(private http: HttpClient) {}

    // 📦 Récupérer toutes les tâches d'activité
    getAllTaskActivities(): Observable<TaskActivity[]> {
        return this.http.get<TaskActivity[]>(this.apiUrl).pipe(map(this.transformTaskActivities));
    }

    // 🔍 Une tâche d'activité par ID
    getTaskActivityById(id: number): Observable<TaskActivity> {
        return this.http.get<TaskActivity>(`${this.apiUrl}/${id}`).pipe(map(this.transformTaskActivity));
    }

    // ➕ Créer une tâche d'activité
    createTaskActivity(taskActivity: TaskActivity): Observable<TaskActivity> {
        const taskActivityToSend = {
            ...taskActivity,
            attachments: taskActivity.attachments?.map((attachment) => attachment.name) || [],
            taskCategoryActivity: taskActivity.taskCategoryActivity ? { id: taskActivity.taskCategoryActivity.id } : null,
            subTaskActivitys: taskActivity.subTasks || [], // Updated to subTaskActivitys
            comments: taskActivity.comments || []
        };
        return this.http.post<TaskActivity>(this.apiUrl, taskActivityToSend).pipe(map(this.transformTaskActivity));
    }

    // ✏️ Mettre à jour une tâche d'activité
    updateTaskActivity(id: number, taskActivity: TaskActivity): Observable<TaskActivity> {
        const taskActivityToSend = {
            ...taskActivity,
            attachments: taskActivity.attachments?.map((attachment) => attachment.name) || [],
            taskCategoryActivity: taskActivity.taskCategoryActivity ? { id: taskActivity.taskCategoryActivity.id } : null,
            subTaskActivitys: taskActivity.subTasks || [], // Updated to subTaskActivitys
            comments: taskActivity.comments || []
        };
        return this.http.put<TaskActivity>(`${this.apiUrl}/${id}`, taskActivityToSend).pipe(map(this.transformTaskActivity));
    }

    // ❌ Supprimer
    deleteTaskActivity(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // 🔄 Tâches par Activité (removed phase-related method, kept activity-related one)
    getTaskActivitiesByActivityId(activityId: number): Observable<TaskActivity[]> {
        return this.http.get<TaskActivity[]>(`${this.apiUrl}/activity/${activityId}`).pipe(map(this.transformTaskActivities));
    }

    // 📂 Par catégorie d'activité
    getTaskActivitiesByCategoryId(categoryId: number): Observable<TaskActivity[]> {
        return this.http.get<TaskActivity[]>(`${this.apiUrl}/category/${categoryId}`).pipe(map(this.transformTaskActivities));
    }

    // 👤 Utilisateurs assignés (si dispo)
    getAssigneesForTaskActivity(taskActivityId: number): Observable<Assignee[]> {
        return this.http.get<Assignee[]>(`${this.apiUrl}/${taskActivityId}/assignees`);
    }

    // 💬 Commentaires
    getCommentsForTaskActivity(taskActivityId: number): Observable<Comment[]> {
        return this.http.get<Comment[]>(`${this.apiUrl}/${taskActivityId}/comments`);
    }

    addCommentToTaskActivity(taskActivityId: number, comment: CommentActivity): Observable<TaskActivity> {
        return this.http.post<TaskActivity>(`${this.apiUrl}/${taskActivityId}/comments`, comment).pipe(map(this.transformTaskActivity));
    }

    // 📥 Téléchargement des pièces jointes
    downloadAttachment(taskActivityId: number, fileName: string): Observable<Blob> {
        const url = `${this.apiUrl}/${taskActivityId}/attachments/${fileName}`;
        const headers = new HttpHeaders({ Accept: 'application/octet-stream' });
        return this.http.get(url, { headers, responseType: 'blob' });
    }

    private transformTaskActivity(taskActivity: TaskActivity): TaskActivity {
        // 🔍 ID de catégorie à partir de l'objet ou du champ brut
        const taskCategoryActivityId = taskActivity.taskCategoryActivity?.id ?? taskActivity.taskCategoryActivityId;

        // ✅ Fournir une catégorie toujours valide (jamais undefined)
        const categoryActivity: TaskCategoryActivity =
            taskActivity.taskCategoryActivity && taskActivity.taskCategoryActivity.id
                ? taskActivity.taskCategoryActivity
                : {
                      id: taskCategoryActivityId ?? 0,
                      name: 'Catégorie inconnue'
                  };

        return {
            ...taskActivity,

            taskCategoryActivityId: taskCategoryActivityId ?? 0, // valeur fallback 0 si null/undefined
            taskCategoryActivity: categoryActivity, // toujours défini ✅

            attachments:
                taskActivity.attachments?.map((attachment: string | AttachmentActivity) => {
                    const name = typeof attachment === 'string' ? attachment : attachment.name;
                    return {
                        name,
                        url: `${this.apiUrl}/${taskActivity.taskActivityId}/attachments/${name}`
                    };
                }) || [],

            subTasks: taskActivity.subTasks || [],
            comments: taskActivity.comments || []
        };
    }

    // 🧠 Mapper une liste de tâches d'activité
    private transformTaskActivities = (taskActivities: TaskActivity[]): TaskActivity[] => taskActivities.map(this.transformTaskActivity);
    // Add this method for uploading attachments
    uploadAttachment(taskActivityId: number, file: File): Observable<TaskActivity> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<TaskActivity>(`${this.apiUrl}/${taskActivityId}/attachments`, formData);
    }
    getTasksByProgram(programId: number): Observable<TaskActivity[]> {
        return this.http.get<TaskActivity[]>(`${this.apiUrl}/t/program/${programId}`);
    }
}
