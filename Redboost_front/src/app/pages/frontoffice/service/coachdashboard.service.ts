import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Kpi {
  title: string;
  value: string;
  description: string;
  progress: number;
}

export interface Startup {
  name: string;
  satisfaction: number;
  progress: number;
  score: number;
  status: string;
  tasks: {
    name: string;
    deadline: Date;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class CoachDashboardService {
  private apiUrl = 'http://localhost:8085/api/coach';

  constructor(private http: HttpClient) {}

  getKPIs(): Observable<Kpi[]> {
    return this.http.get<Kpi[]>(`${this.apiUrl}/kpis`);
  }

  getStartups(): Observable<Startup[]> {
    return this.http.get<Startup[]>(`${this.apiUrl}/startups`);
  }
}