import { Component, Inject, OnInit, ViewEncapsulation, ElementRef, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TaskService } from '../../../service/task.service';
import { TaskCategoryService } from '../../../service/taskCategory.service';
import { Task, Priority, Status, TaskCategory, PriorityTranslation } from '../../../../../models/task';
import { Phase } from '../../../../../models/phase';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { User } from '../../../../../models/user';

interface DialogData {
    phaseId: number;
    entrepreneurs: User[];
    phase?: Phase; // Phase data for date constraints
}

@Component({
    selector: 'app-task-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatSnackBarModule, DatePipe],
    templateUrl: './task-form.component.html',
    styleUrls: ['./task-form.component.scss'],
    encapsulation: ViewEncapsulation.ShadowDom,
    providers: [DatePipe]
})
export class TaskFormComponent implements OnInit {
    taskForm!: FormGroup;
    loading = false;
    submitting = false;
    error = '';
    priorityOptions = Object.values(Priority);
    taskCategories: TaskCategory[] = [];
    phaseId: number;
    @ViewChild('fileInput') fileInput!: ElementRef;
    selectedFile: File | null = null;

    // Date constraints derived from phase and today
    effectiveMinStartDate: string = '';
    phaseStartDate: string = '';
    phaseEndDate: string = '';

    constructor(
        private fb: FormBuilder,
        private taskService: TaskService,
        private taskCategoryService: TaskCategoryService,
        private snackBar: MatSnackBar,
        public dialogRef: MatDialogRef<TaskFormComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private datePipe: DatePipe
    ) {
        this.phaseId = this.data.phaseId;
    }

    ngOnInit(): void {
        // Calculate date constraints
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const phaseStart = this.data.phase?.startDate ? new Date(this.data.phase.startDate) : null;
        if (phaseStart) phaseStart.setHours(0, 0, 0, 0);

        const phaseEnd = this.data.phase?.endDate ? new Date(this.data.phase.endDate) : null;
        if (phaseEnd) phaseEnd.setHours(0, 0, 0, 0);

        let earliestAllowedStart = today;
        if (phaseStart && phaseStart > today) {
            earliestAllowedStart = phaseStart;
        }

        this.effectiveMinStartDate = this.formatDate(earliestAllowedStart);
        this.phaseStartDate = phaseStart ? this.formatDate(phaseStart) : '';
        this.phaseEndDate = phaseEnd ? this.formatDate(phaseEnd) : '';

        this.initForm();
        this.loadTaskCategories();

        // Pre-fill form for new task
        this.taskForm.patchValue({
            phase: { phaseId: this.phaseId },
            startDate: this.effectiveMinStartDate
        });
    }

    initForm(): void {
        this.taskForm = this.fb.group(
            {
                title: ['', [Validators.required]],
                xpPoint: [0, [Validators.required, Validators.min(0)]],
                description: [''],
                assigneeId: [null, [Validators.required]],
                startDate: ['', [Validators.required]],
                endDate: ['', [Validators.required]],
                priority: [Priority.MEDIUM, [Validators.required]],
                taskCategory: [null, [Validators.required]],
                phase: this.fb.group({
                    phaseId: [this.phaseId, [Validators.required]]
                })
            },
            {
                validators: [
                    this.dateRangeValidator.bind(this),
                    this.startDatePhaseValidator.bind(this),
                    this.endDatePhaseValidator.bind(this)
                ]
            }
        );
    }

    startDatePhaseValidator(group: FormGroup): { [key: string]: any } | null {
        const startDate = group.get('startDate')?.value;
        if (!startDate) return null;

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const phaseStart = this.data.phase?.startDate ? new Date(this.data.phase.startDate) : null;
        if (phaseStart) phaseStart.setHours(0, 0, 0, 0);

        const phaseEnd = this.data.phase?.endDate ? new Date(this.data.phase.endDate) : null;
        if (phaseEnd) phaseEnd.setHours(0, 0, 0, 0);

        let earliestAllowedStart = today;
        if (phaseStart && phaseStart > today) {
            earliestAllowedStart = phaseStart;
        }
        if (start < earliestAllowedStart) {
            return { invalidStartDateEarly: { requiredAfter: this.formatDate(earliestAllowedStart) } };
        }

        if (phaseEnd && start > phaseEnd) {
            return { startDateAfterPhaseEnd: { requiredBefore: this.formatDate(phaseEnd) } };
        }

        return null;
    }

    endDatePhaseValidator(group: FormGroup): { [key: string]: any } | null {
        const endDate = group.get('endDate')?.value;
        if (!endDate) return null;

        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);

        const phaseStart = this.data.phase?.startDate ? new Date(this.data.phase.startDate) : null;
        if (phaseStart) phaseStart.setHours(0, 0, 0, 0);

        const phaseEnd = this.data.phase?.endDate ? new Date(this.data.phase.endDate) : null;
        if (phaseEnd) phaseEnd.setHours(0, 0, 0, 0);

        if (phaseEnd && end > phaseEnd) {
            return { endDateAfterPhaseEnd: { requiredBefore: this.formatDate(phaseEnd) } };
        }

        if (phaseStart && end < phaseStart) {
            return { endDateBeforePhaseStart: { requiredAfter: this.formatDate(phaseStart) } };
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

    loadTaskCategories(): void {
        this.taskCategoryService.getAllTaskCategories().subscribe({
            next: (categories) => {
                this.taskCategories = categories;
            },
            error: (error) => {
                this.snackBar.open('Impossible de charger les catégories', 'Fermer', { duration: 3000 });
                console.error('Erreur lors du chargement des catégories :', error);
            }
        });
    }

    onSubmit(): void {
        this.markFormGroupTouched(this.taskForm);

        if (this.taskForm.invalid) {
            this.snackBar.open('Veuillez corriger les erreurs dans le formulaire', 'Fermer', { duration: 3000 });
            return;
        }

        this.submitting = true;
        const taskData = this.prepareTaskData();

        this.taskService.createTask(taskData, this.selectedFile || undefined).subscribe({
            next: () => {
                this.submitting = false;
                this.dialogRef.close(true);
                this.snackBar.open('Tâche créée avec succès', 'Fermer', { duration: 3000 });
            },
            error: (error) => {
                this.error = 'Impossible de créer la tâche. Veuillez réessayer plus tard.';
                this.submitting = false;
                console.error('Erreur lors de la création de la tâche :', error);
                this.snackBar.open('Impossible de créer la tâche', 'Fermer', { duration: 3000 });
            }
        });
    }

    prepareTaskData(): Task {
        const formValues = this.taskForm.value;

        return {
            title: formValues.title,
            xpPoint: formValues.xpPoint,
            description: formValues.description,
            assigneeId: formValues.assigneeId,
            startDate: formValues.startDate,
            endDate: formValues.endDate,
            priority: formValues.priority,
            taskCategory: { id: formValues.taskCategory },
            status: Status.TO_DO,
            phase: {
                phaseId: formValues.phase.phaseId
            }
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

    onCancel(): void {
        this.dialogRef.close(false);
    }

    onStartDateChange(event: Event): void {
        this.taskForm.get('endDate')?.updateValueAndValidity();
        this.taskForm.updateValueAndValidity();
    }

    onEndDateChange(event: Event): void {
        this.taskForm.updateValueAndValidity();
    }

    addAttachment(): void {
        this.fileInput.nativeElement.click();
    }

    onFileSelected(event: any): void {
        const files: FileList = event.target.files;
        if (files && files.length > 0) {
            this.selectedFile = files[0];
            this.snackBar.open(`Fichier sélectionné : ${this.selectedFile.name}`, 'Fermer', { duration: 3000 });
        }
        if (this.fileInput && this.fileInput.nativeElement) {
            this.fileInput.nativeElement.value = '';
        }
    }

    removeAttachment(): void {
        this.selectedFile = null;
        this.snackBar.open('Pièce jointe supprimée', 'Fermer', { duration: 3000 });
    }

    getTranslatedPriority(priority: Priority): string {
        return PriorityTranslation[priority] || priority;
    }

    private formatDate(date: Date): string {
        if (!date || isNaN(date.getTime())) return '';
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
}