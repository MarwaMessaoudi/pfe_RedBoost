// src/app/components/kanban-board/kanban-board.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TaskService } from '../../service/task.service';
import { PhaseService } from '../../service/phase.service';
import { WebSocketService } from '../../service/WebSocketService';
import { Task, Status, Priority, TaskCategory } from '../../../../models/task';
import { Phase, PhaseStatus } from '../../../../models/phase';
import { User } from '../../../../models/user';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDropList } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { TaskFormComponent } from '../tasks/task-form/task-form.component';
import { TaskUpdateComponent } from '../tasks/task-update/task-update.component';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { TaskCardComponent } from '../tasks/task-card/task-card.component';
import { TaskCategoryService } from '../../service/taskCategory.service';
import { TaskCategoryFormComponent } from '../tasks/task-category-form/task-category-form.component';

@Component({
    selector: 'app-kanban-board',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        CdkDropList,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatMenuModule,
        MatTooltipModule,
        FormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        TaskCardComponent,
        TaskUpdateComponent
    ],
    templateUrl: './kanban-board.component.html',
    styleUrls: ['./kanban-board.component.scss']
})
export class KanbanBoardComponent implements OnInit, OnDestroy {
    phaseId: number | null = null;
    phaseName: string = 'Unknown Phase';
    tasks: Task[] = [];
    filteredTasks: Task[] = [];
    todo: Task[] = [];
    inprogress: Task[] = [];
    completed: Task[] = [];
    validated: Task[] = [];
    statusFilter: Status | 'ALL' = 'ALL';
    priorityFilter: Priority | 'ALL' = 'ALL';
    categoryFilter: number | 'ALL' = 'ALL';
    searchTerm: string = '';
    selectedTask: Task | null = null;
    isPanelOpen: boolean = false;
    phase: Phase | null = null;
    entrepreneurs: User[] = [];
    taskCategories: TaskCategory[] = [];
    private subscriptions: Subscription = new Subscription();
    private searchTermSubject = new Subject<string>();

    TaskStatus = Status;
    TaskPriority = Priority;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private taskService: TaskService,
        private phaseService: PhaseService,
        private taskCategoryService: TaskCategoryService,
        private webSocketService: WebSocketService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) {
        this.categoryFilter = 'ALL';
    }

    ngOnInit(): void {
        this.subscriptions.add(
            this.route.paramMap.subscribe((params) => {
                this.phaseId = params.get('phaseId') ? +params.get('phaseId')! : null;
                if (this.phaseId) {
                    this.loadPhase(this.phaseId);
                    this.loadTasksForPhase(this.phaseId);
                    this.loadTaskCategories();
                } else {
                    console.error('Phase ID is null!');
                    this.snackBar.open("Erreur : L'ID de phase est nul !", 'Fermer', { duration: 3000 });
                }
            })
        );

        this.searchTermSubject.pipe(debounceTime(300)).subscribe(() => {
            this.applyFilters();
        });
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    loadPhase(phaseId: number): void {
        this.phaseService.getPhaseById(phaseId).subscribe({
            next: (phase) => {
                this.phase = phase;
                this.phaseName = phase.phaseName;
                if (phase.projetId) {
                    this.loadEntrepreneurs(phase.projetId);
                    // Initialize WebSocket with projectId
                    this.webSocketService.initialize(phase.projetId);
                    this.setupWebSocketSubscriptions();
                } else {
                    console.warn('No projetId found in phase:', phase);
                    this.snackBar.open('Aucun projet associé à cette phase', 'Fermer', { duration: 3000 });
                }
            },
            error: (err) => {
                console.error('Failed to load phase:', err);
                this.snackBar.open('Erreur : Échec du chargement de la phase.', 'Fermer', { duration: 3000 });
            }
        });
    }

    loadEntrepreneurs(projetId: number): void {
        this.phaseService.getEntrepreneursByProject(projetId).subscribe({
            next: (entrepreneurs) => {
                this.entrepreneurs = entrepreneurs;
                console.log('KanbanBoard: Entrepreneurs loaded successfully:', this.entrepreneurs);
            },
            error: (err) => {
                console.error('KanbanBoard: Failed to load entrepreneurs:', err);
                this.snackBar.open('Erreur : Échec du chargement des entrepreneurs.', 'Fermer', { duration: 3000 });
            }
        });
    }

    loadTasksForPhase(phaseId: number): void {
        this.taskService.getTasksByPhaseId(phaseId).subscribe({
            next: (tasks) => {
                console.log('Tasks loaded:', tasks);
                this.tasks = tasks;
                this.applyFilters();
                this.updatePhaseStatus();
            },
            error: (err) => {
                console.error('Échec du chargement des tâches :', err);
                this.snackBar.open('Erreur : Échec du chargement des tâches.', 'Fermer', { duration: 3000 });
            }
        });
    }

    loadTaskCategories(): void {
        this.taskCategoryService.getAllTaskCategories().subscribe({
            next: (categories) => {
                this.taskCategories = categories;
                console.log('Task categories loaded:', categories);
            },
            error: (err) => {
                console.error('Failed to load task categories:', err);
                this.snackBar.open('Erreur : Échec du chargement des catégories.', 'Fermer', { duration: 3000 });
            }
        });
    }

    private setupWebSocketSubscriptions(): void {
        // Task updates
        this.subscriptions.add(
            this.webSocketService.taskUpdates$.subscribe(update => {
                if (update && this.phaseId) {
                    if ('action' in update && update.action === 'delete') {
                        // Task deletion
                        this.tasks = this.tasks.filter(task => task.taskId !== update.taskId);
                        this.snackBar.open(`Tâche ${update.taskId} supprimée`, 'Fermer', { duration: 3000 });
                    } else {
                        // Task creation or update
                        const task = update as Task;
                        if (task.phase?.phaseId === this.phaseId) {
                            const index = this.tasks.findIndex(t => t.taskId === task.taskId);
                            if (index >= 0) {
                                // Update existing task
                                this.tasks[index] = { ...task, taskCategory: this.taskCategories.find(cat => cat.id === task.taskCategoryId) || task.taskCategory };
                                this.snackBar.open(`Tâche "${task.title}" mise à jour`, 'Fermer', { duration: 3000 });
                            } else {
                                // Add new task
                                this.tasks.push({ ...task, taskCategory: this.taskCategories.find(cat => cat.id === task.taskCategoryId) || task.taskCategory });
                                this.snackBar.open(`Nouvelle tâche "${task.title}" ajoutée`, 'Fermer', { duration: 3000 });
                            }
                        }
                    }
                    this.applyFilters();
                    this.updatePhaseStatus();
                }
            })
        );

        // Phase updates
        this.subscriptions.add(
            this.webSocketService.phaseUpdates$.subscribe(update => {
                if (update && this.phaseId && 'phaseId' in update && update.phaseId === this.phaseId) {
                    if ('action' in update && update.action === 'delete') {
                        // Phase deleted, navigate back
                        this.snackBar.open('Phase supprimée', 'Fermer', { duration: 3000 });
                        this.goBackToPhases();
                    } else {
                        // Phase updated
                        this.phase = update as Phase;
                        this.phaseName = this.phase.phaseName;
                        this.snackBar.open(`Phase "${this.phaseName}" mise à jour`, 'Fermer', { duration: 3000 });
                        // Optionally reload tasks if phase dates changed
                        if (this.phase.startDate || this.phase.endDate) {
                            this.loadTasksForPhase(this.phaseId!);
                        }
                    }
                }
            })
        );
    }

    sortTasksIntoColumns(): void {
        this.todo = this.filteredTasks.filter((task) => task.status === Status.TO_DO);
        this.inprogress = this.filteredTasks.filter((task) => task.status === Status.IN_PROGRESS);
        this.completed = this.filteredTasks.filter((task) => task.status === Status.DONE);
        this.validated = this.filteredTasks.filter((task) => task.status === Status.VALIDATED);
    }

    drop(event: CdkDragDrop<Task[]>) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            if (event.previousContainer.id === 'validated' || event.container.id === 'validated') {
                return;
            }

            transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);

            const task = event.container.data[event.currentIndex];
            if (task) {
                let newStatus: Status;
                if (event.container.id === 'todo') {
                    newStatus = Status.TO_DO;
                } else if (event.container.id === 'inprogress') {
                    newStatus = Status.IN_PROGRESS;
                } else {
                    newStatus = Status.DONE;
                }
                let taskCategory = task.taskCategory;
                if (!taskCategory && task.taskCategoryId) {
                    taskCategory = this.taskCategories.find((cat) => cat.id === task.taskCategoryId) as TaskCategory;
                }
                const updatedTask = { ...task, status: newStatus, taskCategory: taskCategory };
                this.updateTaskStatus(updatedTask);
            }
        }
    }

    updateTaskStatus(task: Task) {
        const originalStatus = task.status;
        this.taskService.updateTask(task.taskId!, task).subscribe({
            next: (updatedTask) => {
                console.log(`Task ${task.taskId} status updated to ${task.status}`);
                // WebSocket will handle updating the task in tasks array
                this.applyFilters();
                this.updatePhaseStatus();
            },
            error: (err) => {
                console.error(`Échec de la mise à jour de la tâche ${task.taskId} :`, err);
                this.snackBar.open('Erreur : Échec de la mise à jour de la tâche.', 'Fermer', { duration: 3000 });
                task.status = originalStatus;
                this.applyFilters();
            }
        });
    }

    updatePhaseStatus(): void {
        if (!this.phase || !this.phaseId) return;

        let newPhaseStatus: PhaseStatus;
        if (this.tasks.length > 0 && this.tasks.every((task) => task.status === Status.VALIDATED)) {
            newPhaseStatus = PhaseStatus.COMPLETED;
        } else if (this.tasks.some((task) => task.status === Status.IN_PROGRESS || task.status === Status.DONE || task.status === Status.VALIDATED)) {
            newPhaseStatus = PhaseStatus.IN_PROGRESS;
        } else {
            newPhaseStatus = PhaseStatus.NOT_STARTED;
        }

        if (this.phase.status !== newPhaseStatus) {
            this.phase.status = newPhaseStatus;
            this.phaseService.updatePhase(this.phaseId, { ...this.phase, status: newPhaseStatus }).subscribe({
                next: () => {
                    console.log(`Phase ${this.phaseId} status updated to ${newPhaseStatus}`);
                },
                error: (err) => {
                    console.error(`Failed to update phase ${this.phaseId}:`, err);
                    this.snackBar.open('Erreur : Échec de la mise à jour de la phase.', 'Fermer', { duration: 3000 });
                    this.loadPhase(this.phaseId!);
                }
            });
        }
    }

    openCreateTaskDialog(): void {
        const dialogRef = this.dialog.open(TaskFormComponent, {
            maxWidth: 'none',
            data: {
                phaseId: this.phaseId,
                entrepreneurs: this.entrepreneurs,
                phase: this.phase
            }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                // WebSocket will handle adding the new task
                this.snackBar.open('Tâche en cours de création...', 'Fermer', { duration: 3000 });
            }
        });
    }

    openCreateTaskCategoryDialog(): void {
        const dialogRef = this.dialog.open(TaskCategoryFormComponent, {
            maxWidth: 'none',
            data: {}
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadTaskCategories();
            }
        });
    }

    openEditTaskDialog(task: Task): void {
        const taskCategory = task.taskCategory ?? this.taskCategories.find((cat) => cat.id === task.taskCategoryId);
        this.selectedTask = { ...task, taskCategory: taskCategory || task.taskCategory };
        this.isPanelOpen = true;
    }

    closePanel(): void {
        this.isPanelOpen = false;
        this.selectedTask = null;
        // WebSocket will handle updates, no need to reload
    }

    applyFilters(): void {
        let result = [...this.tasks];

        if (this.statusFilter !== 'ALL') {
            result = result.filter((task) => task.status === this.statusFilter);
        }

        if (this.priorityFilter !== 'ALL') {
            result = result.filter((task) => task.priority === this.priorityFilter);
        }

        if (this.categoryFilter !== 'ALL') {
            const categoryId = Number(this.categoryFilter);
            result = result.filter((task) => task.taskCategory?.id === categoryId || task.taskCategoryId === categoryId);
        }

        if (this.searchTerm.trim()) {
            const term = this.searchTerm.toLowerCase().trim();
            result = result.filter((task) => task.title.toLowerCase().includes(term) || (task.description && task.description.toLowerCase().includes(term)));
        }

        this.filteredTasks = result;
        this.sortTasksIntoColumns();
    }

    getStatusClass(status: Status): string {
        switch (status) {
            case Status.TO_DO:
                return 'status-todo';
            case Status.IN_PROGRESS:
                return 'status-in-progress';
            case Status.DONE:
                return 'status-done';
            case Status.VALIDATED:
                return 'status-validated';
            default:
                return '';
        }
    }

    getPriorityClass(priority: Priority): string {
        return 'priority-' + priority.toLowerCase();
    }

    resetFilters(): void {
        this.statusFilter = 'ALL';
        this.priorityFilter = 'ALL';
        this.categoryFilter = 'ALL';
        this.searchTerm = '';
        this.applyFilters();
    }

    onSearchTermChange(term: string): void {
        this.searchTermSubject.next(term);
    }

    calculateTotalXp(tasks: Task[]): number {
        return tasks.reduce((sum, task) => sum + (task.xpPoint || 0), 0);
    }

    getAssigneeAvatarUrl(assigneeId: number | null | undefined): string | null {
        if (!assigneeId) return null;
        const assignee = this.entrepreneurs.find((e) => e.id === assigneeId);
        return assignee ? assignee.profilePictureUrl : null;
    }

    getAssigneeInitials(assigneeId: number | null | undefined): string | null {
        if (!assigneeId) return null;
        const assignee = this.entrepreneurs.find((e) => e.id === assigneeId);
        if (!assignee) return null;
        return `${assignee.firstName.charAt(0).toUpperCase()}.${assignee.lastName.charAt(0).toUpperCase()}`;
    }

    goBackToPhases(): void {
        if (this.phase && this.phase.projetId) {
            this.router.navigate(['/phases'], { queryParams: { projectId: this.phase.projetId } });
        } else {
            console.warn('Cannot navigate back: projetId not found in phase.');
            this.router.navigate(['/phases']);
        }
    }
}