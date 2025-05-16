import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TaskService } from '../../frontoffice/service/task.service';
import { Task,Status } from '../../../models/task';
import { Subscription } from 'rxjs';
import { AuthService } from '../../frontoffice/service/auth.service';

@Component({
    selector: 'app-coach-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule
    ],
    templateUrl: './coach-dashboard.html',
    styleUrls: ['./coach-dashboard.component.css']
})
export class CoachDashboardComponent implements OnInit, OnDestroy {
    displayedColumns: string[] = ['projectName', 'phaseName', 'taskTitle', 'description', 'actions'];
    tasks: Task[] = [];
    private subscription?: Subscription;
    isCoach: boolean = false;

    constructor(
        private taskService: TaskService,
        private snackBar: MatSnackBar,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        this.checkUserRole();
        this.loadTasks();
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

    checkUserRole(): void {
        this.authService.getCurrentUser().subscribe({
            next: (user) => {
                this.isCoach = user?.role === 'COACH';
                if (!this.isCoach) {
                    this.snackBar.open('Accès réservé aux coachs', 'Fermer', { duration: 3000 });
                }
            },
            error: (err) => {
                console.error('Erreur lors de la vérification du rôle:', err);
                this.snackBar.open('Erreur lors de la vérification du rôle', 'Fermer', { duration: 3000 });
            }
        });
    }

    loadTasks(): void {
        this.subscription = this.taskService.getAllTasks().subscribe({
            next: (tasks) => {
                // Filter tasks with DONE status
                this.tasks = tasks.filter(task => task.status === Status.DONE);
            },
            error: (err) => {
                console.error('Erreur lors du chargement des tâches:', err);
                this.snackBar.open('Erreur lors du chargement des tâches', 'Fermer', { duration: 3000 });
            }
        });
    }

    validateTask(taskId: number | undefined): void {
        if (!taskId) return;
        this.taskService.validateTask(taskId).subscribe({
            next: (updatedTask) => {
                this.tasks = this.tasks.filter(task => task.taskId !== taskId);
                this.snackBar.open('Tâche validée avec succès', 'Fermer', { duration: 3000 });
            },
            error: (err) => {
                console.error('Erreur lors de la validation:', err);
                this.snackBar.open('Erreur lors de la validation de la tâche', 'Fermer', { duration: 3000 });
            }
        });
    }

    rejectTask(taskId: number | undefined): void {
        if (!taskId) return;
        this.taskService.rejectTask(taskId).subscribe({
            next: (updatedTask) => {
                this.tasks = this.tasks.filter(task => task.taskId !== taskId);
                this.snackBar.open('Tâche rejetée avec succès', 'Fermer', { duration: 3000 });
            },
            error: (err) => {
                console.error('Erreur lors du rejet:', err);
                this.snackBar.open('Erreur lors du rejet de la tâche', 'Fermer', { duration: 3000 });
            }
        });
    }
}