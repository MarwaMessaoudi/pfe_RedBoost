// src/app/pages/frontoffice/evaluation-form/evaluation-form.component.ts
import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// Angular Material Dialog imports
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { EvaluationService } from '../service/evaluation.service';
import { EvaluationForm } from '../../../models/evaluation.model';

// Angular Material module imports needed for the template components
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // For spinner

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-evaluation-form',
    standalone: true, // Or include in your app module if not standalone
    imports: [
        // Add modules used in the template
        CommonModule,
        ReactiveFormsModule, // Needed for FormBuilder and formGroup
        FormsModule, // Generally included with forms
        MatDialogModule, // Needed for dialogRef and MAT_DIALOG_DATA
        MatFormFieldModule, // For mat-form-field
        MatInputModule, // For matInput
        MatButtonModule, // For mat-button
        MatRadioModule, // For mat-radio-group/mat-radio-button
        MatIconModule, // If you add a close icon etc.
        MatProgressSpinnerModule // For the loading spinner
    ],
    templateUrl: './evaluation-form.component.html',
    styleUrls: ['./evaluation-form.component.scss'] // Or .css
})
export class EvaluationFormComponent implements OnInit {
    evaluationForm: FormGroup;
    submitting = false;
    submitted = false; // To show validation messages after attempt

    // Data passed to the dialog when it's opened
    phaseId: number;
    phaseName: string; // Display phase name in the header
    projectId: number; // Needed for linking in the backend payload
    projectName: string; // Needed for pre-filling the form
    userId: number; // Needed for backend linking
    userName: string; // Needed for pre-filling the form

    constructor(
        private fb: FormBuilder,
        // Inject MatDialogRef and MAT_DIALOG_DATA
        public dialogRef: MatDialogRef<EvaluationFormComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private evaluationService: EvaluationService // Inject your evaluation service
    ) {
        // Retrieve data passed from the opening component (PhaseListComponent)
        this.phaseId = data.phaseId;
        this.phaseName = data.phaseName;
        this.projectId = data.projectId; // Store project ID
        this.projectName = data.projectName; // Store project name
        this.userId = data.userId;
        this.userName = data.userName; // Store user name

        // Initialize the form with values from the passed data
        this.evaluationForm = this.fb.group({
            // Pre-fill Nom & prénom and Projet name, make them readonly/disabled
            // Use patchValue or setValue if you want to change values later, but for readonly, this is fine.
            nomPrenom: [{ value: this.userName, disabled: true }, Validators.required],
            projet: [{ value: this.projectName, disabled: true }, Validators.required],

            // Form controls for the evaluation questions
            // Initialize radio buttons with null so Validators.required works correctly
            satisfactionGlobale: [null, Validators.required],
            attentesReponse: [null, Validators.required],
            redStartCoachQualite: [null, Validators.required],
            ambianceGenerale: [null, Validators.required],
            coachCompetence: [null, Validators.required],
            coachComprehension: [null, Validators.required],
            communicationQualite: [null, Validators.required],

            // Optional textarea fields (start as empty string, no required validator)
            pointsForts: [''],
            pointsFaibles: [''],
            autreCommentaire: ['']
        });
    }

    ngOnInit(): void {
        // Any initialization logic after construction, if needed.
        // No explicit loading is needed as data is passed via injection.
    }

    // Helper getter for easy access to form controls in the template
    get f() {
        return this.evaluationForm.controls;
    }

    // Method to handle dialog closing, passes data back
    // closeDialog(): void {
    //     this.dialogRef.close('cancel'); // Indicate cancellation
    // }

    onSubmit(): void {
        this.submitted = true; // Flag to show validation messages

        // Mark all controls as touched to display validation messages even on untouched fields
        this.evaluationForm.markAllAsTouched();

        // Stop submission if the form is invalid (excluding disabled fields)
        if (this.evaluationForm.invalid) {
            console.warn('Evaluation form is invalid. Cannot submit.');
            return; // Stop here if form is invalid
        }

        this.submitting = true; // Disable submit button

        // Get form values, including disabled fields using getRawValue()
        const formValues = this.evaluationForm.getRawValue();

        // Construct the payload matching the backend EvaluationForm interface structure
        const payload: EvaluationForm = {
            nomPrenom: formValues.nomPrenom, // Value comes from disabled field
            projetName: formValues.projet, // Value comes from disabled field

            satisfactionGlobale: formValues.satisfactionGlobale,
            attentesReponse: formValues.attentesReponse,
            redStartCoachQualite: formValues.redStartCoachQualite,
            ambianceGenerale: formValues.ambianceGenerale,
            coachCompetence: formValues.coachCompetence,
            coachComprehension: formValues.coachComprehension,
            communicationQualite: formValues.communicationQualite,

            pointsForts: formValues.pointsForts || null, // Send null for empty string if backend prefers
            pointsFaibles: formValues.pointsFaibles || null,
            autreCommentaire: formValues.autreCommentaire || null,

            // Include the references to User and Phase matching backend FKs
            user: { id: this.userId }, // Use the userId passed into the dialog
            phase: { phaseId: this.phaseId } // Use the phaseId passed into the dialog
            // projectId is not directly on backend EvaluationForm, only via Phase
        };

        console.log('Submitting evaluation payload:', payload);

        this.evaluationService.submitEvaluation(payload).subscribe({
            next: (response) => {
                console.log('Evaluation submitted successfully', response);
                this.submitting = false;
                // Close the dialog and pass a success indicator
                this.dialogRef.close('submitted');
            },
            error: (error) => {
                console.error('Error submitting evaluation', error);
                this.submitting = false;
                // Show a user-friendly error message
                const errorMessage = error.error?.message || "Une erreur s'est produite lors de la soumission.";
                // Use MatSnackBar here instead of alert for better UX
                // For simplicity, sticking with alert for now:
                alert(errorMessage);
                // OR better: this.snackBar.open(errorMessage, 'Fermer', { duration: 5000 });
            }
        });
    }
}
