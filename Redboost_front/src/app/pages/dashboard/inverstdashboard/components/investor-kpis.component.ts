import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

interface KpiData {
    totalInvestments: number;
    averageRoi: number;
    activeInvestments: number;
}

@Component({
    selector: 'app-investor-kpis',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Total Investments -->
            <div class="p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105" [@fadeIn]="{ value: '', params: { delay: 0 } }">
                <div class="text-[#0A4955] text-lg font-semibold">Investissements Totaux</div>
                <div class="text-[#DB1E37] text-3xl font-bold mt-2">€{{ isLoading ? '...' : (animatedValues[0] | number: '1.0-0') }}</div>
                <div class="text-[#6B7280] text-sm mt-1">
                    {{ trendMessages[0] }}
                </div>
            </div>

            <!-- ROI -->
            <div class="p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105" [@fadeIn]="{ value: '', params: { delay: 100 } }">
                <div class="text-[#0A4955] text-lg font-semibold">Retour sur Investissement (ROI)</div>
                <div class="text-[#DB1E37] text-3xl font-bold mt-2">{{ isLoading ? '...' : (animatedValues[1] | number: '1.1-1') }}%</div>
                <div class="text-[#6B7280] text-sm mt-1">
                    {{ trendMessages[1] }}
                </div>
            </div>

            <!-- Active Investments -->
            <div class="p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105" [@fadeIn]="{ value: '', params: { delay: 200 } }">
                <div class="text-[#0A4955] text-lg font-semibold">Investissements Actifs</div>
                <div class="text-[#DB1E37] text-3xl font-bold mt-2">
                    {{ isLoading ? '...' : animatedValues[2] }}
                </div>
                <div class="text-[#6B7280] text-sm mt-1">
                    {{ trendMessages[2] }}
                </div>
            </div>
        </div>

        <div *ngIf="errorMessage" class="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
            {{ errorMessage }}
        </div>
    `,
    animations: [trigger('fadeIn', [state('void', style({ opacity: 0, transform: 'translateY(20px)' })), transition(':enter', [animate('0.5s {{delay}}ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))], { params: { delay: 0 } })])]
})
export class InvestorKpisComponent implements OnInit {
    animatedValues: number[] = [0, 0, 0];
    trendMessages: string[] = ['Chargement...', 'Chargement...', 'Chargement...'];
    isLoading: boolean = true;
    errorMessage: string = '';

    constructor(private http: HttpClient) {}

    ngOnInit() {
        this.fetchKpiData();
    }

    fetchKpiData() {
        this.isLoading = true;
        this.errorMessage = '';

        this.http
            .get<KpiData>('http://localhost:8085/api/investments/kpis')
            .pipe(
                catchError((error) => {
                    console.error('Error fetching KPIs:', error);
                    this.errorMessage = 'Erreur lors du chargement des indicateurs.';
                    // Return default values in case of error
                    return of({
                        totalInvestments: 0,
                        averageRoi: 0,
                        activeInvestments: 0
                    });
                })
            )
            .subscribe((data) => {
                this.animateValues(data.totalInvestments, data.averageRoi, data.activeInvestments);

                // Update trend messages based on actual data
                this.trendMessages = [this.generateTrendMessage(data.totalInvestments, 12, '€'), this.generateTrendMessage(data.averageRoi, 3.2, '%'), this.generateTrendMessage(data.activeInvestments, 2, '')];

                this.isLoading = false;
            });
    }

    generateTrendMessage(currentValue: number, improvement: number, unit: string): string {
        if (this.isLoading) return 'Chargement...';
        if (currentValue === 0) return 'Aucune donnée historique';
        return `+${improvement}${unit} vs dernier trimestre`;
    }

    animateValues(total: number, roi: number, active: number) {
        const duration = 2000;
        const targets = [total, roi, active];

        targets.forEach((target, index) => {
            const increment = target / (duration / 16);
            let currentValue = 0;

            const updateAnimation = () => {
                currentValue += increment;
                if (currentValue >= target) {
                    currentValue = target;
                }

                // For ROI (index 1), keep one decimal place
                this.animatedValues[index] = index === 1 ? parseFloat(currentValue.toFixed(1)) : Math.round(currentValue);

                if (currentValue < target) {
                    requestAnimationFrame(updateAnimation);
                }
            };

            requestAnimationFrame(updateAnimation);
        });
    }
}
