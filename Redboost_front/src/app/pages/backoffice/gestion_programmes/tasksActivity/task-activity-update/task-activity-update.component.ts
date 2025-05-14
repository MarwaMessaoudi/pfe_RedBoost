import { Component, OnInit, ViewEncapsulation, ElementRef, ViewChild, Input, Output, EventEmitter, Renderer2, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HttpClient } from '@angular/common/http';
import { AttachmentActivity, CommentActivity, PriorityActivity, StatusActivity, SubTaskActivity, TaskActivity, TaskCategoryActivity } from '../../../../../models/TaskActivity.modal';
import { TaskActivityService } from '../../../service/taskActivity';
import { UserService } from '../../../../frontoffice/service/UserService';
import { ActivityStatus } from '../../../../../models/activity.modal';
import { TaskCategoryActivityService } from '../../../service/TaskCategorieActivityService';

interface Assignee {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role: string;
}

@Component({
    selector: 'app-task-activity-update',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ReactiveFormsModule, MatIconModule, MatSnackBarModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule],
    templateUrl: './task-activity-update.component.html',
    styleUrls: ['./task-activity-update.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TaskActivityUpdateComponent implements OnInit {
    taskActivityForm!: FormGroup;
    @Input() taskActivity: TaskActivity | null = null;
    @Input() isOpen: boolean = false;
    @Output() closeEvent = new EventEmitter<boolean>();
    @Output() taskActivityUpdated = new EventEmitter<TaskActivity>();

    taskActivityId: number | null = null;
    isEditMode = true;
    loading = false;
    submitting = false;
    error = '';
    priorityOptions = Object.values(PriorityActivity);
    statusOptions = Object.values(StatusActivity);

    @ViewChild('fileInput') fileInput!: ElementRef;

    editingTitle: boolean = false;
    editingDescription: boolean = false;
    editingCategory: boolean = false;
    editingXpPoint: boolean = false;
    showStatusDropdown: boolean = false;
    showPriorityDropdown: boolean = false;
    showAssigneeDropdown: boolean = false;

    availableAssignees: Assignee[] = [];
    availableCategories: TaskCategoryActivity[] = [];
    comments: CommentActivity[] = [];
    selectedCategoryId: number | undefined;

    subTasks: SubTaskActivity[] = [];
    editingSubTaskIndex: number | null = null;
    newSubTask: SubTaskActivity = { title: '', description: '' };

    minStartDate: string = new Date().toISOString().split('T')[0];
    minEndDate: string = '';

    currentUser: any = null;

    constructor(
        private fb: FormBuilder,
        private taskActivityService: TaskActivityService,
        private taskCategoryActivityService: TaskCategoryActivityService,
        private userService: UserService,
        private snackBar: MatSnackBar,
        private renderer: Renderer2,
        private cdr: ChangeDetectorRef,
        private http: HttpClient
    ) {}

    ngOnInit(): void {
        this.initForm();
        this.updateMinEndDate();
        this.fetchCurrentUser();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['taskActivity']) {
            // Ensure the form is initialized
            if (!this.taskActivityForm) {
                this.initForm();
            }

            const newTaskActivity: TaskActivity | null = changes['taskActivity'].currentValue;

            if (newTaskActivity && newTaskActivity.taskActivityId) {
                this.taskActivity = newTaskActivity;
                this.loadTaskActivity(newTaskActivity.taskActivityId);
            } else {
                this.taskActivity = {
                    taskActivityId: undefined,
                    title: 'New Task Activity',
                    xpPoint: 0,
                    priorityActivity: PriorityActivity.ACTIVITY_MEDIUM,
                    statusActivity: StatusActivity.TO_DO,
                    activity: newTaskActivity?.activity || {
                        id: 1, // Ideally, this should come from the parent component or context
                        name: 'Default Activity',
                        startDate: new Date().toISOString().split('T')[0],
                        endDate: new Date().toISOString().split('T')[0],
                        ActivityStatus: ActivityStatus.NOT_STARTED,
                        program: null
                    },
                    taskCategoryActivity: { id: undefined, name: '' },
                    startDate: '',
                    endDate: '',
                    subTasks: [],
                    comments: []
                } as TaskActivity;
                if (this.taskActivity) {
                    this.patchForm(this.taskActivity);
                }
                this.loading = false;
            }
        }
    }

    initForm(): void {
        this.taskActivityForm = this.fb.group({
            title: ['', [Validators.required]],
            description: [''],
            comments: [''],
            priorityActivity: [PriorityActivity.ACTIVITY_MEDIUM, [Validators.required]],
            statusActivity: [StatusActivity.TO_DO],
            comment: [''],
            xpPoint: [0, [Validators.min(0)]],
            startDate: [null],
            endDate: [null],
            assigneeId: [null, [Validators.required]],
            categoryId: [null]
        });

        this.taskActivityForm.get('startDate')?.valueChanges.subscribe((startDate) => {
            this.updateMinEndDate(startDate);
            this.taskActivityForm.get('endDate')?.updateValueAndValidity();
        });
    }

    startDateFilter = (date: Date | null): boolean => {
        if (!date) return true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
    };

    endDateFilter = (date: Date | null): boolean => {
        if (!date) return true;
        const startDate = this.taskActivityForm.get('startDate')?.value;
        const start = startDate ? new Date(startDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        const earliestAllowed = start || new Date();
        return date >= earliestAllowed;
    };

    fetchCurrentUser(): void {
        this.http.get('http://localhost:8085/users/profile').subscribe({
            next: (response: any) => {
                this.currentUser = response;
                console.log('Current user fetched:', this.currentUser);
            },
            error: (error) => {
                console.error('Failed to fetch current user:', error);
                this.snackBar.open('Failed to fetch user profile', 'Close', { duration: 3000 });
            }
        });
    }

    loadTaskActivity(id: number): void {
        this.loading = true;
        this.taskActivityService.getTaskActivityById(id).subscribe({
            next: (taskActivity) => {
                this.taskActivity = taskActivity;
                this.subTasks = taskActivity.subTasks || [];
                this.comments = taskActivity.comments || [];
                this.patchForm(taskActivity);
                this.selectedCategoryId = taskActivity.taskCategoryActivityId;
                this.loadTaskAssignees();
                this.loadAvailableCategories();
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.error = 'Failed to load task activity. Please try again later.';
                this.loading = false;
                this.snackBar.open('Failed to load task activity details', 'Close', { duration: 3000 });
                this.cdr.detectChanges();
            }
        });
    }

    patchForm(taskActivity: TaskActivity): void {
        const startDate = taskActivity.startDate ? new Date(taskActivity.startDate) : null;
        const endDate = taskActivity.endDate ? new Date(taskActivity.endDate) : null;

        this.taskActivityForm.patchValue(
            {
                title: taskActivity.title || '',
                description: taskActivity.description || '',
                comments: taskActivity.comments || '',
                priorityActivity: taskActivity.priorityActivity || PriorityActivity.ACTIVITY_MEDIUM,
                statusActivity: taskActivity.statusActivity || StatusActivity.TO_DO,
                comment: '',
                xpPoint: taskActivity.xpPoint || 0,
                startDate: startDate,
                endDate: endDate,
                assigneeId: taskActivity.assigneeId || null,
                categoryId: taskActivity.taskCategoryActivityId || null
            },
            { emitEvent: false }
        );

        if (this.taskActivity) {
            this.taskActivity.startDate = startDate?.toISOString().split('T')[0] || '';
            this.taskActivity.endDate = endDate?.toISOString().split('T')[0] || '';
        }
        this.cdr.detectChanges();
    }

    updateMinEndDate(startDate: Date | string | null = this.taskActivityForm.get('startDate')?.value): void {
        if (startDate instanceof Date) {
            this.minEndDate = startDate.toISOString().split('T')[0];
        } else if (typeof startDate === 'string' && startDate.length === 10) {
            this.minEndDate = startDate;
        } else {
            this.minEndDate = this.minStartDate;
        }
    }

    loadTaskAssignees(): void {
        this.userService.getUsers().subscribe({
            next: (users) => {
                this.availableAssignees = users;
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.snackBar.open('Failed to load assignees', 'Close', { duration: 3000 });
            }
        });
    }

    loadAvailableCategories(): void {
        this.taskCategoryActivityService.getAllTaskCategoryActivities().subscribe({
            next: (categories) => {
                this.availableCategories = categories;
                if (this.taskActivity && this.taskActivity.taskCategoryActivityId !== undefined) {
                    this.selectedCategoryId = this.taskActivity.taskCategoryActivityId;
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error fetching categories:', err);
                this.snackBar.open('Failed to load categories', 'Close', { duration: 3000 });
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

    onSubmit(): void {
        if (this.taskActivityForm.invalid) {
            this.markFormGroupTouched(this.taskActivityForm);
            this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
            return;
        }

        this.submitting = true;
        const taskActivityData = this.prepareTaskActivityData();

        if (this.taskActivity && this.taskActivity.taskActivityId) {
            this.taskActivityService.updateTaskActivity(this.taskActivity.taskActivityId, taskActivityData).subscribe({
                next: (updatedTaskActivity) => {
                    this.taskActivity = { ...updatedTaskActivity };
                    this.subTasks = updatedTaskActivity.subTasks || [];
                    this.comments = updatedTaskActivity.comments || [];
                    this.selectedCategoryId = updatedTaskActivity.taskCategoryActivityId;
                    this.patchForm(this.taskActivity);
                    this.submitting = false;
                    this.taskActivityUpdated.emit(this.taskActivity);
                    this.snackBar.open('Task activity updated successfully', 'Close', { duration: 3000 });
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    this.error = 'Failed to update task activity. Please try again later.';
                    this.submitting = false;
                    this.snackBar.open('Failed to update task activity', 'Close', { duration: 3000 });
                    this.cdr.detectChanges();
                }
            });
        } else {
            this.taskActivityService.createTaskActivity(taskActivityData).subscribe({
                next: (newTaskActivity) => {
                    this.submitting = false;
                    this.taskActivity = newTaskActivity;
                    this.subTasks = newTaskActivity.subTasks || [];
                    this.comments = newTaskActivity.comments || [];
                    this.taskActivityUpdated.emit(newTaskActivity);
                    this.close();
                    this.snackBar.open('Task activity created successfully', 'Close', { duration: 3000 });
                },
                error: (error) => {
                    this.error = 'Failed to create task activity. Please try again later.';
                    this.submitting = false;
                    this.snackBar.open('Failed to create task activity', 'Close', { duration: 3000 });
                    this.cdr.detectChanges();
                }
            });
        }
    }

    prepareTaskActivityData(): TaskActivity {
        const formValues = this.taskActivityForm.value;
        const selectedCategory = this.availableCategories.find((cat) => cat.id === this.selectedCategoryId);

        return {
            ...(this.taskActivity && this.taskActivity.taskActivityId ? { taskActivityId: this.taskActivity.taskActivityId } : {}),
            title: formValues.title,
            description: formValues.description,
            priorityActivity: formValues.priorityActivity,
            statusActivity: formValues.statusActivity,
            activity: this.taskActivity?.activity!,
            taskCategoryActivityId: this.selectedCategoryId,
            taskCategoryActivity: selectedCategory || this.taskActivity?.taskCategoryActivity,
            attachments: this.taskActivity?.attachments,
            xpPoint: formValues.xpPoint,
            startDate: formValues.startDate ? formValues.startDate.toISOString().split('T')[0] : undefined,
            endDate: formValues.endDate ? formValues.endDate.toISOString().split('T')[0] : undefined,
            assigneeId: formValues.assigneeId,
            subTasks: this.subTasks,
            comments: this.comments
        } as TaskActivity;
    }

    markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((key) => {
            const control = formGroup.get(key);
            if (control instanceof FormGroup) {
                this.markFormGroupTouched(control);
            } else {
                control?.markAsTouched();
            }
        });
    }

    deleteTaskActivity(): void {
        if (!this.taskActivity || !this.taskActivity.taskActivityId) return;

        this.loading = true;
        this.taskActivityService.deleteTaskActivity(this.taskActivity.taskActivityId).subscribe({
            next: () => {
                this.loading = false;
                this.snackBar.open('Task activity deleted successfully', 'Close', { duration: 3000 });
                this.close();
            },
            error: (error) => {
                this.loading = false;
                this.snackBar.open('Failed to delete task activity', 'Close', { duration: 3000 });
                this.cdr.detectChanges();
            }
        });
    }

    close() {
        this.closeEvent.emit(false);
    }

    startEditingTitle(): void {
        this.editingTitle = true;
    }

    saveTitle(): void {
        if (!this.taskActivityForm.value.title) {
            this.snackBar.open('Title cannot be empty', 'Close', { duration: 3000 });
            return;
        }

        if (this.taskActivity) {
            this.taskActivity.title = this.taskActivityForm.value.title;
        }
        this.editingTitle = false;
        this.onSubmit();
    }

    cancelEditTitle(): void {
        if (this.taskActivity) {
            this.taskActivityForm.patchValue({ title: this.taskActivity.title });
        }
        this.editingTitle = false;
    }

    startEditingDescription(): void {
        this.editingDescription = true;
    }

    saveDescription(): void {
        if (this.taskActivity) {
            this.taskActivity.description = this.taskActivityForm.value.description;
        }
        this.editingDescription = false;
        this.onSubmit();
    }

    cancelEditDescription(): void {
        if (this.taskActivity) {
            this.taskActivityForm.patchValue({ description: this.taskActivity.description });
        }
        this.editingDescription = false;
    }

    startEditingXpPoint(): void {
        this.editingXpPoint = true;
    }

    saveXpPoint(): void {
        const xpPointValue = this.taskActivityForm.value.xpPoint;
        if (xpPointValue < 0) {
            this.snackBar.open('XP Points cannot be negative', 'Close', { duration: 3000 });
            return;
        }

        if (this.taskActivity) {
            this.taskActivity.xpPoint = xpPointValue;
            this.editingXpPoint = false;
            this.onSubmit();
        }
    }

    cancelEditXpPoint(): void {
        if (this.taskActivity) {
            this.taskActivityForm.patchValue({ xpPoint: this.taskActivity.xpPoint });
        }
        this.editingXpPoint = false;
    }

    toggleStatusDropdown(): void {
        this.showStatusDropdown = !this.showStatusDropdown;
    }

    togglePriorityDropdown(): void {
        this.showPriorityDropdown = !this.showPriorityDropdown;
    }

    selectStatus(status: StatusActivity): void {
        if (this.taskActivity) {
            this.taskActivity.statusActivity = status;
            this.taskActivityForm.patchValue({ statusActivity: status });
            this.showStatusDropdown = false;
            this.onSubmit();
        }
    }

    selectPriority(priority: PriorityActivity): void {
        if (this.taskActivity) {
            this.taskActivity.priorityActivity = priority;
            this.taskActivityForm.patchValue({ priorityActivity: priority });
            this.showPriorityDropdown = false;
            this.onSubmit();
        }
    }

    openAssigneeDropdown(): void {
        this.showAssigneeDropdown = !this.showAssigneeDropdown;
    }

    selectAssignee(assignee: Assignee): void {
        if (this.taskActivity) {
            this.taskActivity.assigneeId = assignee.id;
            this.taskActivityForm.patchValue({ assigneeId: assignee.id });
            this.onSubmit();
            this.showAssigneeDropdown = false;
        }
    }

    startEditingCategory(): void {
        this.loadAvailableCategories();
        this.editingCategory = true;
    }

    saveTaskCategory(): void {
        if (this.taskActivity && this.selectedCategoryId !== undefined) {
            this.taskActivity.taskCategoryActivityId = this.selectedCategoryId;
            this.taskActivityForm.get('categoryId')?.setValue(this.selectedCategoryId);
            this.onSubmit();
            this.editingCategory = false;
        } else {
            this.snackBar.open('Aucune catégorie sélectionnée', 'Close', { duration: 3000 });
            this.editingCategory = false;
        }
    }

    cancelEditTaskCategory(): void {
        if (this.taskActivity && this.taskActivity.taskCategoryActivityId !== undefined) {
            this.selectedCategoryId = this.taskActivity.taskCategoryActivityId;
        } else {
            this.selectedCategoryId = undefined;
        }
        this.editingCategory = false;
    }

    getAssigneeName(assigneeId: number | undefined): string {
        if (!assigneeId) return 'Aucun responsable';
        const assignee = this.availableAssignees.find((a) => a.id === assigneeId);
        return assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Aucun responsable';
    }

    trackByAttachments(index: number, attachment: AttachmentActivity): string {
        return attachment.name;
    }

    downloadAttachment(attachment: AttachmentActivity) {
        if (!this.taskActivity?.taskActivityId) return;
        this.taskActivityService.downloadAttachment(this.taskActivity.taskActivityId, attachment.name).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = attachment.name;
                link.click();
                window.URL.revokeObjectURL(url);
            },
            error: (err) => {
                this.snackBar.open('Failed to download attachment.', 'Close', { duration: 3000 });
            }
        });
    }

    deleteAttachment(attachment: AttachmentActivity) {
        if (!this.taskActivity || !this.taskActivity.taskActivityId) return;

        this.taskActivity.attachments = this.taskActivity.attachments?.filter((att) => att.name !== attachment.name) || [];

        this.loading = true;
        this.taskActivityService.updateTaskActivity(this.taskActivity.taskActivityId, this.taskActivity).subscribe({
            next: (updatedTaskActivity) => {
                this.taskActivity = updatedTaskActivity;
                this.loading = false;
                this.taskActivityUpdated.emit(updatedTaskActivity);
                this.snackBar.open('Attachment deleted successfully.', 'Close', { duration: 2000 });
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.loading = false;
                this.snackBar.open('Failed to delete attachment.', 'Close', { duration: 3000 });
                this.taskActivityService.getTaskActivityById(this.taskActivity!.taskActivityId!).subscribe((taskActivity) => {
                    this.taskActivity = taskActivity;
                    this.patchForm(taskActivity);
                    this.cdr.detectChanges();
                });
            }
        });
    }

    saveStartDate(): void {
        if (this.taskActivity) {
            const startDate = this.taskActivityForm.value.startDate;
            this.taskActivity.startDate = startDate ? startDate.toISOString().split('T')[0] : '';
            this.onSubmit();
        }
    }

    cancelEditStartDate(): void {
        if (this.taskActivity) {
            this.taskActivityForm.patchValue({ startDate: this.taskActivity.startDate ? new Date(this.taskActivity.startDate) : null });
        }
    }

    saveEndDate(): void {
        if (this.taskActivity) {
            const endDate = this.taskActivityForm.value.endDate;
            this.taskActivity.endDate = endDate ? endDate.toISOString().split('T')[0] : '';
            this.onSubmit();
        }
    }

    cancelEditEndDate(): void {
        if (this.taskActivity) {
            this.taskActivityForm.patchValue({ endDate: this.taskActivity.endDate ? new Date(this.taskActivity.endDate) : null });
        }
    }

    addSubTask(): void {
        if (this.newSubTask.title.trim()) {
            this.subTasks.push({ ...this.newSubTask });
            this.newSubTask = { title: '', description: '' };
            this.onSubmit();
        } else {
            this.snackBar.open('Sub-task title is required', 'Close', { duration: 3000 });
        }
    }

    startEditingSubTask(index: number): void {
        this.editingSubTaskIndex = index;
    }

    saveSubTask(index: number): void {
        if (this.subTasks[index].title.trim()) {
            this.editingSubTaskIndex = null;
            this.onSubmit();
        } else {
            this.snackBar.open('Sub-task title is required', 'Close', { duration: 3000 });
        }
    }

    cancelEditSubTask(index: number): void {
        this.editingSubTaskIndex = null;
    }

    deleteSubTask(index: number): void {
        this.subTasks.splice(index, 1);
        this.onSubmit();
    }
    addComment(): void {
        const commentValue = this.taskActivityForm.value.comment;

        if (!commentValue?.trim() || !this.taskActivity?.taskActivityId || !this.currentUser) {
            this.snackBar.open('Comment cannot be empty or user not loaded', 'Close', { duration: 3000 });
            return;
        }

        const newComment: CommentActivity = {
            content: commentValue,
            profilePictureUrl: this.currentUser.profile_pictureurl,
            firstName: this.currentUser.firstName,
            lastName: this.currentUser.lastName,
            userId: this.currentUser.id
            // ❌ createdAt is not needed here — the backend will handle it
        };

        this.taskActivityService.addCommentToTaskActivity(this.taskActivity.taskActivityId, newComment).subscribe({
            next: (updatedTaskActivity) => {
                this.taskActivity = updatedTaskActivity;
                this.comments = updatedTaskActivity.comments || [];
                this.taskActivityForm.patchValue({ comment: '' });
                this.snackBar.open('Comment added successfully', 'Close', { duration: 3000 });
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Failed to add comment:', error);
                this.snackBar.open('Failed to add comment', 'Close', { duration: 3000 });
            }
        });
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0 && this.taskActivity?.taskActivityId) {
            const file = input.files[0];
            this.loading = true;
            this.taskActivityService.uploadAttachment(this.taskActivity.taskActivityId, file).subscribe({
                next: (updatedTaskActivity) => {
                    this.taskActivity = updatedTaskActivity;
                    this.loading = false;
                    this.snackBar.open('Attachment uploaded successfully', 'Close', { duration: 3000 });
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    this.loading = false;
                    this.snackBar.open('Failed to upload attachment', 'Close', { duration: 3000 });
                    this.cdr.detectChanges();
                }
            });
        }
    }
}
