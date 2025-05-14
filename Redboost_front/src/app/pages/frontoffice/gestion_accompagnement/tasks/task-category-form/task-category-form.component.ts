import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { TaskCategoryService } from '../../../service/taskCategory.service';
import { TaskCategory } from '../../../../../models/task';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-task-category-form',
    standalone: true,
    imports: [CommonModule, MatDialogModule, FormsModule],
    template: `
        <div class="modal-overlay">
            <div class="modal-box">
                <button class="close-icon" (click)="onCancel()">
                    <i class="fas fa-times"></i>
                </button>
                <h2 class="modal-title"><i class="fas fa-plus-circle"></i> Créer une nouvelle catégorie</h2>
                <form class="activity-form" (ngSubmit)="onSave()">
                    <div class="form-group">
                        <label for="category-name">Nom de la catégorie</label>
                        <input id="category-name" [(ngModel)]="category.name" name="category-name" required placeholder="Entrez le nom de la catégorie" />
                        <div class="error-msg" *ngIf="!category.name && submitted">Le nom de la catégorie est requis</div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-cancel" (click)="onCancel()">Annuler</button>
                        <button type="submit" class="btn-send" [disabled]="!category.name">Sauvegarder</button>
                    </div>
                </form>
            </div>
        </div>
    `,
    styles: [
        `
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

            /* Color Palette */
            $primary: #c8223a; // Vibrant red
            $secondary: #034a55; // Deep teal
            $gradient: linear-gradient(to right, #c8223a, #034a55);
            $light-red: #e57373; // Lighter red for hover/backgrounds
            $light-teal: #4a8a99; // Lighter teal for accents
            $background: #f8fafc; // Soft off-white
            $text: #1a202c; // Dark gray for text
            $border: #e2e8f0; // Light gray for borders
            $error: #d32f2f; // Error red
            $shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

            /* Animations */
            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            @keyframes slideIn {
                from {
                    transform: translateY(-30px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            /* Override Material Dialog Container */
            :host ::ng-deep .mat-dialog-container {
                background: none !important;
                padding: 0 !important;
                box-shadow: none !important;
                overflow: visible !important;
            }

            /* Modal Overlay */
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                animation: fadeIn 0.3s ease-in-out;
                padding: 1rem;
            }

            /* Modal Box */
            .modal-box {
                background: #fff;
                padding: 2rem;
                width: 100%;
                max-width: 500px;
                min-width: 300px;
                max-height: 80vh;
                overflow-y: auto;
                border-radius: 12px;
                box-shadow: $shadow;
                position: relative;
                animation: slideIn 0.4s ease;
                border: 1px solid $border;
                font-family: 'Poppins', sans-serif;
                margin: 1rem auto;
                scrollbar-width: thin;
                scrollbar-color: $border $background;
                &::-webkit-scrollbar {
                    width: 8px;
                }
                &::-webkit-scrollbar-track {
                    background: $background;
                    border-radius: 8px;
                    margin: 4px 0;
                }
                &::-webkit-scrollbar-thumb {
                    background: $border;
                    border-radius: 8px;
                    border: 1px solid $background;
                    &:hover {
                        background: $light-red;
                    }
                }
            }

            /* Close Icon */
            .close-icon {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: none;
                border: none;
                font-size: 1.25rem;
                cursor: pointer;
                color: #718096;
                transition: color 0.2s ease;
                &:hover {
                    color: $primary;
                }
            }

            /* Modal Title */
            .modal-title {
                font-size: 1.5rem;
                font-weight: 600;
                color: $text;
                margin-bottom: 1.5rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                i {
                    color: $primary;
                }
            }

            /* Form Styling */
            .activity-form {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;

                .form-group {
                    display: flex;
                    flex-direction: column;
                    label {
                        font-weight: 500;
                        color: $text;
                        font-size: 0.9rem;
                        margin-bottom: 0.5rem;
                    }
                    input {
                        padding: 0.75rem;
                        border: 1px solid $border;
                        border-radius: 8px;
                        font-size: 0.9rem;
                        font-family: 'Poppins', sans-serif;
                        transition:
                            border-color 0.2s ease,
                            box-shadow 0.2s ease;
                        &:focus {
                            border-color: $primary;
                            box-shadow: 0 0 0 3px rgba(#c8223a, 0.1);
                            outline: none;
                        }
                    }
                    .error-msg {
                        color: $error;
                        font-size: 0.8rem;
                        margin-top: 0.25rem;
                    }
                }

                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    margin-top: 1rem;

                    .btn-cancel {
                        background: $border;
                        color: $text;
                        border: none;
                        border-radius: 8px;
                        padding: 0.75rem 1.5rem;
                        font-weight: 500;
                        font-family: 'Poppins', sans-serif;
                        cursor: pointer;
                        transition: background 0.2s ease;
                        &:hover {
                            background: $light-red;
                        }
                    }

                    .btn-send {
                        background: $gradient;
                        color: #fff;
                        border: none;
                        border-radius: 8px;
                        padding: 0.75rem 1.5rem;
                        font-weight: 600;
                        font-family: 'Poppins', sans-serif;
                        cursor: pointer;
                        transition:
                            transform 0.2s ease,
                            box-shadow 0.2s ease;
                        box-shadow: 0 2px 8px rgba(#c8223a, 0.3);
                        &:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 4px 12px rgba(#c8223a, 0.4);
                        }
                        &:disabled {
                            background: #cbd5e0;
                            cursor: not-allowed;
                            transform: none;
                            box-shadow: none;
                        }
                    }
                }
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                .modal-overlay {
                    padding: 0.75rem;
                }

                .modal-box {
                    max-width: 450px;
                    padding: 1.5rem;
                    max-height: 75vh;
                    margin: 0.75rem auto;
                    min-width: 280px;
                }

                .modal-title {
                    font-size: 1.375rem;
                    margin-bottom: 1.25rem;
                }

                .close-icon {
                    top: 0.75rem;
                    right: 0.75rem;
                    font-size: 1.125rem;
                }

                .activity-form {
                    gap: 1.25rem;

                    .form-group {
                        label {
                            font-size: 0.85rem;
                            margin-bottom: 0.4rem;
                        }
                        input {
                            padding: 0.65rem;
                            font-size: 0.85rem;
                        }
                        .error-msg {
                            font-size: 0.75rem;
                        }
                    }

                    .modal-actions {
                        gap: 0.75rem;
                        margin-top: 0.75rem;

                        .btn-cancel,
                        .btn-send {
                            padding: 0.65rem 1.25rem;
                            font-size: 0.9rem;
                        }
                    }
                }
            }

            @media (max-width: 480px) {
                .modal-overlay {
                    padding: 0.5rem;
                }

                .modal-box {
                    max-width: 100%;
                    padding: 1rem;
                    max-height: 70vh;
                    margin: 0.5rem auto;
                    min-width: 0;
                    border-radius: 8px;
                }

                .modal-title {
                    font-size: 1.25rem;
                    margin-bottom: 1rem;
                }

                .close-icon {
                    top: 0.5rem;
                    right: 0.5rem;
                    font-size: 1rem;
                }

                .activity-form {
                    gap: 1rem;

                    .form-group {
                        label {
                            font-size: 0.8rem;
                            margin-bottom: 0.3rem;
                        }
                        input {
                            padding: 0.5rem;
                            font-size: 0.8rem;
                        }
                        .error-msg {
                            font-size: 0.7rem;
                            margin-top: 0.15rem;
                        }
                    }

                    .modal-actions {
                        flex-direction: column;
                        gap: 0.5rem;

                        .btn-cancel,
                        .btn-send {
                            width: 100%;
                            padding: 0.5rem;
                            font-size: 0.85rem;
                        }
                    }
                }
            }
        `
    ]
})
export class TaskCategoryFormComponent {
    category: TaskCategory = { name: '' };
    submitted: boolean = false; // Added to track form submission for validation

    constructor(
        public dialogRef: MatDialogRef<TaskCategoryFormComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private taskCategoryService: TaskCategoryService,
        private snackBar: MatSnackBar
    ) {}

    onCancel(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        this.submitted = true; // Mark form as submitted for validation
        if (!this.category.name) {
            return; // Prevent saving if validation fails
        }
        const categoryToSave = { name: this.category.name };
        this.taskCategoryService.createTaskCategory(categoryToSave).subscribe({
            next: (result) => {
                this.dialogRef.close(result);
                this.snackBar.open('Catégorie créée avec succès', 'Fermer', { duration: 3000 });
            },
            error: (err) => {
                console.error('Failed to create category:', err);
                const errorMessage = err.error?.message || 'Erreur lors de la création de la catégorie';
                this.snackBar.open(errorMessage, 'Fermer', { duration: 3000 });
                this.dialogRef.close();
            }
        });
    }
}
