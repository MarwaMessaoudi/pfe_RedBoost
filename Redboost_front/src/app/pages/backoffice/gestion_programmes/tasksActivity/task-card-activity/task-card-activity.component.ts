import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { Subscription } from 'rxjs';
import { PriorityActivity, TaskActivity, TaskCategoryActivity } from '../../../../../models/TaskActivity.modal';
import { TaskCategoryActivityService } from '../../../service/TaskCategorieActivityService';

@Component({
    selector: 'app-task-activity-card',
    standalone: true,
    imports: [CommonModule, MatIconModule, CdkDrag],
    templateUrl: './task-card-activity.component.html',
    styleUrls: ['./task-card-activity.component.scss']
})
export class TaskActivityCardComponent implements OnInit, OnDestroy, OnChanges {
    @Input() taskActivity!: TaskActivity;
    @Input() activityName: string = 'Unknown Activity';
    @Input() assigneeAvatarUrl: string | null = null;
    @Input() assigneeInitials: string | null = null;
    @Input() openEditTaskActivityDialog!: (taskActivity: TaskActivity) => void; // Function to open edit dialog
    TaskPriorityActivity = PriorityActivity; // Expose enum for template use
    availableCategories: TaskCategoryActivity[] = [];
    private categorySubscription?: Subscription;
    categoryName: string = 'Aucune catégorie';

    constructor(private taskCategoryActivityService: TaskCategoryActivityService) {}

    ngOnInit(): void {
        console.log('TaskActivity received:', this.taskActivity);
        this.loadAvailableCategories();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['taskActivity'] && this.taskActivity) {
            console.log('TaskActivity input changed:', this.taskActivity);
            this.updateCategoryName();
        }
    }

    ngOnDestroy(): void {
        this.categorySubscription?.unsubscribe();
    }

    loadAvailableCategories(): void {
        console.log('Loading activity categories...');
        this.categorySubscription = this.taskCategoryActivityService.getAllTaskCategoryActivities().subscribe({
            next: (categories) => {
                console.log('Activity Categories loaded:', categories);
                this.availableCategories = categories;
                this.updateCategoryName();
            },
            error: (err) => {
                console.error('Error fetching activity categories:', err);
                this.categoryName = 'Catégorie inconnue';
            }
        });
    }

    private updateCategoryName(): void {
        if (this.availableCategories.length > 0) {
            console.log('TaskActivity Category ID:', this.taskActivity.taskCategoryActivityId);
            this.categoryName = this.getCategoryName(this.taskActivity.taskCategoryActivityId);
            console.log('Updated categoryName:', this.categoryName);
        }
    }

    getCategoryName(categoryId: number | undefined): string {
        if (categoryId === undefined || categoryId === null) {
            return 'Aucune catégorie';
        }
        const category = this.availableCategories.find((cat) => cat.id === categoryId);
        return category ? category.name : 'Catégorie inconnue';
    }

    getPriorityClass(priority: PriorityActivity): string {
        return priority ? 'priority-' + priority.toLowerCase().replace('activity_', '') : '';
    }
}
