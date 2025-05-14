import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Added for *ngIf
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDropList } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { Subject, debounceTime } from 'rxjs';
import { PriorityActivity, StatusActivity, TaskActivity, TaskCategoryActivity } from '../../../../models/TaskActivity.modal';
import { Activity, ActivityStatus } from '../../../../models/activity.modal';
import { User } from '../../../../models/user';
import { TaskActivityService } from '../../service/taskActivity';
import { ActivityService } from '../../service/activity.service';
import { TaskCategoryActivityFormComponent } from '../tasksActivity/task-activity-categorie/task-activity-categorie.component';
import { TaskActivityComponent } from '../tasksActivity/task-activity/task-activity.component';
import { TaskActivityCardComponent } from '../tasksActivity/task-card-activity/task-card-activity.component';
import { TaskActivityUpdateComponent } from '../tasksActivity/task-activity-update/task-activity-update.component';
import { UserService } from '../../../frontoffice/service/UserService';
import { TaskCategoryActivityService } from '../../service/TaskCategorieActivityService';

@Component({
    selector: 'app-kanban-activity',
    standalone: true,
    imports: [
        CommonModule, // Added for *ngIf and other common directives
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
        TaskActivityCardComponent, // Added to imports
        TaskActivityUpdateComponent // Added to imports
        // TaskActivityComponent removed as it is not used
        // TaskCategoryActivityFormComponent // Added to imports
    ],
    templateUrl: './kanban-activity.component.html',
    styleUrls: ['./kanban-activity.component.scss']
})
export class KanbanActivityComponent implements OnInit {
    // Updated class name to match selector
    activityId: number | null = null;
    activityName: string = 'Unknown Activity';
    taskActivities: TaskActivity[] = [];
    filteredTaskActivities: TaskActivity[] = [];
    todo: TaskActivity[] = [];
    inprogress: TaskActivity[] = [];
    completed: TaskActivity[] = [];
    statusActivityFilter: StatusActivity | 'ALL' = 'ALL';
    priorityActivityFilter: PriorityActivity | 'ALL' = 'ALL';
    categoryActivityFilter: number | 'ALL' = 'ALL';
    searchTerm: string = '';
    selectedTaskActivity: TaskActivity | null = null;
    isPanelOpen: boolean = false;
    activity: Activity | null = null;
    users: User[] = [];
    taskCategoryActivities: TaskCategoryActivity[] = [];

    TaskStatusActivity = StatusActivity;
    TaskPriorityActivity = PriorityActivity;

    private searchTermSubject = new Subject<string>();

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private taskActivityService: TaskActivityService,
        private activityService: ActivityService,
        private taskCategoryActivityService: TaskCategoryActivityService,
        private userService: UserService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) {
        this.categoryActivityFilter = 'ALL';
    }

    ngOnInit(): void {
        this.route.paramMap.subscribe((params) => {
            this.activityId = params.get('activityId') ? +params.get('activityId')! : null;
            if (this.activityId) {
                this.loadTaskActivitiesForActivity(this.activityId);
                this.loadActivity(this.activityId);
                this.loadTaskCategoryActivities();
                this.loadUsers();
            } else {
                console.error('Activity ID is null!');
                this.snackBar.open("Erreur : L'ID d'activité est nul !", 'Fermer', { duration: 3000 });
            }
        });

        this.searchTermSubject.pipe(debounceTime(300)).subscribe(() => {
            this.applyFilters();
        });
    }

    loadActivity(activityId: number): void {
        this.activityService.getActivityById(activityId).subscribe({
            next: (activity) => {
                this.activity = activity;
                this.activityName = activity.name;
            },
            error: (err) => {
                console.error('Failed to load activity:', err);
                this.snackBar.open("Erreur : Échec du chargement de l'activité.", 'Fermer', { duration: 3000 });
            }
        });
    }

    loadUsers(): void {
        console.log('KanbanActivity: Loading users with roles ADMIN, SUPERADMIN, EMPLOYEE');
        this.userService.getUsers().subscribe({
            next: (users) => {
                this.users = users;
                console.log('KanbanActivity: Users loaded successfully:', this.users);
            },
            error: (err) => {
                console.error('KanbanActivity: Failed to load users:', err);
                this.snackBar.open('Erreur : Échec du chargement des utilisateurs.', 'Fermer', { duration: 3000 });
            }
        });
    }

    loadTaskActivitiesForActivity(activityId: number): void {
        this.taskActivityService.getTaskActivitiesByActivityId(activityId).subscribe({
            next: (taskActivities) => {
                this.taskActivities = taskActivities;
                this.applyFilters();
                this.updateActivityStatus();
            },
            error: (err) => {
                console.error("Échec du chargement des tâches d'activité :", err);
                this.snackBar.open("Erreur : Échec du chargement des tâches d'activité.", 'Fermer', { duration: 3000 });
            }
        });
    }

    loadTaskCategoryActivities(): void {
        this.taskCategoryActivityService.getAllTaskCategoryActivities().subscribe({
            next: (categoryActivities) => {
                this.taskCategoryActivities = categoryActivities;
            },
            error: (err) => {
                console.error('Failed to load task category activities:', err);
                this.snackBar.open("Erreur : Échec du chargement des catégories d'activité.", 'Fermer', { duration: 3000 });
            }
        });
    }

    sortTaskActivitiesIntoColumns(): void {
        this.todo = this.filteredTaskActivities.filter((taskActivity) => taskActivity.statusActivity === StatusActivity.TO_DO);
        this.inprogress = this.filteredTaskActivities.filter((taskActivity) => taskActivity.statusActivity === StatusActivity.IN_PROGRESS);
        this.completed = this.filteredTaskActivities.filter((taskActivity) => taskActivity.statusActivity === StatusActivity.DONE);
    }

    drop(event: CdkDragDrop<TaskActivity[]>) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);

            const taskActivity = event.container.data[event.currentIndex];
            if (taskActivity) {
                let newStatusActivity: StatusActivity;
                if (event.container.id === 'todo') {
                    newStatusActivity = StatusActivity.TO_DO;
                } else if (event.container.id === 'inprogress') {
                    newStatusActivity = StatusActivity.IN_PROGRESS;
                } else {
                    newStatusActivity = StatusActivity.DONE;
                }
                let taskCategoryActivity = taskActivity.taskCategoryActivity;
                if (!taskCategoryActivity && taskActivity.taskCategoryActivityId) {
                    taskCategoryActivity = this.taskCategoryActivities.find((cat) => cat.id === taskActivity.taskCategoryActivityId) as TaskCategoryActivity;
                }
                const updatedTaskActivity = { ...taskActivity, statusActivity: newStatusActivity, taskCategoryActivity: taskCategoryActivity };
                this.updateTaskActivityStatus(updatedTaskActivity);
            }
        }
    }

    updateTaskActivityStatus(taskActivity: TaskActivity) {
        const originalStatusActivity = taskActivity.statusActivity;
        this.taskActivityService.updateTaskActivity(taskActivity.taskActivityId!, taskActivity).subscribe({
            next: (updatedTaskActivity) => {
                console.log(`TaskActivity ${taskActivity.taskActivityId} status updated to ${taskActivity.statusActivity}`);
                const taskActivityIndex = this.taskActivities.findIndex((t) => t.taskActivityId === taskActivity.taskActivityId);
                if (taskActivityIndex !== -1) {
                    this.taskActivities[taskActivityIndex] = { ...taskActivity };
                }
                this.applyFilters();
                this.updateActivityStatus();
            },
            error: (err) => {
                console.error(`Échec de la mise à jour de la tâche d'activité ${taskActivity.taskActivityId} :`, err);
                this.snackBar.open("Erreur : Échec de la mise à jour de la tâche d'activité.", 'Fermer', { duration: 3000 });
                taskActivity.statusActivity = originalStatusActivity;
                this.applyFilters();
            }
        });
    }

    updateActivityStatus(): void {
        if (!this.activity || !this.activityId) return;

        let newActivityStatus: ActivityStatus;
        if (this.taskActivities.length > 0 && this.taskActivities.every((taskActivity) => taskActivity.statusActivity === StatusActivity.DONE)) {
            newActivityStatus = ActivityStatus.COMPLETED;
        } else if (this.taskActivities.some((taskActivity) => taskActivity.statusActivity === StatusActivity.IN_PROGRESS || taskActivity.statusActivity === StatusActivity.DONE)) {
            newActivityStatus = ActivityStatus.IN_PROGRESS;
        } else {
            newActivityStatus = ActivityStatus.NOT_STARTED;
        }

        if (this.activity.ActivityStatus !== newActivityStatus) {
            this.activity.ActivityStatus = newActivityStatus;
            this.activityService.updateActivity(this.activityId, { ...this.activity, ActivityStatus: newActivityStatus }).subscribe({
                next: () => {
                    console.log(`Activity ${this.activityId} status updated to ${newActivityStatus}`);
                    this.loadActivity(this.activityId!);
                },
                error: (err) => {
                    console.error(`Failed to update activity ${this.activityId}:`, err);
                    this.snackBar.open("Erreur : Échec de la mise à jour de l'activité.", 'Fermer', { duration: 3000 });
                    this.loadActivity(this.activityId!);
                }
            });
        }
    }

    openCreateTaskActivityDialog(): void {
        const dialogRef = this.dialog.open(TaskActivityComponent, {
            maxWidth: 'none',
            data: {
                activityId: this.activityId,
                taskActivity: null,
                isEdit: false,
                users: this.users,
                activity: this.activity
            }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadTaskActivitiesForActivity(this.activityId!);
            }
        });
    }

    openCreateTaskCategoryActivityDialog(): void {
        const dialogRef = this.dialog.open(TaskCategoryActivityFormComponent, {
            maxWidth: 'none',
            data: {}
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadTaskCategoryActivities();
            }
        });
    }

    openEditTaskActivityDialog(taskActivity: TaskActivity): void {
        const taskCategoryActivity = taskActivity.taskCategoryActivity ?? this.taskCategoryActivities.find((cat) => cat.id === taskActivity.taskCategoryActivityId);
        this.selectedTaskActivity = { ...taskActivity, taskCategoryActivity: taskCategoryActivity || taskActivity.taskCategoryActivity };
        this.isPanelOpen = true;
    }

    closePanel(): void {
        this.isPanelOpen = false;
        this.selectedTaskActivity = null;
        this.loadTaskActivitiesForActivity(this.activityId!);
    }

    applyFilters(): void {
        console.log('Current category filter:', this.categoryActivityFilter); // Debugging line
        let result = [...this.taskActivities];

        if (this.statusActivityFilter !== 'ALL') {
            result = result.filter((taskActivity) => taskActivity.statusActivity === this.statusActivityFilter);
        }

        if (this.priorityActivityFilter !== 'ALL') {
            result = result.filter((taskActivity) => taskActivity.priorityActivity === this.priorityActivityFilter);
        }
        if (this.categoryActivityFilter !== 'ALL') {
            const categoryId = Number(this.categoryActivityFilter);
            result = result.filter((taskActivity) => {
                const catId = taskActivity.taskCategoryActivity?.id ?? taskActivity.taskCategoryActivityId;
                return catId === categoryId;
            });
        }

        if (this.searchTerm.trim()) {
            const term = this.searchTerm.toLowerCase().trim();
            result = result.filter((taskActivity) => taskActivity.title.toLowerCase().includes(term) || (taskActivity.description && taskActivity.description.toLowerCase().includes(term)));
        }

        this.filteredTaskActivities = result;
        this.sortTaskActivitiesIntoColumns();
    }

    getStatusActivityClass(statusActivity: StatusActivity): string {
        switch (statusActivity) {
            case StatusActivity.TO_DO:
                return 'status-todo';
            case StatusActivity.IN_PROGRESS:
                return 'status-in-progress';
            case StatusActivity.DONE:
                return 'status-done';
            default:
                return '';
        }
    }

    getPriorityActivityClass(priorityActivity: PriorityActivity): string {
        return 'priority-' + priorityActivity.toLowerCase().replace('activity_', '');
    }

    resetFilters(): void {
        this.statusActivityFilter = 'ALL';
        this.priorityActivityFilter = 'ALL';
        this.categoryActivityFilter = 'ALL';
        this.searchTerm = '';
        this.applyFilters();
    }

    onSearchTermChange(term: string): void {
        this.searchTermSubject.next(term);
    }

    calculateTotalXp(taskActivities: TaskActivity[]): number {
        return taskActivities.reduce((sum, taskActivity) => sum + taskActivity.xpPoint, 0);
    }

    getAssigneeAvatarUrl(assigneeId: number | null | undefined): string | null {
        if (!assigneeId) return null;
        const user = this.users.find((u) => u.id === assigneeId);
        return user ? user.profilePictureUrl : null;
    }

    getAssigneeInitials(assigneeId: number | null | undefined): string | null {
        if (!assigneeId) return null;
        const user = this.users.find((u) => u.id === assigneeId);
        if (!user) return null;
        return `${user.firstName.charAt(0).toUpperCase()}.${user.lastName.charAt(0).toUpperCase()}`;
    }
}
