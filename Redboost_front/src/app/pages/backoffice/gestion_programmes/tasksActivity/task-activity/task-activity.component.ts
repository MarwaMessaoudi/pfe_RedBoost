import { Component, Inject, OnInit, ViewEncapsulation, ElementRef, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TaskActivityService } from '../../../service/taskActivity'; // Adjusted service path
import { TaskActivity, PriorityActivity, StatusActivity, TaskCategoryActivity } from '../../../../../models/TaskActivity.modal'; // Adjusted model path
import { User } from '../../../../../models/user';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { UserService } from '../../../../frontoffice/service/UserService';
import { TaskCategoryActivityService } from '../../../service/TaskCategorieActivityService';

interface DialogData {
    activityId: number;
    taskActivityId?: number; // Optional for create mode
    taskActivity?: TaskActivity; // Optional for edit mode
    isEdit: boolean;
    users?: User[]; // Optional, as we'll fetch users dynamically
    activity?: any; // Optional activity context if needed
}

@Component({
    selector: 'app-task-activity-form',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatProgressBarModule,
        MatTooltipModule,
        MatSnackBarModule,
        MatDialogModule,
        MatListModule,
        MatCardModule
    ],
    templateUrl: './task-activity.component.html',
    styleUrls: ['./task-activity.component.scss'],
    encapsulation: ViewEncapsulation.ShadowDom
})
export class TaskActivityComponent implements OnInit {
    taskActivityForm!: FormGroup;
    taskActivityId: number | null = null;
    isEditMode = false;
    loading = false;
    submitting = false;
    error = '';
    priorityOptions = Object.values(PriorityActivity);
    taskCategoryActivities: TaskCategoryActivity[] = [];
    users: User[] = [];
    activityId: number | null = null;
    @ViewChild('fileInput') fileInput!: ElementRef;

    // Minimum date (today)
    minStartDate: Date = new Date();

    constructor(
        private fb: FormBuilder,
        private taskActivityService: TaskActivityService,
        private taskCategoryActivityService: TaskCategoryActivityService,
        private userService: UserService, // Added UserService
        private route: ActivatedRoute,
        private router: Router,
        private snackBar: MatSnackBar,
        public dialogRef: MatDialogRef<TaskActivityComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData
    ) {}

    ngOnInit(): void {
        this.initForm();
        this.loadTaskCategoryActivities();
        this.loadUsers();

        this.isEditMode = this.data.isEdit;
        this.activityId = this.data.activityId;
        this.taskActivityId = this.data.taskActivityId ?? null;

        if (this.isEditMode && this.taskActivityId) {
            this.loadTaskActivity(this.taskActivityId);
        } else if (this.activityId) {
            this.taskActivityForm.patchValue({ activity: { id: this.activityId } });
        }

        // Add listener to update end date filter when start date changes
        this.taskActivityForm.get('startDate')?.valueChanges.subscribe(() => {
            this.taskActivityForm.get('endDate')?.updateValueAndValidity();
        });
    }

    initForm(): void {
        this.taskActivityForm = this.fb.group({
            title: ['', [Validators.required]],
            xpPoint: [0, [Validators.required, Validators.min(0)]],
            description: [''],
            assigneeId: [null, [Validators.required]],
            startDate: ['', [Validators.required]],
            endDate: ['', [Validators.required]],
            priorityActivity: [PriorityActivity.ACTIVITY_MEDIUM, [Validators.required]],
            taskCategoryActivity: [null, [Validators.required]],
            statusActivity: [StatusActivity.TO_DO],
            activity: this.fb.group({
                id: [null, [Validators.required]]
            }),
            attachments: this.fb.array([])
        });
    }

    // Date filters (no phase constraints, just start/end logic)
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

    loadUsers(): void {
        console.log('Loading users with roles ADMIN, SUPERADMIN, EMPLOYEE');
        this.userService.getUsers().subscribe({
            next: (users) => {
                this.users = users;
                console.log('Users loaded:', this.users);
            },
            error: (error) => {
                this.snackBar.open('Impossible de charger les utilisateurs', 'Fermer', { duration: 3000 });
                console.error('Erreur lors du chargement des utilisateurs :', error);
            }
        });
    }

    loadTaskCategoryActivities(): void {
        this.taskCategoryActivityService.getAllTaskCategoryActivities().subscribe({
            next: (categories) => {
                this.taskCategoryActivities = categories;
            },
            error: (error) => {
                this.snackBar.open('Impossible de charger les catégories', 'Fermer', { duration: 3000 });
                console.error('Erreur lors du chargement des catégories :', error);
            }
        });
    }

    loadTaskActivity(id: number): void {
        this.loading = true;
        this.taskActivityService.getTaskActivityById(id).subscribe({
            next: (taskActivity) => {
                this.patchForm(taskActivity);
                this.loading = false;
            },
            error: (error) => {
                this.error = "Impossible de charger la tâche d'activité. Veuillez réessayer plus tard.";
                this.loading = false;
                console.error("Erreur lors du chargement de la tâche d'activité :", error);
                this.snackBar.open('Impossible de charger les détails de la tâche', 'Fermer', { duration: 3000 });
            }
        });
    }

    patchForm(taskActivity: TaskActivity): void {
        this.taskActivityForm.patchValue({
            title: taskActivity.title,
            xpPoint: taskActivity.xpPoint,
            description: taskActivity.description,
            assigneeId: taskActivity.assigneeId,
            startDate: taskActivity.startDate ? new Date(taskActivity.startDate) : null,
            endDate: taskActivity.endDate ? new Date(taskActivity.endDate) : null,
            priorityActivity: taskActivity.priorityActivity,
            taskCategoryActivity: taskActivity.taskCategoryActivity?.id || null,
            statusActivity: taskActivity.statusActivity,
            activity: {
                id: taskActivity.activity?.id || this.activityId
            }
        });
        if (taskActivity.attachments && taskActivity.attachments.length > 0) {
            const attachmentsFormArray = this.fb.array(taskActivity.attachments.map((att) => this.fb.control(att.name)));
            this.taskActivityForm.setControl('attachments', attachmentsFormArray);
        }
    }

    onSubmit(): void {
        if (this.taskActivityForm.invalid) {
            this.markFormGroupTouched(this.taskActivityForm);
            this.snackBar.open('Veuillez remplir tous les champs obligatoires', 'Fermer', { duration: 3000 });
            return;
        }

        this.submitting = true;
        const taskActivityData = this.prepareTaskActivityData();

        if (this.isEditMode && this.taskActivityId) {
            this.taskActivityService.updateTaskActivity(this.taskActivityId, taskActivityData).subscribe({
                next: () => {
                    this.submitting = false;
                    this.dialogRef.close(true);
                    this.snackBar.open("Tâche d'activité mise à jour avec succès", 'Fermer', { duration: 3000 });
                },
                error: (error) => {
                    this.error = "Impossible de mettre à jour la tâche d'activité. Veuillez réessayer plus tard.";
                    this.submitting = false;
                    console.error("Erreur lors de la mise à jour de la tâche d'activité :", error);
                    this.snackBar.open('Impossible de mettre à jour la tâche', 'Fermer', { duration: 3000 });
                }
            });
        } else {
            this.taskActivityService.createTaskActivity(taskActivityData).subscribe({
                next: () => {
                    this.submitting = false;
                    this.dialogRef.close(true);
                    this.snackBar.open("Tâche d'activité créée avec succès", 'Fermer', { duration: 3000 });
                },
                error: (error) => {
                    this.error = "Impossible de créer la tâche d'activité. Veuillez réessayer plus tard.";
                    this.submitting = false;
                    console.error("Erreur lors de la création de la tâche d'activité :", error);
                    this.snackBar.open('Impossible de créer la tâche', 'Fermer', { duration: 3000 });
                }
            });
        }
    }

    prepareTaskActivityData(): TaskActivity {
        const formValues = this.taskActivityForm.value;

        // Normalize dates to YYYY-MM-DD using local time
        const startDate = new Date(formValues.startDate);
        const endDate = new Date(formValues.endDate);
        const normalizedStartDate = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
        const normalizedEndDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

        return {
            ...(this.isEditMode && this.taskActivityId ? { taskActivityId: this.taskActivityId } : {}),
            title: formValues.title,
            xpPoint: formValues.xpPoint,
            description: formValues.description,
            assigneeId: formValues.assigneeId,
            startDate: normalizedStartDate,
            endDate: normalizedEndDate,
            priorityActivity: formValues.priorityActivity,
            taskCategoryActivity: { id: formValues.taskCategoryActivity },
            statusActivity: StatusActivity.TO_DO,
            activity: {
                id: formValues.activity.id
            },
            attachments: formValues.attachments || []
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

    getErrorMessage(controlName: string): string {
        const control = this.taskActivityForm.get(controlName);
        if (control?.hasError('required')) {
            return 'Ce champ est obligatoire';
        }
        if (control?.hasError('min')) {
            return 'La valeur doit être supérieure ou égale à 0';
        }
        return '';
    }

    // Attachment handling
    removeAttachment(index: number): void {
        const attachments = this.taskActivityForm.get('attachments') as FormArray;
        attachments.removeAt(index);
    }

    get attachmentControls(): FormArray {
        return this.taskActivityForm.get('attachments') as FormArray;
    }

    addAttachment(): void {
        this.fileInput.nativeElement.click();
    }

    onFileSelected(event: any): void {
        const files: FileList = event.target.files;
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                (this.taskActivityForm.get('attachments') as FormArray).push(this.fb.control(file.name));
            }
        }
        this.fileInput.nativeElement.value = '';
    }
}
