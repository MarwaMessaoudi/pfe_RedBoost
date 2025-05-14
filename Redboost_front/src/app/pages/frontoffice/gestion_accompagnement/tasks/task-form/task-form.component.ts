import { Component, Inject, OnInit, ViewEncapsulation, ElementRef, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule, DatePipe } from '@angular/common'; // Import DatePipe
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TaskService } from '../../../service/task.service';
// PhaseService import is not used in the component logic provided, can be removed
// import { PhaseService } from '../../../service/phase.service';
import { TaskCategoryService } from '../../../service/taskCategory.service';
import { Task, Priority, Status, TaskCategory, PriorityTranslation } from '../../../../../models/task';
import { Phase } from '../../../../../models/phase';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { User } from '../../../../../models/user';

interface DialogData {
    phaseId: number;
    taskId?: number;
    task?: Task; // Include original task data for editing
    isEdit: boolean;
    entrepreneurs: User[];
    phase?: Phase; // Phase data including start/end dates
}

@Component({
    selector: 'app-task-form',
    standalone: true,
    // Add DatePipe to imports
    imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatSnackBarModule, DatePipe],
    templateUrl: './task-form.component.html',
    styleUrls: ['./task-form.component.scss'],
    encapsulation: ViewEncapsulation.ShadowDom,
    // *** ADD DatePipe TO PROVIDERS ***
    providers: [DatePipe]
})
export class TaskFormComponent implements OnInit {
    taskForm!: FormGroup;
    taskId: number | null = null;
    isEditMode = false;
    loading = false;
    submitting = false;
    error = '';
    priorityOptions = Object.values(Priority);
    // statusOptions = Object.values(Status); // Status is not a form control in template?
    // phases: Phase[] = []; // This is not used in the template select, can be removed
    taskCategories: TaskCategory[] = [];
    phaseId: number | null = null;
    @ViewChild('fileInput') fileInput!: ElementRef;
    selectedFile: File | null = null;

    // Date constraints derived from phase and today
    effectiveMinStartDate: string = ''; // The actual minimum date a task can start (max of today and phase start)
    phaseStartDate: string = ''; // Formatted phase start date for validation/display
    phaseEndDate: string = ''; // Formatted phase end date for validation/display

    constructor(
        private fb: FormBuilder,
        private taskService: TaskService,
        // private phaseService: PhaseService, // This service is not used within this component
        private taskCategoryService: TaskCategoryService,
        private snackBar: MatSnackBar,
        public dialogRef: MatDialogRef<TaskFormComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private datePipe: DatePipe // Inject DatePipe
    ) {
        this.isEditMode = this.data.isEdit;
        this.phaseId = this.data.phaseId;
        this.taskId = this.data.taskId ?? null;

        // Date calculations moved to ngOnInit to ensure data.phase is available
        // and to use the injected DatePipe safely.
    }

    ngOnInit(): void {
        // Calculate date constraints based on phase data and today
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of the day

        const phaseStart = this.data.phase?.startDate ? new Date(this.data.phase.startDate) : null;
        if (phaseStart) phaseStart.setHours(0, 0, 0, 0);

        const phaseEnd = this.data.phase?.endDate ? new Date(this.data.phase.endDate) : null;
        if (phaseEnd) phaseEnd.setHours(0, 0, 0, 0);

        // Effective minimum start date: must be >= max(today, phaseStart)
        let earliestAllowedStart = today;
        if (phaseStart && phaseStart > today) {
            earliestAllowedStart = phaseStart;
        }

        this.effectiveMinStartDate = this.formatDate(earliestAllowedStart);
        this.phaseStartDate = phaseStart ? this.formatDate(phaseStart) : ''; // Store formatted phase start
        this.phaseEndDate = phaseEnd ? this.formatDate(phaseEnd) : ''; // Store formatted phase end

        this.initForm();
        // Removed loadPhases as it is unused
        // this.loadPhases();
        this.loadTaskCategories();

        if (this.isEditMode && this.taskId) {
            this.loadTask(this.taskId);
        } else if (this.phaseId) {
            this.taskForm.patchValue({ phase: { phaseId: this.phaseId } });
            // For new tasks, pre-fill start date with the earliest allowed date
            this.taskForm.patchValue({
                startDate: this.effectiveMinStartDate
            });
        }
    }

    initForm(): void {
        this.taskForm = this.fb.group(
            {
                title: ['', [Validators.required]],
                xpPoint: [0, [Validators.required, Validators.min(0)]],
                description: [''],
                assigneeId: [null, [Validators.required]],
                // Initial date values will be patched in ngOnInit or loadTask
                startDate: ['', [Validators.required]],
                endDate: ['', [Validators.required]],
                priority: [Priority.MEDIUM, [Validators.required]],
                taskCategory: [null, [Validators.required]],
                // Status is not a form control in the template, leave it out here
                // status: [Status.TO_DO], // Default status for new tasks handled in prepareTaskData
                phase: this.fb.group({
                    phaseId: [this.phaseId, [Validators.required]]
                })
            },
            {
                // Group-level validators
                validators: [
                    this.dateRangeValidator.bind(this), // Checks Task Start <= Task End
                    this.startDatePhaseValidator.bind(this), // Checks Task Start vs Today/Phase
                    this.endDatePhaseValidator.bind(this) // Checks Task End vs Phase
                ]
            }
        );
    }

    // Validator 1: Ensures Task Start Date is within Phase Dates and after Today
    // Rules: startDate >= max(today, phaseStart) AND startDate <= phaseEnd
    startDatePhaseValidator(group: FormGroup): { [key: string]: any } | null {
        const startDate = group.get('startDate')?.value;
        if (!startDate) return null; // Don't validate if start date is not entered yet

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0); // Normalize to start of day for accurate comparison

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const phaseStart = this.data.phase?.startDate ? new Date(this.data.phase.startDate) : null;
        if (phaseStart) phaseStart.setHours(0, 0, 0, 0);

        const phaseEnd = this.data.phase?.endDate ? new Date(this.data.phase.endDate) : null;
        if (phaseEnd) phaseEnd.setHours(0, 0, 0, 0);

        // Check 1: Start date is not before the earliest allowed date (max of today and phase start)
        let earliestAllowedStart = today;
        if (phaseStart && phaseStart > today) {
            earliestAllowedStart = phaseStart;
        }
        if (start < earliestAllowedStart) {
            // Error key 'invalidStartDateEarly' is used in the template
            // Include the required date in the error object to display it in the template
            return { invalidStartDateEarly: { requiredAfter: this.formatDate(earliestAllowedStart) } };
        }

        // Check 2: Start date is not after phase end (if phase end exists)
        if (phaseEnd && start > phaseEnd) {
            // Error key 'startDateAfterPhaseEnd' is used in the template
            // Include the required date in the error object
            return { startDateAfterPhaseEnd: { requiredBefore: this.formatDate(phaseEnd) } };
        }

        return null; // Valid
    }

    // Validator 2: Ensures Task End Date is within Phase Dates
    // Rules: endDate >= phaseStart AND endDate <= phaseEnd
    endDatePhaseValidator(group: FormGroup): { [key: string]: any } | null {
        const endDate = group.get('endDate')?.value;
        // Also need startDate to check range constraint, but that's handled by dateRangeValidator
        const startDate = group.get('startDate')?.value; // Needed for cross-validation consistency, though dateRangeValidator does the check
        if (!endDate) return null; // Don't validate if end date is not entered yet

        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0); // Normalize to start of day

        const phaseStart = this.data.phase?.startDate ? new Date(this.data.phase.startDate) : null;
        if (phaseStart) phaseStart.setHours(0, 0, 0, 0);

        const phaseEnd = this.data.phase?.endDate ? new Date(this.data.phase.endDate) : null;
        if (phaseEnd) phaseEnd.setHours(0, 0, 0, 0);

        // Check 1: End date is not after phase end (if phase end exists)
        if (phaseEnd && end > phaseEnd) {
            // Error key 'endDateAfterPhaseEnd' is used in the template
            // Include the required date in the error object
            return { endDateAfterPhaseEnd: { requiredBefore: this.formatDate(phaseEnd) } };
        }

        // Check 2: End date is not before phase start (if phase start exists)
        if (phaseStart && end < phaseStart) {
            // Error key 'endDateBeforePhaseStart' is used in the template
            // Include the required date in the error object
            return { endDateBeforePhaseStart: { requiredAfter: this.formatDate(phaseStart) } };
        }

        return null; // Valid
    }

    // Validator 3: Ensures Task End Date is on or after Task Start Date
    // Rule: startDate <= endDate
    dateRangeValidator(group: FormGroup): { [key: string]: any } | null {
        const startDate = group.get('startDate')?.value;
        const endDate = group.get('endDate')?.value;

        // Only validate if both dates are present
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            // Normalize to start of day for comparison
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            if (start > end) {
                // Error key 'dateRangeInvalid' is used in the template
                return { dateRangeInvalid: true };
            }
        }
        return null;
    }

    // loadPhases is not used in this component, remove it
    // loadPhases(): void { ... }

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

    loadTask(id: number): void {
        this.loading = true;
        this.taskService.getTaskById(id).subscribe({
            next: (task) => {
                this.patchForm(task);
                this.loading = false;
            },
            error: (error) => {
                this.error = 'Impossible de charger la tâche. Veuillez réessayer plus tard.';
                this.loading = false;
                console.error('Erreur lors du chargement de la tâche :', error);
                this.snackBar.open('Impossible de charger les détails de la tâche', 'Fermer', { duration: 3000 });
            }
        });
    }

    patchForm(task: Task): void {
        this.taskForm.patchValue({
            title: task.title,
            xpPoint: task.xpPoint,
            description: task.description,
            assigneeId: task.assigneeId,
            // Ensure dates are formatted correctly (YYYY-MM-DD) for the input[type=date]
            startDate: task.startDate ? this.formatDate(new Date(task.startDate)) : '',
            endDate: task.endDate ? this.formatDate(new Date(task.endDate)) : '',
            priority: task.priority,
            // Patch taskCategory using the ID
            taskCategory: task.taskCategory?.id || null,
            // Status is not a form control in the template, no need to patch it here
            // status: task.status,
            phase: {
                phaseId: task.phase.phaseId
            }
        });
        // After patching, trigger validation to show any potential errors based on current phase dates
        this.taskForm.updateValueAndValidity();
    }

    onSubmit(): void {
        // Mark all controls as touched to display validation errors
        this.markFormGroupTouched(this.taskForm);

        // Check form validity, including group-level validators
        if (this.taskForm.invalid) {
            // Optional: Log errors for debugging
            // console.log('Form is invalid:', this.taskForm.errors);
            // Object.keys(this.taskForm.controls).forEach(key => {
            //     const controlErrors = this.taskForm.get(key)?.errors;
            //     if (controlErrors != null) {
            //          console.log('Control ' + key + ' has errors:', controlErrors);
            //     }
            // });
            // const groupErrors = this.taskForm.errors;
            // if (groupErrors != null) {
            //      console.log('Form group errors:', groupErrors);
            // }
            this.snackBar.open('Veuillez corriger les erreurs dans le formulaire', 'Fermer', { duration: 3000 });
            return;
        }

        this.submitting = true;
        const taskData = this.prepareTaskData();

        if (this.isEditMode && this.taskId) {
            this.taskService.updateTask(this.taskId, taskData).subscribe({
                next: () => {
                    this.submitting = false;
                    this.dialogRef.close(true); // Close and indicate success
                    this.snackBar.open('Tâche mise à jour avec succès', 'Fermer', { duration: 3000 });
                },
                error: (error) => {
                    this.error = 'Impossible de mettre à jour la tâche. Veuillez réessayer plus tard.';
                    this.submitting = false;
                    console.error('Erreur lors de la mise à jour de la tâche :', error);
                    this.snackBar.open('Impossible de mettre à jour la tâche', 'Fermer', { duration: 3000 });
                }
            });
        } else {
            this.taskService.createTask(taskData, this.selectedFile || undefined).subscribe({
                next: () => {
                    this.submitting = false;
                    this.dialogRef.close(true); // Close and indicate success
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
    }

    prepareTaskData(): Task {
        const formValues = this.taskForm.value;

        return {
            ...(this.isEditMode && this.taskId ? { taskId: this.taskId } : {}),
            title: formValues.title,
            xpPoint: formValues.xpPoint,
            description: formValues.description,
            assigneeId: formValues.assigneeId,
            // Dates are already in YYYY-MM-DD format from the input controls
            startDate: formValues.startDate,
            endDate: formValues.endDate,
            priority: formValues.priority,
            taskCategory: { id: formValues.taskCategory }, // taskCategory should hold the ID from the select
            // Status is not editable in this form.
            // For new tasks, default to TO_DO.
            // For edited tasks, preserve the original task's status.
            // Access data.task to get the original status in edit mode.
            status: this.isEditMode && this.data.task ? this.data.task.status : Status.TO_DO,
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
                // Mark control as touched and trigger its own validation (if any)
                control?.markAsTouched();
                control?.updateValueAndValidity({ onlySelf: true, emitEvent: true });
            }
        });
        // After marking all controls, update validity of the group to trigger group validators
        formGroup.updateValueAndValidity({ onlySelf: false, emitEvent: true }); // Use onlySelf: false to propagate validation status up
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    // Trigger validation for the end date whenever the start date changes
    onStartDateChange(event: Event): void {
        // The group validators will run automatically when startDate changes.
        // Explicitly updating endDate's validity ensures dateRangeValidator runs
        // against the newly selected startDate without needing to touch the endDate field.
        this.taskForm.get('endDate')?.updateValueAndValidity();
        // Also update form group validity to trigger phase validators immediately
        this.taskForm.updateValueAndValidity();
    }

    // Also trigger validation for the form group whenever the end date changes
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
        // Clear the input value so the same file can be selected again if needed
        if (this.fileInput && this.fileInput.nativeElement) {
            this.fileInput.nativeElement.value = '';
        }
    }

    removeAttachment(): void {
        this.selectedFile = null;
        this.snackBar.open('Pièce jointe supprimée', 'Fermer', { duration: 3000 });
    }

    getTranslatedPriority(priority: Priority): string {
        // Assuming PriorityTranslation maps Priority enum values to strings
        return PriorityTranslation[priority] || priority;
    }

    // Helper to format Date object to 'YYYY-MM-DD' string required by input[type=date] [min]/[max]
    private formatDate(date: Date): string {
        if (!date || isNaN(date.getTime())) return ''; // Handle invalid dates
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    // The DatePipe is used directly in the template for displaying dates in error messages
}
