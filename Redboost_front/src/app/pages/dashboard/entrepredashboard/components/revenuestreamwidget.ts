import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { debounceTime, Subscription } from 'rxjs';
import { LayoutService } from '../../../../layout/service/layout.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { StartupDashboardService } from '../../../frontoffice/service/entrepdashboard.service';
import { RevenueData } from '../../../frontoffice/service/entrepdashboard.service';

@Component({
    standalone: true,
    selector: 'app-revenue-stream-widget',
    imports: [ChartModule],
    template: `
        <div class="card !mb-8 relative overflow-hidden" [@fadeIn]>
            <div class="font-semibold text-xl mb-4 text-[#0A4955]">Startup <span class="text-[#DB1E37]">Revenue</span> Over Time</div>
            <p-chart type="line" [data]="chartData" [options]="chartOptions" class="h-80" />
        </div>
    `,
    animations: [trigger('fadeIn', [transition(':enter', [style({ opacity: 0, transform: 'translateY(20px)' }), animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))])])]
})
export class RevenueStreamWidget implements OnInit, OnDestroy {
    chartData: any;
    chartOptions: any;
    subscription!: Subscription;

    constructor(
        public layoutService: LayoutService,
        private dashboardService: StartupDashboardService
    ) {
        this.subscription = this.layoutService.configUpdate$.pipe(debounceTime(25)).subscribe(() => {
            if (this.chartData) {
                this.initChartWithData(this.chartData.datasets[0].data);
            }
        });
    }

    ngOnInit() {
        this.loadRevenueData();
    }

    loadRevenueData() {
        this.dashboardService.getRevenueData().subscribe({
            next: (data: RevenueData[]) => {
                this.initChartWithData(data);
            },
            error: (error) => {
                console.error('Error loading revenue data:', error);
                // Fallback to sample data
                const sampleData = [
                    { month: 'Jan', revenue: 5000 },
                    { month: 'Feb', revenue: 15000 },
                    { month: 'Mar', revenue: 10000 },
                    { month: 'Apr', revenue: 25000 },
                    { month: 'May', revenue: 20000 },
                    { month: 'Jun', revenue: 30000 },
                    { month: 'Jul', revenue: 35000 }
                ];
                this.initChartWithData(sampleData);
            }
        });
    }

    initChartWithData(data: RevenueData[]) {
        const labels = data.map((item) => item.month);
        const revenueData = data.map((item) => item.revenue);

        this.chartData = {
            labels: labels,
            datasets: [
                {
                    label: 'Revenue (in USD)',
                    borderColor: '#0A4955',
                    backgroundColor: 'rgba(10, 73, 85, 0.1)',
                    data: new Array(data.length).fill(null),
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#0A4955',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2
                }
            ]
        };

        this.chartOptions = {
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            responsive: true,
            animation: {
                duration: 2000,
                easing: 'easeOutQuart',
                onProgress: (animation: any) => {
                    const chart = animation.chart;
                    const ctx = chart.ctx;
                    const meta = chart.getDatasetMeta(0);

                    if (meta.data.length > 0) {
                        const lastPoint = meta.data[meta.data.length - 1];
                        const x = lastPoint.x;
                        const y = lastPoint.y;

                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(meta.data[0].x, meta.data[0].y);
                        for (let i = 1; i < meta.data.length; i++) {
                            ctx.lineTo(meta.data[i].x, meta.data[i].y);
                        }
                        ctx.strokeStyle = '#0A4955';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: '#0A4955',
                    titleColor: '#FFFFFF',
                    bodyColor: '#FFFFFF',
                    borderColor: '#DB1E37',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    callbacks: {
                        label: (context: any) => {
                            const value = context.raw;
                            return `Revenue: $${value}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#0A4955',
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#0A4955',
                        font: {
                            size: 12
                        },
                        callback: (value: any) => `$${value}`
                    },
                    grid: {
                        color: '#DB1E3720',
                        drawBorder: false
                    }
                }
            },
            hover: {
                mode: 'nearest',
                intersect: true,
                animationDuration: 200
            }
        };

        setTimeout(() => {
            this.chartData.datasets[0].data = revenueData;
            this.chartData = { ...this.chartData };
        }, 500);
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
