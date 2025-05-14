import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

interface MonthlyData {
    month: string;
    roi: number;
    investments: number;
}

@Component({
    selector: 'app-roi-progress-chart',
    standalone: true,
    imports: [ChartModule, CommonModule],
    template: `
        <div class="p-6 bg-white rounded-2xl shadow-lg">
            <div class="text-[#0A4955] text-xl font-bold mb-6">Progrès du ROI et Investissements Mensuels</div>

            <div *ngIf="isLoading" class="loading-indicator">
                <div class="spinner"></div>
                <span>Chargement des données...</span>
            </div>

            <div *ngIf="errorMessage" class="error-message">
                {{ errorMessage }}
            </div>

            <p-chart *ngIf="!isLoading && !errorMessage" type="bar" [data]="chartData" [options]="chartOptions" class="h-80" />
        </div>
    `,
    styles: [
        `
            .loading-indicator {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 300px;
                color: #0a4955;
            }

            .spinner {
                border: 4px solid rgba(10, 73, 85, 0.2);
                border-radius: 50%;
                border-top: 4px solid #0a4955;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin-bottom: 1rem;
            }

            @keyframes spin {
                0% {
                    transform: rotate(0deg);
                }
                100% {
                    transform: rotate(360deg);
                }
            }

            .error-message {
                padding: 1rem;
                background-color: #fff5f6;
                border: 1px solid #db1e37;
                color: #db1e37;
                border-radius: 0.5rem;
                text-align: center;
                margin-top: 1rem;
            }
        `
    ]
})
export class RoiProgressChartComponent implements OnInit {
    chartData: any;
    chartOptions: any;
    isLoading: boolean = true;
    errorMessage: string = '';

    constructor(private http: HttpClient) {}

    ngOnInit() {
        this.fetchChartData();
        this.initChartOptions();
    }

    fetchChartData() {
        this.http
            .get<MonthlyData[]>('http://localhost:8085/api/investments/monthly')
            .pipe(
                catchError((error) => {
                    console.error('Error fetching chart data:', error);
                    this.errorMessage = 'Erreur lors du chargement des données du graphique.';
                    // Return sample data if API fails (optional)
                    return of(this.getSampleData());
                })
            )
            .subscribe((data) => {
                this.prepareChartData(data);
                this.isLoading = false;
            });
    }

    prepareChartData(apiData: MonthlyData[]) {
        const months = apiData.map((item) => item.month);
        const roiData = apiData.map((item) => item.roi);
        const investmentData = apiData.map((item) => item.investments);

        this.chartData = {
            labels: months,
            datasets: [
                {
                    label: 'ROI (%)',
                    data: roiData,
                    backgroundColor: 'rgba(219, 30, 55, 0.8)',
                    borderColor: '#DB1E37',
                    borderWidth: 1,
                    borderRadius: 10,
                    hoverBackgroundColor: 'rgba(219, 30, 55, 1)',
                    yAxisID: 'y'
                },
                {
                    label: 'Investissements (€)',
                    data: investmentData,
                    backgroundColor: 'rgba(10, 73, 85, 0.8)',
                    borderColor: '#0A4955',
                    borderWidth: 1,
                    borderRadius: 10,
                    hoverBackgroundColor: 'rgba(10, 73, 85, 1)',
                    yAxisID: 'y1'
                }
            ]
        };
    }

    initChartOptions() {
        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1500,
                easing: 'easeInOutQuad'
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                x: {
                    stacked: false,
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#0A4955'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'ROI (%)',
                        color: '#DB1E37'
                    },
                    ticks: {
                        color: '#DB1E37'
                    },
                    grid: {
                        color: '#DB1E3720'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Investissements (€)',
                        color: '#0A4955'
                    },
                    ticks: {
                        color: '#0A4955',
                        callback: (value: number) => {
                            if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
                            if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
                            return `€${value}`;
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#0A4955',
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: '#0A4955',
                    titleColor: '#FFFFFF',
                    bodyColor: '#FFFFFF',
                    borderColor: '#DB1E37',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    callbacks: {
                        label: (context: any) => {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.dataset.label === 'ROI (%)' ? `${context.parsed.y}%` : `€${context.parsed.y.toLocaleString('fr-FR')}`;
                            }
                            return label;
                        }
                    }
                }
            }
        };
    }

    // Fallback sample data if API fails
    private getSampleData(): MonthlyData[] {
        return [
            { month: 'Jan', roi: 5, investments: 50000 },
            { month: 'Feb', roi: 7, investments: 75000 },
            { month: 'Mar', roi: 10, investments: 100000 },
            { month: 'Apr', roi: 12, investments: 120000 },
            { month: 'May', roi: 15, investments: 150000 },
            { month: 'Jun', roi: 18, investments: 180000 },
            { month: 'Jul', roi: 20, investments: 200000 },
            { month: 'Aug', roi: 22, investments: 220000 },
            { month: 'Sep', roi: 18, investments: 180000 },
            { month: 'Oct', roi: 15, investments: 150000 },
            { month: 'Nov', roi: 12, investments: 120000 },
            { month: 'Dec', roi: 10, investments: 100000 }
        ];
    }
}
