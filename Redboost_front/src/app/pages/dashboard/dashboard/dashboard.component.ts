import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ProjetService } from '../../frontoffice/service/projet-service.service';
import { AuthService } from '../../frontoffice/service/auth.service';
import { TaskService } from '../../frontoffice/service/task.service';
import { PhaseService } from '../../frontoffice/service/phase.service';
import { DashboardStatistics } from '../../../models/statistics';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import { Task, Status } from '../../../models/task';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

Chart.register(...registerables);

interface PendingTaskAction {
    type: 'task';
    projectName: string;
    phaseName: string;
    taskTitle: string;
    taskId: number;
    details: string;
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, NgChartsModule, MatIconModule, MatTooltipModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
    statistics: DashboardStatistics | null = null;
    userId: number | null = null;
    errorMessage: string | null = null;
    pendingTaskActions: PendingTaskAction[] = [];

    // Bar Chart Configuration
    public barChartOptions: ChartOptions<'bar'> = {
        responsive: true,
        scales: {
            x: {
                grid: { display: false },
                ticks: { display: false }
            },
            y: {
                beginAtZero: true,
                max: 100,
                title: { display: true, text: 'Pourcentage', color: '#0A4955', font: { size: 12 } },
                grid: {
                    color: '#e2e8f0',
                    drawTicks: false,
                    borderDash: [3, 3]
                } as any,
                ticks: { stepSize: 20, color: '#0A4955', font: { size: 10 } }
            }
        },
        plugins: {
            legend: {
                display: true,
                position: 'top',
                align: 'start',
                labels: {
                    font: { size: 12, weight: 'bold' },
                    color: '#0A4955',
                    boxWidth: 10,
                    usePointStyle: true,
                    padding: 12
                }
            },
            tooltip: {
                backgroundColor: '#0A4955',
                cornerRadius: 6,
                bodyFont: { size: 12 },
                titleFont: { size: 14, weight: 'bold' }
            }
        },
        elements: {
            bar: {
                borderWidth: 1,
                borderRadius: 4
            }
        },
        animation: false
    };
    public barChartType: 'bar' = 'bar';
    public barChartData: ChartData<'bar'> = { labels: [], datasets: [] };

    // Pie Chart Configuration
    public pieChartOptions: ChartOptions<'pie'> = {
        responsive: true,
        cutout: '15%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    font: { size: 12, weight: 'bold' },
                    color: '#0A4955',
                    padding: 16,
                    boxWidth: 12,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    generateLabels: (chart) => {
                        const data = chart.data;
                        if (data.labels && data.datasets.length) {
                            return data.labels.map((label, i) => {
                                const meta = chart.getDatasetMeta(0);
                                const style = meta.controller.getStyle(i, false);
                                return {
                                    text: `${label}`,
                                    fillStyle: style['backgroundColor'],
                                    strokeStyle: style['borderColor'],
                                    lineWidth: style['borderWidth'],
                                    pointStyle: 'circle',
                                    hidden: !chart.getDataVisibility(i),
                                    index: i
                                };
                            });
                        }
                        return [];
                    }
                }
            },
            tooltip: {
                backgroundColor: '#0A4955',
                cornerRadius: 6,
                bodyFont: { size: 12 },
                titleFont: { size: 14, weight: 'bold' }
            }
        },
        elements: {
            arc: {
                borderWidth: 3,
                borderColor: '#ffffff',
                hoverBorderWidth: 4,
                hoverOffset: 8
            }
        },
        animation: false
    };
    public pieChartType: 'pie' = 'pie';
    public pieChartData: ChartData<'pie'> = { labels: [], datasets: [] };

    constructor(
        private statisticsService: ProjetService,
        private authService: AuthService,
        private taskService: TaskService,
        private phaseService: PhaseService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.loadCurrentUser();
    }

    loadCurrentUser(): void {
        this.authService.getCurrentUser().subscribe({
            next: (user) => {
                if (user && user.id) {
                    this.userId = user.id;
                    this.loadStatistics();
                    this.loadPendingTasks();
                } else {
                    this.errorMessage = 'No authenticated user found. Please log in.';
                }
            },
            error: (err) => {
                console.error('Error fetching current user:', err);
                this.errorMessage = 'Failed to load user data. Please try again.';
            }
        });
    }

    loadStatistics(): void {
        if (!this.userId) {
            this.errorMessage = 'User ID not available.';
            return;
        }

        this.statisticsService.getCoachDashboardStatistics(this.userId).subscribe({
            next: (data) => {
                this.statistics = data;
                this.setupCharts();
            },
            error: (err) => {
                console.error('Error fetching statistics:', err);
                this.errorMessage = 'Failed to load dashboard data.';
            }
        });
    }

    loadPendingTasks(): void {
        if (!this.userId) return;

        this.taskService.getAllTasks().subscribe({
            next: (tasks) => {
                console.log('Fetched tasks:', tasks);
                // Reintroduce the DONE filter
                const pendingTasks = tasks.filter((task) => task.status === Status.DONE);
                console.log('Pending tasks after filtering (DONE status):', pendingTasks);

                if (pendingTasks.length === 0) {
                    console.log('No tasks with DONE status found.');
                    return;
                }

                const taskActions: PendingTaskAction[] = [];
                pendingTasks.forEach((task) => {
                    console.log('Processing task:', task);
                    // Check if task.phase and task.phase.phaseId exist
                    if (task.phase && task.phase.phaseId) {
                        console.log(`Fetching phase with ID ${task.phase.phaseId} for task ${task.taskId}`);
                        this.phaseService.getPhaseById(task.phase.phaseId).subscribe({
                            next: (phase) => {
                                const phaseName = phase?.phaseName || 'Unknown Phase';
                                console.log(`Phase fetched:`, phase);
                                // Check if phase.projetId exists
                                if (phase?.projetId) {
                                    console.log(`Fetching project with ID ${phase.projetId} for phase ${phase.phaseId}`);
                                    this.statisticsService.getProjetById(phase.projetId).subscribe({
                                        next: (project) => {
                                            console.log(`Project fetched:`, project);
                                            taskActions.push({
                                                type: 'task',
                                                projectName: project?.name || 'Unknown Project',
                                                phaseName: phaseName,
                                                taskTitle: task.title || 'Untitled Task',
                                                taskId: task.taskId || 0,
                                                details: `En attente de validation (Status: ${task.status})`
                                            });
                                            this.pendingTaskActions = [...taskActions];
                                            console.log('Updated pendingTaskActions:', this.pendingTaskActions);
                                        },
                                        error: (err) => {
                                            console.error(`Error fetching project for phase ${phase.projetId}:`, err);
                                            taskActions.push({
                                                type: 'task',
                                                projectName: 'Unknown Project',
                                                phaseName: phaseName,
                                                taskTitle: task.title || 'Untitled Task',
                                                taskId: task.taskId || 0,
                                                details: `En attente de validation (Status: ${task.status})`
                                            });
                                            this.pendingTaskActions = [...taskActions];
                                        }
                                    });
                                } else {
                                    console.log(`No projetId found for phase ${phase.phaseId}`);
                                    taskActions.push({
                                        type: 'task',
                                        projectName: 'Unknown Project',
                                        phaseName: phaseName,
                                        taskTitle: task.title || 'Untitled Task',
                                        taskId: task.taskId || 0,
                                        details: `En attente de validation (Status: ${task.status})`
                                    });
                                    this.pendingTaskActions = [...taskActions];
                                }
                            },
                            error: (err) => {
                                console.error(`Error fetching phase ${task.phase.phaseId}:`, err);
                                taskActions.push({
                                    type: 'task',
                                    projectName: 'Unknown Project',
                                    phaseName: 'Unknown Phase',
                                    taskTitle: task.title || 'Untitled Task',
                                    taskId: task.taskId || 0,
                                    details: `En attente de validation (Status: ${task.status})`
                                });
                                this.pendingTaskActions = [...taskActions];
                            }
                        });
                    } else {
                        console.log(`Task ${task.taskId} has no phase or phaseId:`, task.phase);
                        taskActions.push({
                            type: 'task',
                            projectName: 'Unknown Project',
                            phaseName: 'Unknown Phase',
                            taskTitle: task.title || 'Untitled Task',
                            taskId: task.taskId || 0,
                            details: `En attente de validation (Status: ${task.status})`
                        });
                        this.pendingTaskActions = [...taskActions];
                    }
                });
            },
            error: (err) => {
                console.error('Error fetching tasks:', err);
                this.errorMessage = 'Failed to load pending tasks.';
            }
        });
    }

    setupCharts(): void {
        if (!this.statistics) return;

        this.barChartData = {
            labels: this.statistics.phases.map((phase) => `${phase.projectName} - ${phase.phaseName}`),
            datasets: [
                {
                    data: this.statistics.phases.map((phase) => phase.completionPercentage),
                    label: 'Completion %',
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: '#4BC0C0',
                    borderWidth: 1,
                    barThickness: 12,
                    borderRadius: 4,
                    hoverBackgroundColor: '#4BC0C0',
                    hoverBorderColor: '#3a9a9a'
                }
            ]
        };

        this.pieChartData = {
            labels: ['Projets Actifs', 'Prêt pour Révision', 'Projets Terminés'],
            datasets: [
                {
                    data: [this.statistics.projects.activeProjects, this.statistics.projects.reviewReadyProjects, this.statistics.projects.totalProjects - this.statistics.projects.activeProjects],
                    backgroundColor: ['#0A4955', '#DB1E37', '#4BC0C0'],
                    borderColor: ['#0A4955', '#DB1E37', '#4BC0C0'],
                    borderWidth: 3,
                    hoverBackgroundColor: ['#083c44', '#b5182d', '#3a9a9a'],
                    hoverBorderColor: ['#083c44', '#b5182d', '#3a9a9a']
                }
            ]
        };
    }

    validateTask(taskId: number): void {
        this.taskService.validateTask(taskId).subscribe({
            next: (updatedTask) => {
                this.snackBar.open('Tâche validée avec succès', 'Fermer', { duration: 3000 });
                this.loadPendingTasks(); // Refresh the list
            },
            error: (err) => {
                console.error('Failed to validate task:', err);
                this.snackBar.open('Erreur lors de la validation de la tâche', 'Fermer', { duration: 3000 });
            }
        });
    }

    rejectTask(taskId: number): void {
        this.taskService.rejectTask(taskId).subscribe({
            next: (updatedTask) => {
                this.snackBar.open('Tâche rejetée et renvoyée à À faire', 'Fermer', { duration: 3000 });
                this.loadPendingTasks(); // Refresh the list
            },
            error: (err) => {
                console.error('Failed to reject task:', err);
                this.snackBar.open('Erreur lors du rejet de la tâche', 'Fermer', { duration: 3000 });
            }
        });
    }
}
