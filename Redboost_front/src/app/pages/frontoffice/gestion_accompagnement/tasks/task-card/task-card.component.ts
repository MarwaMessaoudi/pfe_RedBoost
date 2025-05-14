import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Task, Priority, TaskCategory, Status } from '../../../../../models/task';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { TaskCategoryService } from '../../../service/taskCategory.service';
import { TaskService } from '../../../service/task.service';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../service/auth.service'; // Assuming AuthService exists

@Component({
    selector: 'app-task-card',
    standalone: true,
    imports: [CommonModule, MatIconModule, CdkDrag],
    templateUrl: './task-card.component.html',
    styleUrls: ['./task-card.component.scss']
})
export class TaskCardComponent implements OnInit, OnDestroy {
    @Input() task!: Task;
    @Input() phaseName: string = 'Unknown Phase';
    @Input() openEditTaskDialog!: (task: Task) => void;
    @Input() assigneeAvatarUrl: string | null = null;
    @Input() assigneeInitials: string | null = null;
    TaskPriority = Priority;
    TaskStatus = Status;
    availableCategories: TaskCategory[] = [];
    private categorySubscription?: Subscription;
    categoryName: string = 'Aucune catégorie';
    isCoach: boolean = false;

    constructor(
        private taskCategoryService: TaskCategoryService,
        private taskService: TaskService,
        private snackBar: MatSnackBar,
        private authService: AuthService // Inject AuthService
    ) {}

    ngOnInit(): void {
        this.loadAvailableCategories();
        this.checkUserRole();
        console.log(`Task ${this.task.taskId} Phase:`, this.task.phase);
        console.log('Avatar URL:', this.assigneeAvatarUrl);
        console.log('Initials:', this.assigneeInitials);
    }

    ngOnDestroy(): void {
        this.categorySubscription?.unsubscribe();
    }

    loadAvailableCategories(): void {
        this.categorySubscription = this.taskCategoryService.getAllTaskCategories().subscribe({
            next: (categories) => {
                this.availableCategories = categories;
                this.categoryName = this.getCategoryName(this.task.taskCategoryId);
            },
            error: (err) => {
                console.error('Error fetching categories in TaskCard:', err);
                this.categoryName = 'Catégorie inconnue';
            }
        });
    }

    checkUserRole(): void {
        // Assuming AuthService has a method to get the current user's role
        this.authService.getCurrentUser().subscribe({
            next: (user) => {
                this.isCoach = user?.role === 'COACH';
            },
            error: (err) => {
                console.error('Error fetching user role:', err);
                this.isCoach = false;
            }
        });
    }

    getCategoryName(categoryId: number | undefined): string {
        if (categoryId === undefined || categoryId === null) {
            return 'Aucune catégorie';
        }
        const category = this.availableCategories.find((cat) => cat.id === categoryId);
        return category ? category.name : 'Catégorie inconnue';
    }

    getPriorityClass(priority: Priority): string {
        return priority ? 'priority-' + priority.toLowerCase() : '';
    }

    validateTask(): void {
        if (this.task.taskId) {
            this.taskService.validateTask(this.task.taskId).subscribe({
                next: (updatedTask) => {
                    this.task = updatedTask;
                    this.snackBar.open('Tâche validée avec succès', 'Fermer', { duration: 3000 });
                },
                error: (err) => {
                    console.error('Failed to validate task:', err);
                    this.snackBar.open('Erreur lors de la validation de la tâche', 'Fermer', { duration: 3000 });
                }
            });
        }
    }

    rejectTask(): void {
        if (this.task.taskId) {
            this.taskService.rejectTask(this.task.taskId).subscribe({
                next: (updatedTask) => {
                    this.task = updatedTask;
                    this.snackBar.open('Tâche rejetée et renvoyée à À faire', 'Fermer', { duration: 3000 });
                },
                error: (err) => {
                    console.error('Failed to reject task:', err);
                    this.snackBar.open('Erreur lors du rejet de la tâche', 'Fermer', { duration: 3000 });
                }
            });
        }
    }

    isDraggable(): boolean {
        return this.task.status !== Status.VALIDATED;
    }
}
