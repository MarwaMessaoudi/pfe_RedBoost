import { Component, OnInit, ViewEncapsulation, Input, Output, EventEmitter, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TaskService } from '../../../service/task.service';
import { PhaseService } from '../../../service/phase.service';
import { TaskCategoryService } from '../../../service/taskCategory.service';
import { Task, Priority, Status, Attachment, TaskCategory, SubTask, Comment, PriorityTranslation, StatusTranslation } from '../../../../../models/task';
import { Phase, PhaseStatus } from '../../../../../models/phase';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../../../../../models/user';

interface Assignee {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role: string;
}

@Component({
    selector: 'app-task-update',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ReactiveFormsModule, MatIconModule, MatSnackBarModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule],
    templateUrl: './task-update.component.html',
    styleUrls: ['./task-update.component.scss'],
    encapsulation: ViewEncapsulation.None,
    providers: [DatePipe]
})
export class TaskUpdateComponent implements OnInit {
    taskForm!: FormGroup;
    @Input() task: Task | null = null;
    @Input() isOpen: boolean = false;
    @Input() entrepreneurs: User[] = [];
    @Output() closeEvent = new EventEmitter<boolean>();
    @Output() taskUpdated = new EventEmitter<Task>();

    taskId: number | null = null;
    isEditMode = true;
    loading = false;
    submitting = false;
    error = '';
    priorityOptions = Object.values(Priority);
    statusOptions: Status[] = [];
    editingTitle: boolean = false;
    editingDescription: boolean = false;
    editingCategory: boolean = false;
    editingXpPoint: boolean = false;
    showStatusDropdown: boolean = false;
    showPriorityDropdown: boolean = false;
    showAssigneeDropdown: boolean = false;

    availableAssignees: Assignee[] = [];
    availableCategories: TaskCategory[] = [];
    comments: Comment[] = [];
    selectedCategoryId: number | undefined;

    subTasks: SubTask[] = [];
    editingSubTaskIndex: number | null = null;
    newSubTask: SubTask = { title: '', description: '' };

    effectiveMinStartDate: string = '';
    phaseStartDate: string = '';
    phaseEndDate: string = '';

    currentUser: any = null;
    attachmentName: string | null = null;

    constructor(
        private fb: FormBuilder,
        private taskService: TaskService,
        private phaseService: PhaseService,
        private taskCategoryService: TaskCategoryService,
        private snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef,
        private http: HttpClient,
        private datePipe: DatePipe
    ) {}

    ngOnInit(): void {
        this.updateDateConstraints();
        this.initForm();
        this.fetchCurrentUser();
        this.statusOptions = Object.values(Status).filter((status) => status !== Status.VALIDATED);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['task'] && this.taskForm) {
            this.updateDateConstraints();
            if (this.task && this.task.taskId) {
                this.loadTask(this.task.taskId);
            } else {
                this.task = {
                    taskId: undefined,
                    title: 'New Task',
                    xpPoint: 0,
                    priority: Priority.MEDIUM,
                    status: Status.TO_DO,
                    phase: {
                        phaseId: 1,
                        phaseName: 'Phase 1',
                        status: PhaseStatus.NOT_STARTED,
                        startDate: '',
                        endDate: ''
                    },
                    taskCategory: { id: undefined, name: '' },
                    startDate: this.effectiveMinStartDate,
                    endDate: '',
                    subTasks: [],
                    comments: [],
                    attachment: { name: '', fileId: '' }
                } as Task;
                this.patchForm(this.task);
                this.loading = false;
                this.cdr.detectChanges();
            }
        }
        if (changes['entrepreneurs'] && this.entrepreneurs) {
            this.availableAssignees = this.entrepreneurs.map((user) => ({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role
            }));
            this.cdr.detectChanges();
        }
    }

    updateDateConstraints(): void {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const phaseStart = this.task?.phase?.startDate ? new Date(this.task.phase.startDate) : null;
        const phaseEnd = this.task?.phase?.endDate ? new Date(this.task.phase.endDate) : null;

        if (phaseStart && !isNaN(phaseStart.getTime())) {
            phaseStart.setHours(0, 0, 0, 0);
        } else {
            console.warn('Invalid phase start date:', this.task?.phase?.startDate);
        }

        if (phaseEnd && !isNaN(phaseEnd.getTime())) {
            phaseEnd.setHours(0, 0, 0, 0);
        } else {
            console.warn('Invalid phase end date:', this.task?.phase?.endDate);
        }

        let earliestAllowedStart = today;
        if (phaseStart && !isNaN(phaseStart.getTime()) && phaseStart > today) {
            earliestAllowedStart = phaseStart;
        }

        this.effectiveMinStartDate = this.formatDate(earliestAllowedStart);
        this.phaseStartDate = phaseStart && !isNaN(phaseStart.getTime()) ? this.formatDate(phaseStart) : '';
        this.phaseEndDate = phaseEnd && !isNaN(phaseEnd.getTime()) ? this.formatDate(phaseEnd) : '';

        console.log('Date Constraints:', {
            effectiveMinStartDate: this.effectiveMinStartDate,
            phaseStartDate: this.phaseStartDate,
            phaseEndDate: this.phaseEndDate
        });

        // Force form validation update
        if (this.taskForm) {
            this.taskForm.get('startDate')?.updateValueAndValidity();
            this.taskForm.get('endDate')?.updateValueAndValidity();
            this.taskForm.updateValueAndValidity();
        }
        this.cdr.detectChanges();
    }

    initForm(): void {
        this.taskForm = this.fb.group(
            {
                title: ['', [Validators.required]],
                description: [''],
                comments: [''],
                priority: [Priority.MEDIUM],
                status: [Status.TO_DO],
                comment: [''],
                xpPoint: [0, [Validators.min(0)]],
                startDate: [null, [Validators.required]],
                endDate: [null, [Validators.required]],
                assigneeId: [null],
                categoryId: [null]
            },
            {
                validators: [this.dateRangeValidator.bind(this), this.startDatePhaseValidator.bind(this), this.endDatePhaseValidator.bind(this)]
            }
        );
    }

    startDateFilter = (date: Date | null): boolean => {
        if (!date) return true;
        date.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const phaseStart = this.task?.phase?.startDate ? new Date(this.task.phase.startDate) : null;
        const phaseEnd = this.task?.phase?.endDate ? new Date(this.task.phase.endDate) : null;

        const validPhaseStart = phaseStart && !isNaN(phaseStart.getTime()) ? phaseStart : null;
        const validPhaseEnd = phaseEnd && !isNaN(phaseEnd.getTime()) ? phaseEnd : null;

        if (validPhaseStart) validPhaseStart.setHours(0, 0, 0, 0);
        if (validPhaseEnd) validPhaseEnd.setHours(0, 0, 0, 0);

        const earliestAllowed = validPhaseStart && validPhaseStart > today ? validPhaseStart : today;

        const isValid = date >= earliestAllowed && (!validPhaseEnd || date <= validPhaseEnd);

        console.log('startDateFilter:', {
            inputDate: this.formatDate(date),
            earliestAllowed: this.formatDate(earliestAllowed),
            phaseEnd: validPhaseEnd ? this.formatDate(validPhaseEnd) : 'undefined',
            isValid
        });

        return isValid;
    };

    endDateFilter = (date: Date | null): boolean => {
        if (!date) return true;
        date.setHours(0, 0, 0, 0);

        const startDate = this.taskForm.get('startDate')?.value;
        const phaseStart = this.task?.phase?.startDate ? new Date(this.task.phase.startDate) : null;
        const phaseEnd = this.task?.phase?.endDate ? new Date(this.task.phase.endDate) : null;

        const validPhaseStart = phaseStart && !isNaN(phaseStart.getTime()) ? phaseStart : null;
        const validPhaseEnd = phaseEnd && !isNaN(phaseEnd.getTime()) ? phaseEnd : null;

        if (validPhaseStart) validPhaseStart.setHours(0, 0, 0, 0);
        if (validPhaseEnd) validPhaseEnd.setHours(0, 0, 0, 0);

        const start = startDate ? new Date(startDate) : null;
        if (start && !isNaN(start.getTime())) start.setHours(0, 0, 0, 0);

        const earliestAllowed = start && validPhaseStart && start < validPhaseStart ? validPhaseStart : start || validPhaseStart || new Date();
        earliestAllowed.setHours(0, 0, 0, 0);

        const isValid = date >= earliestAllowed && (!validPhaseEnd || date <= validPhaseEnd);

        console.log('endDateFilter:', {
            inputDate: this.formatDate(date),
            earliestAllowed: this.formatDate(earliestAllowed),
            phaseEnd: validPhaseEnd ? this.formatDate(validPhaseEnd) : 'undefined',
            isValid
        });

        return isValid;
    };

    startDatePhaseValidator(group: FormGroup): { [key: string]: any } | null {
        const startDate = group.get('startDate')?.value;
        if (!startDate) return null;

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const phaseStart = this.task?.phase?.startDate ? new Date(this.task.phase.startDate) : null;
        const phaseEnd = this.task?.phase?.endDate ? new Date(this.task.phase.endDate) : null;

        const validPhaseStart = phaseStart && !isNaN(phaseStart.getTime()) ? phaseStart : null;
        const validPhaseEnd = phaseEnd && !isNaN(phaseEnd.getTime()) ? phaseEnd : null;

        if (validPhaseStart) validPhaseStart.setHours(0, 0, 0, 0);
        if (validPhaseEnd) validPhaseEnd.setHours(0, 0, 0, 0);

        let earliestAllowedStart = today;
        if (validPhaseStart && validPhaseStart > today) {
            earliestAllowedStart = validPhaseStart;
        }

        if (start < earliestAllowedStart) {
            return { invalidStartDateEarly: { requiredAfter: this.formatDate(earliestAllowedStart) } };
        }

        if (validPhaseEnd && start > validPhaseEnd) {
            return { startDateAfterPhaseEnd: { requiredBefore: this.formatDate(validPhaseEnd) } };
        }

        return null;
    }

    endDatePhaseValidator(group: FormGroup): { [key: string]: any } | null {
        const endDate = group.get('endDate')?.value;
        if (!endDate) return null;

        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);

        const phaseStart = this.task?.phase?.startDate ? new Date(this.task.phase.startDate) : null;
        const phaseEnd = this.task?.phase?.endDate ? new Date(this.task.phase.endDate) : null;

        const validPhaseStart = phaseStart && !isNaN(phaseStart.getTime()) ? phaseStart : null;
        const validPhaseEnd = phaseEnd && !isNaN(phaseEnd.getTime()) ? phaseEnd : null;

        if (validPhaseStart) validPhaseStart.setHours(0, 0, 0, 0);
        if (validPhaseEnd) validPhaseEnd.setHours(0, 0, 0, 0);

        if (validPhaseEnd && end > validPhaseEnd) {
            return { endDateAfterPhaseEnd: { requiredBefore: this.formatDate(validPhaseEnd) } };
        }

        if (validPhaseStart && end < validPhaseStart) {
            return { endDateBeforePhaseStart: { requiredAfter: this.formatDate(validPhaseStart) } };
        }

        return null;
    }

    dateRangeValidator(group: FormGroup): { [key: string]: any } | null {
        const startDate = group.get('startDate')?.value;
        const endDate = group.get('endDate')?.value;

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            if (start > end) {
                return { dateRangeInvalid: true };
            }
        }
        return null;
    }

    fetchCurrentUser(): void {
        this.http.get('http://localhost:8085/users/profile').subscribe({
            next: (response: any) => {
                this.currentUser = response;
                console.log('Current user fetched:', this.currentUser);
                if (this.currentUser?.role === 'COACH') {
                    this.statusOptions = Object.values(Status);
                } else {
                    this.statusOptions = Object.values(Status).filter((status) => status !== Status.VALIDATED);
                }
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Failed to fetch current user:', error);
                this.snackBar.open('Failed to fetch user profile', 'Close', { duration: 3000 });
                this.statusOptions = Object.values(Status).filter((status) => status !== Status.VALIDATED);
                this.cdr.detectChanges();
            }
        });
    }

    loadTask(id: number): void {
        this.loading = true;
        this.taskService.getTaskById(id).subscribe({
            next: (task) => {
                this.task = task;
                this.subTasks = task.subTasks || [];
                this.comments = task.comments || [];
                this.patchForm(task);
                this.selectedCategoryId = task.taskCategoryId;
                this.availableAssignees = this.entrepreneurs.map((user) => ({
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    role: user.role
                }));
                this.loadAvailableCategories();
                if (task.attachment?.fileId) {
                    this.fetchAttachmentName(task.attachment.fileId);
                } else {
                    this.attachmentName = null;
                }
                this.updateDateConstraints(); // Recompute date constraints after loading task
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.error = 'Failed to load task. Please try again later.';
                this.loading = false;
                this.snackBar.open('Failed to load task details', 'Close', { duration: 3000 });
                this.cdr.detectChanges();
            }
        });
    }

    patchForm(task: Task): void {
        const startDate = task.startDate ? this.formatDate(new Date(task.startDate)) : null;
        const endDate = task.endDate ? this.formatDate(new Date(task.endDate)) : null;

        this.taskForm.patchValue(
            {
                title: task.title || '',
                description: task.description || '',
                comments: task.comments || '',
                priority: task.priority || Priority.MEDIUM,
                status: task.status || Status.TO_DO,
                comment: '',
                xpPoint: task.xpPoint || 0,
                startDate: startDate,
                endDate: endDate,
                assigneeId: task.assigneeId || null,
                categoryId: task.taskCategoryId || null
            },
            { emitEvent: false }
        );

        if (this.task) {
            this.task.startDate = startDate || '';
            this.task.endDate = endDate || '';
        }
        this.taskForm.updateValueAndValidity();
        this.cdr.detectChanges();
    }

    loadAvailableCategories(): void {
        this.taskCategoryService.getAllTaskCategories().subscribe({
            next: (categories) => {
                this.availableCategories = categories;
                if (this.task && this.task.taskCategoryId !== undefined) {
                    this.selectedCategoryId = this.task.taskCategoryId;
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

    getAssigneeName(assigneeId: number | undefined): string {
        if (!assigneeId) return 'Aucun responsable';
        const assignee = this.availableAssignees.find((a) => a.id === assigneeId);
        return assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Aucun responsable';
    }

    onSubmit(): void {
        this.markFormGroupTouched(this.taskForm);

        if (this.taskForm.invalid) {
            this.snackBar.open('Veuillez corriger les erreurs dans le formulaire', 'Fermer', { duration: 3000 });
            return;
        }

        this.submitting = true;
        const taskData = this.prepareTaskData();

        if (this.task && this.task.taskId) {
            this.taskService.updateTask(this.task.taskId, taskData).subscribe({
                next: (updatedTask) => {
                    this.task = { ...updatedTask };
                    this.subTasks = updatedTask.subTasks || [];
                    this.comments = updatedTask.comments || [];
                    this.selectedCategoryId = updatedTask.taskCategoryId;
                    this.patchForm(this.task);
                    this.submitting = false;
                    this.taskUpdated.emit(this.task);
                    this.snackBar.open('Task updated successfully', 'Close', { duration: 3000 });
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    this.error = 'Failed to update task. Please try again later.';
                    this.submitting = false;
                    this.snackBar.open('Failed to update task', 'Close', { duration: 3000 });
                    this.cdr.detectChanges();
                }
            });
        }
    }

    prepareTaskData(): Task {
        const formValues = this.taskForm.value;

        return {
            taskId: this.task?.taskId,
            title: formValues.title,
            description: formValues.description || '',
            priority: formValues.priority || 'MEDIUM',
            status: formValues.status || 'TO_DO',
            taskCategoryId: this.selectedCategoryId || null,
            xpPoint: formValues.xpPoint || 0,
            startDate: formValues.startDate || null,
            endDate: formValues.endDate || null,
            assigneeId: formValues.assigneeId || null,
            subTasks: this.subTasks || [],
            comments: this.comments || [],
            attachment: this.task?.attachment || null,
            phase: this.task?.phase || { phaseId: 1 }
        } as Task;
    }

    markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((key) => {
            const control = formGroup.get(key);
            if (control instanceof FormGroup) {
                this.markFormGroupTouched(control);
            } else {
                control?.markAsTouched();
                control?.updateValueAndValidity({ onlySelf: true, emitEvent: true });
            }
        });
        formGroup.updateValueAndValidity({ onlySelf: false, emitEvent: true });
    }

    deleteTask(): void {
        if (!this.task || !this.task.taskId) return;

        this.loading = true;
        this.taskService.deleteTask(this.task.taskId).subscribe({
            next: () => {
                this.loading = false;
                this.snackBar.open('Task deleted successfully', 'Close', { duration: 3000 });
                this.close();
            },
            error: (error) => {
                this.loading = false;
                this.snackBar.open('Failed to delete task', 'Close', { duration: 3000 });
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
        if (!this.taskForm.value.title) {
            this.snackBar.open('Title cannot be empty', 'Close', { duration: 3000 });
            return;
        }

        if (this.task) {
            this.task.title = this.taskForm.value.title;
        }
        this.editingTitle = false;
        this.onSubmit();
    }

    cancelEditTitle(): void {
        if (this.task) {
            this.taskForm.patchValue({ title: this.task.title });
        }
        this.editingTitle = false;
    }

    startEditingDescription(): void {
        this.editingDescription = true;
    }

    saveDescription(): void {
        if (this.task) {
            this.task.description = this.taskForm.value.description;
        }
        this.editingDescription = false;
        this.onSubmit();
    }

    cancelEditDescription(): void {
        if (this.task) {
            this.taskForm.patchValue({ description: this.task.description });
        }
        this.editingDescription = false;
    }

    startEditingXpPoint(): void {
        this.editingXpPoint = true;
    }

    saveXpPoint(): void {
        const xpPointValue = this.taskForm.value.xpPoint;
        if (xpPointValue < 0) {
            this.snackBar.open('XP Points cannot be negative', 'Close', { duration: 3000 });
            return;
        }

        if (this.task) {
            this.task.xpPoint = xpPointValue;
            this.editingXpPoint = false;
            this.onSubmit();
        }
    }

    cancelEditXpPoint(): void {
        if (this.task) {
            this.taskForm.patchValue({ xpPoint: this.task.xpPoint });
        }
        this.editingXpPoint = false;
    }

    toggleStatusDropdown(): void {
        this.showStatusDropdown = !this.showStatusDropdown;
    }

    togglePriorityDropdown(): void {
        this.showPriorityDropdown = !this.showPriorityDropdown;
    }

    selectStatus(status: Status): void {
        if (this.task) {
            this.task.status = status;
            this.taskForm.patchValue({ status });
            this.showStatusDropdown = false;
            this.onSubmit();
        }
    }

    selectPriority(priority: Priority): void {
        if (this.task) {
            this.task.priority = priority;
            this.taskForm.patchValue({ priority });
            this.showPriorityDropdown = false;
            this.onSubmit();
        }
    }

    openAssigneeDropdown(): void {
        this.showAssigneeDropdown = !this.showAssigneeDropdown;
    }

    selectAssignee(assignee: Assignee): void {
        if (this.task) {
            this.task.assigneeId = assignee.id;
            this.taskForm.patchValue({ assigneeId: assignee.id });
            this.onSubmit();
            this.showAssigneeDropdown = false;
        }
    }

    startEditingCategory(): void {
        this.loadAvailableCategories();
        this.editingCategory = true;
    }

    saveTaskCategory(): void {
        if (this.task && this.selectedCategoryId !== undefined) {
            this.task.taskCategoryId = this.selectedCategoryId;
            this.taskForm.get('categoryId')?.setValue(this.selectedCategoryId);
            this.onSubmit();
            this.editingCategory = false;
        } else {
            this.snackBar.open('Aucune catégorie sélectionnée', 'Close', { duration: 3000 });
            this.editingCategory = false;
        }
    }

    cancelEditTaskCategory(): void {
        if (this.task && this.task.taskCategoryId !== undefined) {
            this.selectedCategoryId = this.task.taskCategoryId;
        } else {
            this.selectedCategoryId = undefined;
        }
        this.editingCategory = false;
    }

    addComment(): void {
        const commentValue = this.taskForm.value.comment;
        if (!commentValue?.trim() || !this.task?.taskId || !this.currentUser) {
            this.snackBar.open('Comment cannot be empty or user not loaded', 'Close', { duration: 3000 });
            return;
        }

        const newComment: Comment = {
            content: commentValue,
            profilePictureUrl: this.currentUser.profile_pictureurl,
            firstName: this.currentUser.firstName,
            lastName: this.currentUser.lastName,
            userId: this.currentUser.id
        };

        this.taskService.addCommentToTask(this.task.taskId, newComment).subscribe({
            next: (updatedTask) => {
                this.task = updatedTask;
                this.comments = updatedTask.comments || [];
                this.taskForm.patchValue({ comment: '' });
                this.snackBar.open('Comment added successfully', 'Close', { duration: 3000 });
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Failed to add comment:', error);
                this.snackBar.open('Failed to add comment', 'Close', { duration: 3000 });
            }
        });
    }

    trackByAttachments(index: number, attachment: Attachment): string {
        return attachment.fileId || attachment.name || '';
    }

    saveStartDate(): void {
        if (this.task) {
            const startDate = this.taskForm.value.startDate;
            this.task.startDate = startDate ? this.formatDate(new Date(startDate)) : '';
            this.taskForm.get('endDate')?.updateValueAndValidity();
            this.taskForm.updateValueAndValidity();
            this.onSubmit();
        }
    }

    saveEndDate(): void {
        if (this.task) {
            const endDate = this.taskForm.value.endDate;
            this.task.endDate = endDate ? this.formatDate(new Date(endDate)) : '';
            this.taskForm.updateValueAndValidity();
            this.onSubmit();
        }
    }

    cancelEditStartDate(): void {
        if (this.task) {
            this.taskForm.patchValue({ startDate: this.task.startDate ? this.formatDate(new Date(this.task.startDate)) : null });
        }
    }

    cancelEditEndDate(): void {
        if (this.task) {
            this.taskForm.patchValue({ endDate: this.task.endDate ? this.formatDate(new Date(this.task.endDate)) : null });
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

    fetchAttachmentName(fileId: string): void {
        this.http.get(`http://localhost:8085/api/drive/files/${fileId}/name`).subscribe({
            next: (response: any) => {
                this.attachmentName = response.name || 'Unknown File';
                if (this.task && this.task.attachment) {
                    this.task.attachment.name = this.attachmentName || 'Unknown File';
                }
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Failed to fetch attachment name:', error);
                this.attachmentName = 'Unknown File';
                if (this.task) {
                    this.task.attachment.name = this.attachmentName;
                }
                this.snackBar.open('Failed to fetch attachment name', 'Close', { duration: 3000 });
                this.cdr.detectChanges();
            }
        });
    }

    downloadAttachment(): void {
        if (!this.task?.taskId || !this.task.attachment?.fileId) {
            this.snackBar.open('No attachment available for download.', 'Close', { duration: 3000 });
            return;
        }
        this.taskService.downloadAttachment(this.task.taskId).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = this.attachmentName || 'attachment';
                link.click();
                window.URL.revokeObjectURL(url);
                this.snackBar.open('Attachment downloaded successfully.', 'Close', { duration: 3000 });
            },
            error: (err) => {
                console.error('Failed to download attachment:', err);
                this.snackBar.open('Failed to download attachment.', 'Close', { duration: 3000 });
            }
        });
    }

    getTranslatedPriority(priority: Priority): string {
        return PriorityTranslation[priority] || priority;
    }

    getTranslatedStatus(status: Status | undefined): string {
        if (!status) return '';
        return StatusTranslation[status] || status;
    }

    private formatDate(date: Date): string {
        if (!date || isNaN(date.getTime())) return '';
        return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
    }
}
