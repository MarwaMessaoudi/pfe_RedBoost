import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar'; // Added for error feedback
import { TaskCategoryActivity } from '../../../../../models/TaskActivity.modal';
import { TaskCategoryActivityService } from '../../../service/TaskCategorieActivityService';

@Component({
    selector: 'app-task-category-activity-form', // Updated selector
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule],
    template: `
        <h2 mat-dialog-title>Créer une nouvelle catégorie d'activité</h2>
        <mat-dialog-content>
            <mat-form-field appearance="fill">
                <mat-label>Nom de la catégorie d'activité</mat-label>
                <input matInput [(ngModel)]="categoryActivity.name" required />
            </mat-form-field>
        </mat-dialog-content>
        <mat-dialog-actions>
            <button mat-button (click)="onCancel()">Annuler</button>
            <button mat-button color="primary" (click)="onSave()" [disabled]="!categoryActivity.name">Sauvegarder</button>
        </mat-dialog-actions>
    `,
    styles: [] // Add styles if needed
})
export class TaskCategoryActivityFormComponent {
    categoryActivity: TaskCategoryActivity = { name: '' }; // Updated to TaskCategoryActivity

    constructor(
        public dialogRef: MatDialogRef<TaskCategoryActivityFormComponent>, // Updated type
        @Inject(MAT_DIALOG_DATA) public data: any,
        private taskCategoryActivityService: TaskCategoryActivityService, // Updated service name
        private snackBar: MatSnackBar // Added for error feedback
    ) {}

    onCancel(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        const categoryActivityToSave = { name: this.categoryActivity.name }; // Updated variable name
        this.taskCategoryActivityService.createTaskCategoryActivity(categoryActivityToSave).subscribe({
            next: (result) => {
                this.dialogRef.close(result);
                this.snackBar.open("Catégorie d'activité créée avec succès", 'Fermer', { duration: 3000 });
            },
            error: (err) => {
                console.error('Failed to create category activity:', err);
                const errorMessage = err.error?.message || "Erreur lors de la création de la catégorie d'activité";
                this.snackBar.open(errorMessage, 'Fermer', { duration: 3000 });
                this.dialogRef.close();
            }
        });
    }
}
