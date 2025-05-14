// Update or create startup-dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StartupKpi {
  title: string;
  value: string;
  description: string;
  progress: number;
}

export interface Task {
  name: string;
  description: string;
  progress: number;
  color: string;
  gradient: string;
  status: string;
}

export interface TaskStats {
  completedTasks: number;
  pendingTasks: number;
  averageProgress: number;
  overdueTasks: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
}

@Injectable({
  providedIn: 'root'
})
export class StartupDashboardService {
  private apiUrl = 'http://localhost:8085/api/startup-dashboard';

  constructor(private http: HttpClient) {}

  getKpis(): Observable<StartupKpi[]> {
    return this.http.get<StartupKpi[]>(`${this.apiUrl}/kpis`);
  }

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks`);
  }

  getTaskStats(): Observable<TaskStats> {
    return this.http.get<TaskStats>(`${this.apiUrl}/task-stats`);
  }

  getRevenueData(): Observable<RevenueData[]> {
    return this.http.get<RevenueData[]>(`${this.apiUrl}/revenue`);
  }
}