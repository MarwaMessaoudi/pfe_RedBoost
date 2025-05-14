import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PhaseService } from '../../../service/phase.service';
import { Phase, PhaseStatus } from '../../../../../models/phase';
import { MatDialogModule } from '@angular/material/dialog';

interface DialogData {
    phase?: Phase;
    isEdit: boolean;
    projectId?: number;
}

@Component({
    selector: 'app-phase-form',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule],
    templateUrl: './phase-form.component.html',
    styleUrls: ['./phase-form.component.scss'],
    encapsulation: ViewEncapsulation.ShadowDom
})
export class PhaseFormComponent implements OnInit {
    phaseForm!: FormGroup;
    isEditMode: boolean;
    submitting = false;
    error = '';
    minDate: string;
    minStartDate: string;
    phaseStatusOptions = Object.values(PhaseStatus);
    projectId: number | null = null;

    constructor(
        private fb: FormBuilder,
        private phaseService: PhaseService,
        public dialogRef: MatDialogRef<PhaseFormComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData
    ) {
        this.isEditMode = data.isEdit;
        this.projectId = data.projectId || null;
        const today = new Date();
        this.minDate = this.formatDate(today);
        this.minStartDate = this.minDate;
    }

    ngOnInit(): void {
        this.initForm();
        if (this.data.phase) {
            this.loadPhase(this.data.phase);
        } else if (this.projectId) {
            this.phaseForm.patchValue({ projetId: this.projectId });
        }
    }

    initForm(): void {
        this.phaseForm = this.fb.group(
            {
                phaseName: ['', [Validators.required, Validators.maxLength(100)]],
                startDate: ['', Validators.required],
                endDate: ['', Validators.required],
                description: [''],
                projetId: [this.projectId, [Validators.required, Validators.min(1)]],
                status: [PhaseStatus.NOT_STARTED]
            },
            {
                validators: [this.dateRangeValidator.bind(this), this.startDateValidator.bind(this)]
            }
        );
    }

    loadPhase(phase: Phase): void {
        const startDate = phase.startDate ? this.formatDate(new Date(phase.startDate)) : '';
        const endDate = phase.endDate ? this.formatDate(new Date(phase.endDate)) : '';
        this.minStartDate = startDate || this.minDate;

        this.phaseForm.patchValue({
            phaseName: phase.phaseName,
            startDate: startDate,
            endDate: endDate,
            description: phase.description || '',
            projetId: phase.projetId || this.projectId,
            status: phase.status
        });
    }

    onSubmit(): void {
        if (this.phaseForm.invalid) {
            this.phaseForm.markAllAsTouched();
            console.log('Form is invalid:', this.phaseForm.errors);
            return;
        }

        this.submitting = true;
        const formValue = this.phaseForm.value;

        const phaseData: Phase = {
            ...(this.isEditMode && this.data.phase?.phaseId ? { phaseId: this.data.phase.phaseId } : {}),
            phaseName: formValue.phaseName,
            status: formValue.status,
            startDate: formValue.startDate,
            endDate: formValue.endDate,
            description: formValue.description,
            projetId: formValue.projetId
        };

        if (this.isEditMode && this.data.phase?.phaseId) {
            this.phaseService.updatePhase(this.data.phase.phaseId, phaseData).subscribe({
                next: () => {
                    this.submitting = false;
                    this.dialogRef.close(true);
                },
                error: (err) => {
                    this.error = err.error?.error || 'Erreur lors de la mise à jour de la phase.';
                    if (err.status === 409) {
                        this.error = 'Conflit de données : vérifiez les informations saisies.';
                    }
                    this.submitting = false;
                    console.error('Erreur lors de la mise à jour :', err);
                }
            });
        } else {
            this.phaseService.createPhase(phaseData).subscribe({
                next: () => {
                    this.submitting = false;
                    this.dialogRef.close(true);
                },
                error: (err) => {
                    this.error = err.error?.error || 'Erreur lors de la création de la phase.';
                    if (err.status === 409) {
                        this.error = 'Conflit de données : vérifiez que le projet existe et que tous les champs sont valides.';
                    }
                    this.submitting = false;
                    console.error('Erreur lors de la création :', err);
                }
            });
        }
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    get f() {
        return this.phaseForm.controls;
    }

    startDateChanged(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.value) {
            this.minStartDate = input.value;
            this.phaseForm.updateValueAndValidity();
        }
    }

    dateRangeValidator(group: FormGroup): { [key: string]: any } | null {
        const startDate = group.get('startDate')?.value;
        const endDate = group.get('endDate')?.value;
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (start > end) return { dateRangeInvalid: true };
        }
        return null;
    }

    startDateValidator(group: FormGroup): { [key: string]: any } | null {
        const startDate = group.get('startDate')?.value;
        const isEditMode = this.isEditMode;
        if (startDate && !isEditMode) {
            const start = new Date(startDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (start < today) return { startDateInPast: true };
        }
        return null;
    }

    private formatDate(date: Date): string {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
}
