import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environment';

export interface Investment {
    id?: number;
    startup: string;
    amount: number;
    roi: number;
    progress: number;
    lastUpdate: string | Date;
}

export interface InvestmentKpis {
    totalInvestments: number;
    averageRoi: number;
    activeInvestments: number;
}

export interface MonthlyData {
    month: string;
    roi: number;
    investments: number;
}

@Injectable({
    providedIn: 'root'
})
export class InvestmentService {
    private apiUrl = 'http://localhost:8085/api';

    constructor(private http: HttpClient) {}

    getInvestments(): Observable<Investment[]> {
        return this.http.get<Investment[]>(`${this.apiUrl}/investments`);
    }

    getKpis(): Observable<InvestmentKpis> {
        return this.http.get<InvestmentKpis>(`${this.apiUrl}/investments/kpis`);
    }

    getMonthlyData(): Observable<MonthlyData[]> {
        return this.http.get<MonthlyData[]>(`${this.apiUrl}/investments/monthly`);
    }
}
